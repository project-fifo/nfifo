//How nice... https://github.com/mikeal/request/issues/418
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

var request = require('request')

var Fifo = module.exports = function fifo(ip, api_version) {
	var schema = ip.indexOf('http') < 0? 'https://': ''

	this.ip = ip
	this.api_version = api_version || '0.1.0'
	this.endpoint = schema + ip + '/api/' + this.api_version + '/'

	this.defaultParams = {
		json: true,
		headers: {'x-full-list': true}
	}
}

//Explicit login
Fifo.prototype.login = function(user, pass, cb) {
	var body = {user: user, password: pass}

	this.send('sessions').post({body: body}, function(err, res, body) {
		if (err)
			return cb(err)

		//When running on the browser, we will not get the raw 303, but the redirected one. will be status 200
		if (typeof window == 'object') {

			if (res.statusCode != 200)
				return cb(new Error(body || ('Could not login :( ' + res.statusCode)))

			this.token = body.session
			return cb && cb(null, res, body)
		}

		if (res.statusCode != 303)
			return cb(new Error(body || ('Could not login :( ' + res.statusCode)))

		this.token = res.headers['x-snarl-token']
		cb && cb(null, res, body)

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
	for (var k in defaults) {

		if (typeof obj[k] == 'undefined')
			obj[k] = defaults[k]

		if (typeof obj[k] == 'object')
			merge(obj[k], defaults[k])
	}
	return obj
}

Fifo.prototype.buildParams = function(opts, defaultOpts) {

	//Opts can be a string, array or object.

	var params = {}

	//typeof [] is 'object' !!
	if (typeof opts == 'object' && !Array.isArray(opts))
		params = opts
	else
		params.args = opts

	//Args should be an array. if string put it in the array...
	if (params.args && !Array.isArray(params.args))
		params.args = [params.args]

	return this.addDefaults(params, defaultOpts)
}


//Add default values
Fifo.prototype.addDefaults = function(opts, defaultOpts) {

	var params = merge(opts, defaultOpts),
		url = this.endpoint + opts.resource

	if (opts.args)
		url += '/' + opts.args.join('/')

	//Put the default params/headers
	merge(params, this.defaultParams)

	params.url = url

	if (this.token)
		params.headers['x-snarl-token'] = this.token

	if (params.json)
		params.headers['content-type'] = 'application/json;charset=UTF-8'

	//If the request is json, request will transform it for us. if not, assume its json anyway :P
	if (!params.json)
		params.body = JSON.stringify(params.body)


	return params
}

function requestClosure(method, resource) {
	method = method || 'GET'

	//opts: {params: [], body: }
	return function req(opts, cb) {

			//If first params is a function, there is no options to pass
			if (typeof opts == 'function') {
				cb = opts
				opts = {}
			}

			var params = this.buildParams(opts, {method: method, resource: resource})

			// return request(params, cb)

			//In case the response is json, and json: true is not set, parse the body
			//i.e. https://jira.project-fifo.net/browse/FIFO-566
			return request(params, function(err, res, body) {
				if (typeof body === 'string' && (body[0] == '{' || body[0] == '['))
					try {
						body = JSON.parse(body || '{}')
					} catch(e){
						console.log('Could not parse body', e.message)
					}

				cb && cb(err, res, body)
			})
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
