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

## Configuration
Edit config/config.json or config/config.production.json, modifying server port, log file storage path, and etc.

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
