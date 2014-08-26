#!/usr/bin/env node

var nFifo = require('../index.js'),
	minimist = require('minimist'),
	fs = require('fs'),
	TableOutput = require('../table-output')

nFifo.connect(function(fifo) {

	var argv = minimist(process.argv.slice(2), {
		boolean: ['stdin', 'file', 'json', 'curl', 'table'],
		default: {
			method: 'get',
			curl: false,
			json: true,
			file: false,
			stdin: false,
			table: true
		},
		alias: {
			'X': 'method'
		}
	})

	var arguments = argv._

	if (arguments.length < 1)
		return console.log('Call me with arguments! i.e. "packages"')

	var resource = arguments.shift()

	var remote = fifo.send(resource)[argv.method.toLowerCase()]({args: arguments, json: argv.json})

	//Check if we want to send something
	if (argv.file || argv.stdin) {
		var input = argv.stdin? process.stdin : fs.createReadStream(argv.file)
		input.pipe(remote).pipe(process.stdout)
	}
	else {
		//See if we wans table output, on the listing.
		var output = argv.table && arguments.length < 1 ? new TableOutput({resource: resource}): process.stdout
		remote.pipe(output)
	}

	remote.on('complete', function(res, body) {

		if (res.statusCode != 200)
			process.stderr.write('\n\nResponse Code: ' + res.statusCode + '\n')

		if (res.statusCode == 303) {
			process.stderr.write('UUID: ' + res.headers.location.split('/').pop() + '\n')
			process.stderr.write('Location: ' + res.headers.location + '\n')
		}

	})

	remote.on('error', function(err) {
		throw err
	})

	if (argv.curl)
		remote.on('request', function(req) {
			var url = req._headers.host + req.path,
				headers = Object.keys(req._headers).map(function(k) {
					return "-H '" + k + ": " + req._headers[k] + "'"
				}).join(' ')
			process.stderr.write('curl --insecure -i -X ' + req.method + ' ' + fifo.endpoint.split(':')[0] + '://' + url + ' ' + headers + '\n\n');
		})

})