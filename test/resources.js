
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
				done()
			})

		})
	})


	it('Can get packages', function(done) {

		fifo.send('packages').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see packages')
			done()
		})
	})


	it('Can get datasets', function(done) {

		fifo.send('datasets').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see datasets')
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

