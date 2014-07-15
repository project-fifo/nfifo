#!/usr/bin/env node

var nFifo = require('../index.js')


nFifo.connect(function(fifo) {

	var args = process.argv.slice(2)

	if (args.length < 1)
		return console.log('Call me with args! i.e. "packages"')		

	var resource = args.shift()

	fifo.send(resource).get(args, function(err, res) {
		if (err || res.statusCode > 300 || res.statusCode < 200 )
			return console.log(JSON.stringify({
				code: res.statusCode || 500,
				message: err
			}))

		console.log(JSON.stringify(res.body))
	})

})