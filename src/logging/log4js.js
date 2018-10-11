'use strict';

const fileAppender = require('./file');
const clustering = require('./clustering');
const LoggingEvent = require('./LoggingEvent');

let appender

function sendLogEventToAppender(logEvent) {
  if (!appender) return;
  appender(logEvent);
}

function configure(config) {
  clustering.init()

  appender = clustering.onlyOnMaster(() => {
    return fileAppender(config);
  }, () => {});

  clustering.onMessage(sendLogEventToAppender);

  return log4js;
}

/**
 * Shutdown all log appenders. This will first disable all writing to appenders
 * and then call the shutdown function each appender.
 *
 * @params {Function} cb - The callback to be invoked once all appenders have
 *  shutdown. If an error occurs, the callback will be given the error object
 *  as the first argument.
 */
function shutdown(cb) {
  appender.shutdown((err) => cb(err))
  appender = null
}

function log(...args) {
  const loggingEvent = new LoggingEvent('INFO', args);
  clustering.send(loggingEvent);
}

const log4js = {
  log,
  configure,
  shutdown
};

module.exports = log4js;
