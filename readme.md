# Develop
## Prerequisites
- node >= 10.0.0
- gcc build tools or MSVC 2015/2017
- MongoDB

Please read the guide on Nodejs.org to learn how to install node on linux or Windows

## Install and run
```
$: git clone git@github.com:stevevista/logactivate.git 
$: cd logactivate
$: npm i
$: npm run build
$: node .

```

## Run in development
```
npm run dev
```

It should display `http server on 3000, on 4 cores`

If stucked on installing packages, try swicth to `npm i --registry https://registry.npm.taobao.org`

##  Pack to single executable
```
$: npm run pack
```
The executable binaries will be generated in ./release

## Server log
the server log is avaible as logactivate.log

# Configuration
* config/base.yml

  basic configuration, such as server port, storage path, and etc.
* config/production.yml

  configuration for production, will override basic configuration
* config/development.yml

  configuration for development, will override basic configuration

full configurations:
```
port: 3001
cluster: true
logdir: storage
tmpdir: tmp
ssldir: ssl
ssl: true
appLogLevel: warn
appLogSize: 31457280
appLogFilename: logactivate.log
maxUploadFileSize: 200 * 1024 * 1024
dbUrl: 'mongodb://localhost/logactivate'
session:
  secrets: abcd.1234
  maxAge: 24 * 60 * 60 * 1000
ota:
  firmwareDir: storage/firmwares
sysadmin:
  username: sysadmin
  password: sysadmin
```

# API
## Log
### http://[host]/log/report
  - method: POST
  - fields:
    * imei required
    * sn
    * latitude
    * longitude
    * sw_version
    * hw_version
    * bb_version
  - body: should be json encoded (application/json) or urlencoded
  - response: on success, HTTP response status will be 2xx, othewise, the status incidates error number, and responseBody contain error message
  - notice: All information in http body will be append to logfiles (default is storage/exceptions.log)

- A typcial request
```
curl http://localhost:3001/log/report -d "imei=777&exception=ddsfsdf&sw_version=1.1.0&latitude=0.032&longitude=12.000"
```
------------------------------------------------------
### http://[host]/log/upload
  - method: POST
  - fields:
    * imei required
    * file reuqired
  - body: multipart format, contain field imei && a attached file
  - response: on success, HTTP response status will be 2xx, othewise, the status incidates error number, and responseBody contain error message
  - notice: the file will be stored in storage/[imei]/orginalFilename
  - A typcial request:
```
curl -F "file=@data.bin" -F "imei=777" http://localhost:3001/log/upload
```
suppose the data.bin content is 'data', the HTTP body data will be
```
--------------------------8d7d3d79e075f69d
Content-Disposition: form-data; name="file"; filename="card.txt"
Content-Type: text/plain

data
--------------------------8d7d3d79e075f69d
Content-Disposition: form-data; name="imei"

222222222
--------------------------8d7d3d79e075f69d--
...
```

#### Split large upload file to multi-trunks
```
curl -F "file=@data.bin" -F "imei=222222222" -F "trunks=1" http://localhost:3001/log/upload
curl -F "file=@data.bin" -F "imei=222222222" -F "trunks=2" http://localhost:3001/log/upload
...
curl -F "file=@data.bin" -F "imei=222222222" -F "trunks=N" -F "eot=1" http://localhost:3001/log/upload
```
* keep the filename and imei the same
* start from 1
* when upload last trunk, append field 'eot=1' (means End Of Truncks)
* the server will merge all trunks to one file

## OTA
### Web admin
* http://localhost:3001/
* login with sysadmin, password: sysadmin (configured in config/base.yml)
* in OTA page, upload the firmware package

* query version by http://localhost:3001/ota/versions
```
[{"name":"package.bin","version":"werwer","description":"werwr","updatedAt":"2018-10-23T12:45:22.986Z","firmware":"http://localhost:3001/ota/download/818d6680-d6c1-11e8-876f-35038de47c60"}, {...}, {...}]

```
* download firmware by url indicated
### Continue download
* download firmware, write bytes to file
* connection broken, remember the last write position LAST_POSITION
* download request again, but set HTTP headers 
```
Range: bytes=12345678-
```
* append bytes to file

## Security
### the following APIs is unsafe. restricting access will be considered in future
* /log/report
* /log/upload
* /ota/version
* /ota/versions
* /ota/download/...
### HTTPS
put certification files in ssl directory to enable SSL

# Web interface
