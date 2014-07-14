//How nice... https://github.com/mikeal/request/issues/418
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

var request = require('request')

var Fifo = module.exports = function fifo(ip, api_version) {
	this.ip = ip
	this.api_version = api_version || '0.1.0'
	this.endpoint = 'https://' + ip + '/api/' + this.api_version + '/'
}

//Explicit login
Fifo.prototype.login = function(user, pass, cb) {
	var body = {user: user, password: pass}

	this.send('sessions').post({body: body}, function(err, res) {
		if (err)
			cb(err)

		if (res.statusCode != 303)
			return cb(new Error('Could not login :('))

		this.token = res.headers['x-snarl-token']
		cb && cb(null, res)

	}.bind(this))	
}

//Try to reutilize token. if not, login.
Fifo.prototype.access = function(user, pass, cb) {
	if (this.token) {
		this.send('sessions').get(this.token, function(err, res) {
			if (err)
				return cb(err)

			if (res.statusCode === 200)
				return cb(null, res)

			this.login(user, pass, cb)
		}.bind(this))
	}
	else
		this.login(user, pass, cb)

	return this
}


//Merge default options into obj
function merge(obj, defaults) {
	for (var k in defaults)
		if (!obj[k])
			obj[k] = defaults[k]
	return obj
}

Fifo.prototype.buildParams = function(opts, defaultOpts) {

	//Opts can be a string, array or object.

	var params = {}

	if (typeof opts != 'object')
		params.args = opts
	else
		params = opts

	//Args should be an array. if not build one...
	if (!Array.isArray(params.args))
		params.args = [params.args]

	return this.addDefaults(params, defaultOpts)

}


//Add default values
Fifo.prototype.addDefaults = function(opts, defaultOpts) {

	var params = merge(opts, defaultOpts),
		url = this.endpoint + opts.resource

	if (opts.args)
		url += '/' + opts.args.join('/')

	merge(params, {
		json: true,
		url:  url,
		headers: {'x-snarl-token': this.token, 'x-full-list': true }
	})

	return params
}


function requestClosure(method, resource) {
	method = method || 'GET'

	//opts: {params: [], body: }
	return function req(opts, cb) {

			//If params specified, the first parameter will be the callback. (i.e. to get all the vms.)
			if (!cb) {
				cb = opts
				opts = {}
			}

			var params = this.buildParams(opts, {method: method, resource: resource})
			request(params, cb)
	}
}


//Send a message to a fifo resource. Could be vms, hypervisors, etc.
Fifo.prototype.send = function(resource) {

	if (resource != 'sessions' && !this.token)
		throw new Error('No token!')

	return {
		get: requestClosure('GET', resource).bind(this),
		post: requestClosure('POST', resource).bind(this),
		delete: requestClosure('DELETE', resource).bind(this),
		put: requestClosure('PUT', resource).bind(this)
	}
}
