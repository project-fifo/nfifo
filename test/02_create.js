
var nFifo = require('../index'),
	assert = require('assert')

function areSimilar(a, b) {
	Object.keys(a).forEach(function(k) {
		if (a[k] != b[k])
			return 'This are not similar: ' + a[k] + ' -> ' + b[k]
	})
	return true
}

describe('Create resources', function() {

	var fifo = null,
		prefix = 'nfifo-test-' + new Date().getTime() + '_'
		state = {},
		create = {
			package: {cpu_cap: 100, name: prefix + 'small', quota: 10, ram: 1024},
			iprange: {tag: 'admin', first: '1.1.1.10', gateway: '1.1.1.1', last: '1.1.1.20', name: prefix + 'range', netmask: '255.255.255.0', network: '1.1.1.0', tag: 'admin'},
			network: {name: prefix + 'network'},
			machine: {
				package: 'will-change',
				dataset: 'will-change',
				config: {
					networks: {
						net0: 'will-change'
					},
					metadata: {themeta: 'data'},
					alias: prefix + 'VM',
					hostname: prefix + 'VM',
				}
			}
		}

	//Connect
	before(function(done) {
		nFifo.connect(function(connectedInstance) {
			fifo = connectedInstance
			done()
		})
	})

	//Wipe all created resource
	after(function(done) {

		var n = 4
		function tick() {
			if (n <= 1) return done()
			n--
		}

		fifo.send('packages').delete(state.packageUUID, tick)
		fifo.send('ipranges').delete(state.iprangeUUID, tick)
		fifo.send('networks').delete(state.networkUUID, tick)
		fifo.send('vms').delete(state.vmUUID, tick)
	})

	describe('Package', function() {

		it('Can create', function(done) {

			fifo.send('packages').post({body: create.package}, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 303)
				state.packageUUID = res.headers.location.split('/').pop()
				done()
			})

		})

		it('Was created', function(done) {

			fifo.send('packages').get(state.packageUUID, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 200)
				assert(areSimilar(res.body, create.package))
				state.package = res.body
				done()
			})
		})


	})

	describe('Networking', function() {

		it('Create iprange', function(done) {

			fifo.send('ipranges').post({body: create.iprange}, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 303)
				state.iprangeUUID = res.headers.location.split('/').pop()
				done()
			})
		})

		it('Iprange created', function(done) {

			fifo.send('ipranges').get(state.iprangeUUID, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 200)
				assert(areSimilar(res.body, create.iprange))
				state.iprange = res.body
				done()
			})
		})

		it('Create network', function(done) {

			fifo.send('networks').post({body: create.network}, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 303)
				state.networkUUID = res.headers.location.split('/').pop()
				done()
			})
		})

		it('Network created', function(done) {

			fifo.send('networks').get(state.networkUUID, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 200)
				assert(areSimilar(res.body, create.network))
				state.iprange = res.body
				done()
			})
		})

		it('Associate iprange to network', function(done) {

			var net = state.networkUUID,
				range = state.iprangeUUID

			fifo.send('networks').put([net, 'ipranges', range], function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 204)
				done()
			})
		})

		it('Iprange asociated with network', function(done) {

			fifo.send('networks').get(state.networkUUID, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 200)
				assert(res.body.ipranges.indexOf(state.iprangeUUID) > -1)
				done()
			})
		})

	})

	describe('Virtual machine', function() {

		it('A dataset exists', function(done) {

			//Get a dataset to create the vm
			fifo.send('datasets').get(function(err, res) {
				assert.ifError(err)
				state.datasetUUID = res.body[0].uuid
				done()
			})
		})

		it('Create', function(done) {

			var vm = create.machine
			vm.package = state.packageUUID
			vm.config.networks.net0 = state.networkUUID
			vm.dataset = state.datasetUUID

			// console.log('---->', vm)

			fifo.send('vms').post({body: vm}, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 303)
				state.vmUUID = res.headers.location.split('/').pop()
				done()
			})
		})

		it('Was created succefull', function(done) {

			function getVMState(uuid, cb) {
				fifo.send('vms').get(uuid, function(err, res) {
					assert.ifError(err)
					assert.equal(res.statusCode, 200)
					cb(res.body.state)
				})
			}

			function checkVmIsRunning() {
				getVMState(state.vmUUID, function(status) {
					if (status === 'running')
						return done()

					if (status.indexOf('fail') > -1)
						assert.equal(true, false, 'VM was not created: ' + status)

					// console.log('---> status:', status)
					setTimeout(checkVmIsRunning, 1000)
				})
			}

			checkVmIsRunning()

		})

	})

})

