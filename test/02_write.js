
var nFifo = require('../index'),
	assert = require('assert')

function areSimilar(a, b, recursive) {

	Object.keys(a).forEach(function(k) {
		if (typeof a[k] === 'object') {
			if (recursive)
				return areSimilar(a[k], b[k])
			else
				return true
		}

		// console.log('-->', k, a[k], b[k])
		assert.equal(a[k], b[k], 'This are not similar: ' + k + ' -> ' + a[k] + ' vs ' + b[k])
	})
}

describe('Write operations', function() {

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

		var n = 5
		function tick() {
			if (n <= 1) return done()
			n--
		}

		fifo.send('packages').delete(state.packageUUID, tick)
		fifo.send('ipranges').delete(state.iprangeUUID, tick)
		fifo.send('networks').delete(state.networkUUID, tick)
		fifo.send('vms').delete(state.vmUUID, tick)
		fifo.send('vms').delete(state.vmUUID, tick) //Twice, so it ensure the vm is deleted when the creation fails.
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
				areSimilar(create.package, res.body)
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
				assert(res.body.free.indexOf(create.iprange.first) > -1, 'Created iprange does not contain the first IP')
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
				areSimilar(create.network, res.body)
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

		it('Check if a dataset exists', function(done) {

			//Get the last dataset to create the vm
			fifo.send('datasets').get(function(err, res) {
				assert.ifError(err)
				assert(res.body.length && res.body.length > 0, 'Need a dataset to test vm creation. Please import one.')
				var dataset = res.body[res.body.length - 1]
				state.datasetUUID = dataset.uuid
				done()
				console.log('        using', dataset.name, dataset.version, dataset.uuid)
			})
		})

		it('Dry run fails for invalid vm data', function(done) {

			var vm = create.machine
			vm.package = null

			fifo.send('vms/dry_run').put({body: create.machine}, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 422, '422 was expected')
				done()
			})

		})

		it('Dry run reports success', function(done) {

			var vm = create.machine
			vm.package = state.packageUUID
			vm.config.networks.net0 = state.networkUUID
			vm.dataset = state.datasetUUID

			fifo.send('vms/dry_run').put({body: create.machine}, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 201, 'Didnt get a 201, but could be a temporary problem')
				done()
			})

		})

		it('Create', function(done) {

			fifo.send('vms').post({body: create.machine}, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 303)
				state.vmUUID = res.headers.location.split('/').pop()
				done()
			})
		})

		it('Update fifo metadata', function(done) {

			fifo.send('vms').put({args: [state.vmUUID, 'metadata', 'jingles'], body: {color: '#a4bdfc'}}, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 204)
				done()
			})

		})

		it('Metadata was saved', function(done) {
			fifo.send('vms').get(state.vmUUID, function(err, res) {
				assert.ifError(err)
				assert.equal(res.statusCode, 200)
				assert.equal(res.body.metadata.jingles.color, '#a4bdfc')
				done()
			})
		})

		it('Successfully created', function(done) {

			var startedAt = new Date().getTime()
			function checkVmIsRunning() {

				fifo.send('vms').get(state.vmUUID, function(err, res) {
					assert.ifError(err)
					assert.equal(res.statusCode, 200)

					areSimilar(create.machine, res.body, false)
					areSimilar(create.machine.config.metadata, res.body.config.metadata)

					var state = res.body.state

					if (state === 'running')
						return done()

					if (state.indexOf('fail') > -1)
						assert(false, 'State: ' + state + ' -> ' + res.body.log.map(function(l) {return l.log}).join(', ') )

					var took = new Date().getTime() - startedAt
					if (took > 50 * 1000)
						assert(false, 'Took too much, giving up. State: ' + state + ' -> ' + res.body.log.map(function(l) {return l.log}).join(', '))

					setTimeout(checkVmIsRunning, 1000)

				})

			}

			checkVmIsRunning()

		})

	})

})

