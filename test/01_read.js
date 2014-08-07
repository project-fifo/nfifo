
var nFifo = require('../index'),
	assert = require('assert')


describe('Read operations', function() {

	var fifo = null,
		state = {}

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

	it('Can get the vms', function(done) {
		fifo.send('vms').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see vms')
			state.vms = res.body
			done()
		})
	})

	it('Can get 1 vm', function(done) {
		fifo.send('vms').get(state.vms[0].uuid, function(err, res) {
			assert.equal(typeof res.body, 'object', 'Cannot see vm')
			assert.equal(typeof res.body.config.alias, 'string', 'Whats the alias of the vm?')
			done()
		})
	})


	it('Can get the packages', function(done) {

		fifo.send('packages').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see packages')
			state.packages = res.body
			done()
		})
	})

	it('Can get 1 package', function(done) {
		fifo.send('packages').get(state.packages[0].uuid, function(err, res) {
			assert.equal(typeof res.body.quota, 'number', 'No quota?')
			done()
		})

	})

	it('Can get the datasets', function(done) {
		fifo.send('datasets').get(function(err, res) {
			assert.equal(res.body.length > 0 ,true, 'Cannot see datasets')
			state.datasets = res.body
			done()
		})
	})

	it('Can get 1 datasets', function(done) {
		fifo.send('datasets').get(state.datasets[0].uuid, function(err, res) {
			assert.equal(typeof res.body, 'object', 'Cannot see the dataset')
			done()
		})
	})

	it('404 for unknown dataset', function(done) {
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

