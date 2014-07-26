#!/usr/bin/env node

var nFifo = require('../index.js'),
	minimist = require('minimist')

nFifo.connect(function(fifo) {

	var argv = minimist(process.argv.slice(2), {
		default: {
			method: 'get',
			curl: false,
			json: true
		}
	})

	var arguments = argv._

	if (arguments.length < 1)
		return console.log('Call me with arguments! i.e. "packages"')

	var resource = arguments.shift()

	var remote = fifo.send(resource)[argv.method]({args: arguments, json: argv.json === true})

	remote.pipe(process.stdout)

	remote.on('complete', function(res, body) {
		if (res.statusCode != 200)
			process.stderr.write('\n\nResponse Code: ' + res.statusCode + '\n');
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
			process.stderr.write('curl -i -X ' + req.method + ' ' + fifo.endpoint.split(':')[0] + '://' + url + ' ' + headers + '\n\n');
		})

})