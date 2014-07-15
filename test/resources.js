
var nFifo = require('../index'),
	assert = require('assert')


var fifo = null

describe('Basic resource quering', function() {


	before(function(done) {
		nFifo.connect(function(connectedInstance) {
			fifo = connectedInstance
			done()
		})
	})

	it('Can login', function(done) {
		done()
	})

	it('Can get users', function(done) {

		fifo.send('users').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see the users')
			done()
		})
	})

	it('Can get vms', function(done) {

		fifo.send('vms').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see vms')
			done()
		})
	})

	it('Can get 1 vms', function(done) {

		fifo.send('vms').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see vms')

			fifo.send('vms').get(res.body[0].uuid, function(err, res) {
				assert.equal(typeof res.body, 'object', 'Cannot see vm')
				assert.equal(typeof res.body.config.alias, 'string', 'Whats the alias of the vm?')
				done()
			})

		})
	})


	it('Can get 1 and all packages', function(done) {

		fifo.send('packages').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see packages')

			fifo.send('packages').get(res.body[0].uuid, function(err, res) {
				assert.equal(typeof res.body.quota, 'number', 'Quota?')
				done()
			})

		})
	})


	it('Can get datasets', function(done) {

		fifo.send('datasets').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see datasets')
			done()
		})
	})

	it('Respond 404 on unknown dataset', function(done) {

		fifo.send('datasets').get('unknown', function(err, res) {
			assert.equal(res.statusCode, 404, 'Should be 404...')
			done()
		})
	})

	it('Can get hypervisors', function(done) {

		fifo.send('hypervisors').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see hypervisors')
			done()
		})
	})


})

