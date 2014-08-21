var Table = require('cli-table'),
	Stream = require('stream'),
	util = require('util')

var Writable = Stream.Writable
util.inherits(TableStream, Writable)

function TableStream(opts) {
	Writable.call(this, opts)
	this.text = ''
	this.resource = opts.resource
}

TableStream.prototype._write = function(chunk, encoding, cb) {
	this.text += chunk.toString()
	cb()
}

TableStream.prototype.end = function() {

	var txt = buildTable(this.resource, JSON.parse(this.text))
	console.log(txt)
}


var rowsDefinition = {
	packages: [
		{title: 'Name', getter: 'name'},
		{title: 'Ram', getter: 'ram'},
		{title: 'Cpu Cap', getter: 'cpu_cap'},
		{title: 'Quota', getter: 'quota'},
		{title: 'Compression', getter: 'compression'},
	],
	vms: [
		{title: 'Alias', getter: 'config.alias'},
		{title: 'State', getter: 'state'},
		{title: 'IP', getter: 'config.networks[0].ip'},
		{title: 'Ram', getter: 'config.ram'},
		{title: 'Cpu Cap', getter: 'config.cpu_cap'},
		{title: 'Cpu Share', getter: 'config.cpu_shares'},
		{title: 'Type', getter: 'config.type'},
		{title: 'Package', getter: 'package'},
		{title: 'Dataset', getter: 'config.dataset'},
		{title: 'Server', getter: 'hypervisor'},
	],
	datasets: [
		{title: 'Name', getter: 'name'},
		{title: 'Version', getter: 'version'},
		{title: 'OS', getter: 'os'},
		{title: 'Type', getter: 'type'},
		{title: 'Imported', getter: 'imported'},
		{title: 'Image Size', getter: 'image_size'},
	],
	hypervisors: [
		{title: 'Alias', getter: 'alias'},
		{title: 'Host', getter: 'host'},
		{title: 'Networks', getter: 'networks.join(", ")'},
		{title: 'Pool status', getter: 'pools.zones.health'},
		{title: 'Pool free space', getter: 'pools.zones.free'},
		{title: 'Total memory', getter: 'resources["total-memory"]'},
		{title: 'Free memory', getter: 'resources["free-memory"]'},
		{title: 'Product', getter: 'sysinfo.Product'},
		{title: 'vCPUs', getter: 'sysinfo["CPU Total Cores"]'},
		{title: 'Raid', getter: 'sysinfo["Zpool Profile"]'},
	],
	users: [
		{title: 'Name', getter: 'name'},
		{title: 'Active Org', getter: 'org'},
	],
	networks: [
		{title: 'Name', getter: 'name'},
	],
	ipranges: [
		{title: 'Name', getter: 'name'},
		{title: 'Tag', getter: 'tag'},
		{title: 'Network', getter: 'network'},
		{title: 'Netmask', getter: 'netmask'},
		{title: 'Gateway', getter: 'gateway'},
		{title: 'Used IPs', getter: 'used.length'},
		{title: 'Free IPs', getter: 'free.length'},
	],
	orgs: [
		{title: 'Name', getter: 'name'},
	],
	roles: [
		{title: 'Name', getter: 'name'},
	],
	dtrace: [
		{title: 'Name', getter: 'name'},
	],
}

function getValue(row, getter) {
	//TODO: eval is evil!
	var val = eval('row.' + getter)

	//If its a uuid, print a shorter version..
	if (val && val.length == 36 && val.split('-').length == 5)
		return val.split('-')[0]
	return val
}

function buildTable(resource, json) {

	var definition = rowsDefinition[resource],
		table = new Table({
			head: ['UUID'].concat(definition.map(function(r) {return r.title})),
			chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
			style: {head: ['green'], border: ['black']}
		})

	json.forEach(function(row) {

		var h = {},
			key = row.uuid

		h[key] = definition.map(function(def, idx) {
			return getValue(row, def.getter) || ''
		})

		table.push(h)
	})

	return table.toString()
}


module.exports = TableStream