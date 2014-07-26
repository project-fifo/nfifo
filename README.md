# nFiFo

This is a little handy node lib to connect to fifo.

It does not pretend to be the official node.js fifo libray, wich is probably what [fifo.js](https://github.com/project-fifo/fifo.js) is, nor the oficial CLI client, wich is [pyfi](https://github.com/project-fifo/pyfi).

It just lets you quickly query the [fifo api](https://project-fifo.net/display/PF/API).

It will read the file ~/.fifo just like pyfi to read the credentials

## How to use it

* [As a dep](https://github.com/project-fifo/nfifo/tests/)
* As a cli wich outputs plain json (TODO: npm install nfifo -g)
	* ```./bin/cmd.js hypervisors | json  -a host alias sysinfo.Product```
	* ```./bin/cmd.js datasets 8639203c-d515-11e3-9571-5bf3a74f354f```
	* ```./bin/cmd.js --method delete datasets 22857ea9a0-f965-11e2-b778-0800200c9a66```
	* ```./bin/cmd.js --curl true packages```
	* ```./bin/cmd.js --json false datasets d763e880-c669-11e3-b742-0f142d68b997 dataset.gz > file.zvol.gz```

* To upload a dataset:
```
./bin/upload-dataset.js --zvol file.zvol.gz --manifest manifest_file.json
Uploading (19.0s) [===========----------------------------------------------------------------------] 17% ETA 90.8s
```


