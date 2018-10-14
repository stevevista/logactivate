## install
### Prerequisites
- node >= 8.11.0
- gcc build tools or MSVC 2015/2017
- direct access to internet

Please read the guide on Nodejs.org to learn how to install node on linux or Windows

### Steps
```
$: git clone git@github.com:stevevista/logactivate.git 
# or download zipped file
$: cd logactivate
$: npm run setup

```

##  Start server
```
$: cd logactivate
$: node .
```

##  Stop server
```
CTRL + C
```
## Prebuilts
logactivate-linux-x64-x.x.x  Linux 64bit system
logactivate-win32-x.x.x.exe  Win32 system

just run prebuilts in console, dont missing config directory
```
C:\dev\logactivate>logactivate-win32-1.0.0.exe
http server on 3000, on 4 cores
...
```

## Configuration
Edit config/base.yml or config/production.yml, modifying server port, log file storage path, and etc.
default server port is 3000
```
port: 3000
logdir: storage
exceptionFilename: exceptions.log
exceptionFilesize: 1M
exceptionBackups: 100
```

## Server log
the server log is logactivate.log, default level is warning, you can modify the level in config

## API
* http://[IP Address]:[port]/log/record
  - method: POST
  - body: should be json encoded (application/json) or urlencoded
  - response: on success, HTTP response status will be 200, othewise, the status incidates error number, and responseBody contain json message { message: xxxxx }
  - notice: All information in http body will be append to logfiles (default is storage/exceptions.log)

* http://[IP Address]:[port]/log/upload
  - method: POST
  - body: multipart format, contain field imei && a attached file
  - response: on success, HTTP response status will be 200, othewise, the status incidates error number, and responseBody contain json message { message: xxxxx }
  - notice: the file will be stored in storage/[imei]/orginalFilename