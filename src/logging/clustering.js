const debug = require('debug')('log4js:clustering');
const LoggingEvent = require('./LoggingEvent');
const cluster = require('cluster');

const listeners = [];

const isMaster = () => cluster.isMaster

const sendToListeners = (logEvent) => {
  listeners.forEach(l => l(logEvent));
};

// in a multi-process node environment, worker loggers will use
// process.send
const receiver = (worker, message) => {
  // prior to node v6, the worker parameter was not passed (args were message, handle)
  debug('cluster message received from worker ', worker, ': ', message);
  if (worker.topic && worker.data) {
    message = worker;
    worker = undefined;
  }
  if (message && message.topic && message.topic === 'log4js2:message') {
    debug('received message: ', message.data);
    const logEvent = LoggingEvent.deserialise(message.data);
    sendToListeners(logEvent);
  }
};

function init () {
  // clear out the listeners, because configure has been called.
  listeners.length = 0;

  debug(`cluster.isMaster ? ${cluster.isMaster}`);

  // just in case configure is called after shutdown
  if (cluster.removeListener) {
    cluster.removeListener('message', receiver);
  }

  if (cluster.isMaster) {
    debug('listening for cluster messages');
    cluster.on('message', receiver);
  } else {
    debug('not listening for messages, because we are not a master process');
  }
}

module.exports = {
  init,
  onlyOnMaster: (fn, notMaster) => (isMaster() ? fn() : notMaster),
  isMaster: isMaster,
  send: (msg) => {
    if (isMaster()) {
      sendToListeners(msg);
    } else {
        msg.cluster = {
          workerId: cluster.worker.id,
          worker: process.pid
        };
      process.send({ topic: 'log4js2:message', data: msg.serialise() });
    }
  },
  onMessage: (listener) => {
    listeners.push(listener);
  }
};
