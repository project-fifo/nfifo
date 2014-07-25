#!/usr/bin/env node

var nFifo = require('../index.js'),
	minimist = require('minimist'),
	fs = require('fs'),
	assert = require('assert'),
	Progress = require('progress')

var argv = minimist(process.argv.slice(2), {
	default: {
		zvol: false,
		manifest: false,
	}
})

if (argv.help || argv.h || !argv.zvol || !argv.manifest)
	return console.log('Options:', ['--zvol <file.zvol.gz> ', '--manifest <file.json>'].join(' '))

function validateFiles(argv) {

	assert.equal(argv.zvol.slice(-7), 'zvol.gz', 'zvol is not a .zvol.gz file')
	assert.equal(argv.manifest.slice(-4), 'json', 'manifest is not a .json file')
	assert.equal(fs.existsSync(argv.zvol), true, 'zvol file ' + argv.zvol + ' does not exist')
	assert.equal(fs.existsSync(argv.manifest), true, 'manifest file ' + argv.zvol + ' does not exist')

}

function parseManifest(file) {
	var content = fs.readFileSync(file)
	try {
		return JSON.parse(content)
	}
	catch (e) {
		throw new Error(file + ' is not really a json file')
	}
}

function validateManifest(manifest, zvolFile) {

	var fieldsThatShouldExists = ['uuid', 'name', 'version', 'published_at', 'type', 'os', 'files', 'description', 'homepage', 'urn', 'requirements', 'creator_name'] //, 'creator_uuid']

	//Basic field validation
	fieldsThatShouldExists.forEach(function(field) {
		assert.notEqual(typeof manifest[field], 'undefined', 'Manifest should have the field ' + field)
	})

	//The first files path should have the same name as the zvol. We could actually fill that value...
	var declaredZvol = manifest.files[0]
	// assert.equal(zvolFile, declaredZvol.path, 'Manifest zvol file path ' + declaredZvol.path + ' != ' + zvolFile)

	var size = fs.statSync(zvolFile).size
	assert.equal(size, declaredZvol.size, 'Manifest zvol size ' + declaredZvol.size + ' != ' + size)

	//TODO: check the sha1...

}


/* ------------------------------------------------------------------------- */



validateFiles(argv)

var manifest = parseManifest(argv.manifest)

validateManifest(manifest, argv.zvol)

nFifo.connect(function(fifo) {

	//Check if the manifest does not exists already
	fifo.send('datasets').get(manifest.uuid, function(err, res, body) {

		if (res.statusCode == 200) {
			assert.equal(body.status, 'pending', 'The dataset already exists and is not in pending state')
			console.log('Manifest', manifest.uuid, '(' + manifest.name + ')', 'in pending mode, will not upload it again.')
			uploadZvol(fifo, argv.zvol, manifest)
		}

		else {
			assert.equal(res.statusCode, 404, 'Expected to get a 404 here: ' + res.statusCode)

			//Upload the manifest
			fifo.send('datasets').post({args: manifest.uuid, body: manifest}, function(err, res, body) {
				assert.equal(res.statusCode, 201, 'Could not upload manifest: ' + res.statusCode)
				uploadZvol(fifo, argv.zvol, manifest)
			})
		}
	})
})

function uploadZvol(fifo, fileName, manifest) {

	var remote = fifo.send('datasets').put({
		args: [manifest.uuid, 'dataset.gz'],
		json: false,
		headers: {'content-type': 'application/x-gzip'}
	}, function(err, res, body) {
		assert.equal(res.statusCode == 200 || res.statusCode == 204, true, 'Dataset was not sucessfull uploaded: ' + res.statusCode + ' -> ' + (err || body))
		console.log('Uploaded ok!', res.statusCode)
	})

	var read = fs.createReadStream(fileName)

	var bar = new Progress('Uploading (:elapseds) [:bar] :percent ETA :etas', {
		total: manifest.files[0].size
	})

	read.on('data', function(chunk) {
		bar.tick(chunk.length)
	})

	read.pipe(remote)

}

