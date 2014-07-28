# nFiFo

This is a little handy node lib to connect to [Project FiFo](https://docs.project-fifo.net/), an VM administration system that uses [SmartOS](http://smartos.org/).

It does not pretend to be the official node.js fifo libray, wich is probably what [fifo.js](https://github.com/project-fifo/fifo.js) is, nor the oficial CLI client, wich is [pyfi](https://github.com/project-fifo/pyfi).

It just lets you quickly query the [fifo api](https://project-fifo.net/display/PF/API).

It will read the file ~/.fifo just like pyfi to read the credentials

## How to use it

Check out an example [here](https://github.com/project-fifo/nfifo/tests/).

Additionally, you can install it as a CLI, with **npm install nfifo -g**:

* Show all hypervisors aliases and ip's

  ``` nfifo hypervisors | json  -a host alias sysinfo.Product```

* Show dataset base64-14.1.0 details

 ```nfifo datasets 8639203c-d515-11e3-9571-5bf3a74f354f | prettyjson```

* Delete dataset base64-14.1.0

 ```nfifo --method delete datasets 8639203c-d515-11e3-9571-5bf3a74f354f```

* Show all packages, with curl tip

 ```nfifo --curl true packages```


* Dump the zvol of the dataset base64-14.1.0 to a file

 ```nfifo --json false datasets 8639203c-d515-11e3-9571-5bf3a74f354f dataset.gz > file.zvol.gz```

* Create a new package, from stdin

 ``` echo '{"cpu_cap": 100, "name": "small", "quota": 10, "ram": 1024}' | nfifo --method post --stdin packages```

* Create a new VM, from file

 ``` nfifo --method post --file ./vm_spec.json vms```

* Upload a dataset:
```
nfifo-upload-dataset.js --zvol file.zvol.gz --manifest manifest_file.json
Uploading (19.0s) [===========----------------------------------------------------------------------] 17% ETA 90.8s
```


**Note:**
  *prettyjson* and *json* can be install with npm install -g ...