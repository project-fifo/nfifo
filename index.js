//Handy helper, that read use .fifo file, and setup fifo connector instance

var Fifo = require('./fifo'),
	ini = require('ini'),
	fs = require('fs')

var fname = (process.env.HOME || '/root') + '/.fifo'

function writeConfigFile(config) {
	var i = ini.stringify(config, 'fifo_default')
	fs.writeFileSync(fname, i)	
}

//Check for the .fifo config file
if (!fs.existsSync(fname)) {
	writeConfigFile({
		host: 'host',
		user: 'user',
		pass: 'pass'
	})
	console.log('Just wrote a default ~/.fifo file. Set it up and run me again!')
	process.exit(1)
}

var config = ini.parse(fs.readFileSync(fname, 'utf-8')).fifo_default,
	fifo = new Fifo(config.host)

//Try to use the token in the config file.
if (config.token) fifo.token = config.token


function connect(cb) {
	fifo.access(config.user, config.pass, function(err, res) {
		if (err)
			throw err

		//If the config token did not succeed, write the new one there
		if (config.token != fifo.token) {
			config.token = fifo.token
			writeConfigFile(config)
		}

		cb(fifo)
	})
}

module.exports = {
	connect: connect,
	// Fifo: Fifo
}

