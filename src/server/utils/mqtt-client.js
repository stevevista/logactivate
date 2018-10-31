'use strict'

const crypto = require('crypto')
const mqtt = require('mqtt')
const EventEmitter = require('events')
const util = require('util')
const debug = require('debug')('device:iot')

const BROKER_URL = 'mqtt://%s.iot-as-mqtt.%s.aliyuncs.com'
const DEFAULT_REGION_ID = 'cn-shanghai'
const tlsPrefix = ['tls://', 'mqtts://', 'wss://']


function hmacSign(type, secret, content) {
  return crypto.createHmac(type, secret).update(content).digest('hex')
}

function createGuid() {
  var id = 1
  return function () {
    return String(id++)
  }
}

const guid = createGuid()

function mqttMatch(filter, topic) {
  const filterArray = filter.split('/')
  const length = filterArray.length
  const topicArray = topic.split('/')

  for (let i = 0; i < length; ++i) {
    const left = filterArray[i]
    const right = topicArray[i]
    if (left === '#') return true
    if (left !== '+' && left !== right) return false
  }

  return length === topicArray.length
}

class MqttClient extends EventEmitter {
  constructor(config = {}) {
    super()

    const {productKey, deviceName, deviceSecret} = config
    if (productKey && deviceName && deviceSecret) {
      // Is Aliyun IOT account
      const timestamp = Date.now()
      const signAlgorithm = config.signAlgorithm || 'sha1'
      let _securemode = 3
      if (config.brokerUrl && tlsPrefix.some(prefix => config.brokerUrl.startsWith(prefix))) {
        _securemode = 2
      }
  
      config.brokerUrl = config.brokerUrl || util.format(BROKER_URL, productKey, config.regionId || DEFAULT_REGION_ID)
  
      const orgiClientId = config.clientId ? config.clientId + '_aliyun-iot-device-sdk-js' : productKey + '&' + deviceName + '_aliyun-iot-device-sdk-js'
      config.clientId = orgiClientId + '|securemode=' + _securemode + ',signmethod=hmac' + signAlgorithm + ',timestamp=' + timestamp + '|'
      config.username = deviceName + '&' + productKey
      config.password = hmacSign(signAlgorithm, deviceSecret, 'clientId' + orgiClientId + 'deviceName' + deviceName + 'productKey' + productKey + 'timestamp' + timestamp)
    }

    this.config = config
    this.clientId = config.clientId

    // start
    this.onReady = this.createOnReady()
    this.subscribeAndListen = this.createSubTopicAndOnMessage()
  }

  createOnReady() {
    let inited = false
    let callbacks = []

    const {clientId, username, password, brokerUrl} = this.config
    this._mqttClient = mqtt.connect(brokerUrl, {
      clientId,
      username,
      password
    })
    const events = ['connect', 'error', 'close', 'reconnect', 'offline', 'message']
    events.forEach(evtName => {
      this._mqttClient.on(evtName, (...args) => {
        this.emit(evtName, ...args)

        if (!inited && evtName === 'connect') {
          // resolve callbacks
          inited = true
          callbacks.forEach(cb => cb())
          callbacks = []
        }
      })
    })

    return function (cb) {
      if (cb) {
        if (inited) {
          cb()
        } else {
          callbacks.push(cb)
        }
      }
    }
  }

  createSubTopicAndOnMessage() {
    var callbacks = []
    this.onReady(() => {
      this._mqttClient.on('message', (topic, message) => {
        callbacks.forEach(m => {
          if (mqttMatch(m.subTopic, topic)) {
            m.callback(null, topic, message)
          }
        })
      })
    })

    return (subTopic, cb) => {
      const fn = {
        subTopic: subTopic,
        callback: cb
      }
      callbacks.push(fn)

      const unsubTopicAndOnMessage = async () => {
        try {
          await this.unsubscribe(subTopic)
        } catch (err) {
          debug('un sub error:', subTopic, err)
        } finally {
          callbacks = callbacks.filter(c => fn !== c)
        }
      }

      this.onReady(async () => {
        try {
          await this.subscribe(subTopic)
        } catch (err) {
          cb(err)
          unsubTopicAndOnMessage()
        }
      })

      return unsubTopicAndOnMessage
    }
  }

  publish(topic, payload) {
    return new Promise((resolve, reject) => {
      this._mqttClient.publish(topic, payload, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
  
  subscribe(topic) {
    return new Promise((resolve, reject) => {
      this._mqttClient.subscribe(topic, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  unsubscribe(topic) {
    return new Promise((resolve, reject) => {
      this._mqttClient.unsubscribe(topic, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  end() {
    return new Promise((resolve, reject) => {
      this._mqttClient.end((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  rpc({params, method, pubTopic, timeout, replyTopic}) {

    const msg = {
      id: guid(),
      version: '1.0',
      params,
      method
    }
    const {id} = msg
    const payload = JSON.stringify(msg)

    return new Promise((resolve, reject) => {
      const unsubReply = this.subscribeAndListen(replyTopic, function (err, topic, message) {
        if (err) {
          unsubReply()
          return reject(err)
        }
        message = JSON.parse(message.toString())
        if (message && message.id === id) {
          clearTimeout(timer)
          unsubReply()
          resolve(message)
        }
      })

      const timer = setTimeout(function () {
        unsubReply()
        reject(new Error('sub reply timeout: ' + replyTopic))
      }, timeout || 10000)

      this._mqttClient.publish(pubTopic, payload, (err, res) => {
        if (err) {
          clearTimeout(timer)
          unsubReply()
          reject(err)
        }
      })
    })
  }
}

module.exports = MqttClient
