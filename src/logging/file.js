'use strict';

const debug = require('debug')('log4js:file');
const path = require('path');
const streams = require('streamroller');
const os = require('os');
const dateFormat = require('date-format');
const util = require('util');

function maxFileSizeUnitTransform(maxLogSize) {
  if (typeof maxLogSize === 'number' && Number.isInteger(maxLogSize)) {
    return maxLogSize;
  }

  const units = {
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
  };
  const validUnit = Object.keys(units);
  const unit = maxLogSize.substr(maxLogSize.length - 1).toLocaleUpperCase();
  const value = maxLogSize.substring(0, maxLogSize.length - 1).trim();

  if (validUnit.indexOf(unit) < 0 || !Number.isInteger(Number(value))) {
    throw Error(`maxLogSize: "${maxLogSize}" is invalid`);
  } else {
    return value * units[unit];
  }
}

function adapter(configAdapter, config) {
  const newConfig = Object.assign({}, config);
  Object.keys(configAdapter).forEach((key) => {
    if (newConfig[key]) {
      newConfig[key] = configAdapter[key](config[key]);
    }
  });
  return newConfig;
}

function fileAppenderAdapter(config) {
  const configAdapter = {
    maxLogSize: maxFileSizeUnitTransform
  };
  return adapter(configAdapter, config);
}

const eol = os.EOL || '\n';

function timestampLevelAndCategory(loggingEvent, timezoneOffset) {
  return util.format(
      '[%s] [%s] - '
      , dateFormat.asString(loggingEvent.startTime, timezoneOffset)
      , loggingEvent.level
    )
}

function basicLayout(loggingEvent, timezoneOffset) {
  return timestampLevelAndCategory(
    loggingEvent,
    timezoneOffset
  ) + util.format(...loggingEvent.data);
}

function openTheStream(file, fileSize, numFiles, options) {
  const stream = new streams.RollingFileStream(
    file,
    fileSize,
    numFiles,
    options
  );
  stream.on('error', (err) => {
    console.error('log4js.fileAppender - Writing to file %s, error happened ', file, err); //eslint-disable-line
  });
  return stream;
}

function fileAppender(file, logSize, numBackups, options, timezoneOffset) {
  file = path.normalize(file);
  numBackups = numBackups === undefined ? 5 : numBackups;
  // there has to be at least one backup if logSize has been specified
  numBackups = numBackups === 0 ? 1 : numBackups;

  debug(
    'Creating file appender (',
    file, ', ',
    logSize, ', ',
    numBackups, ', ',
    options, ', ',
    timezoneOffset, ')'
  );

  const writer = openTheStream(file, logSize, numBackups, options);

  const app = function (loggingEvent) {
    writer.write(basicLayout(loggingEvent, timezoneOffset) + eol, 'utf8');
  };

  app.reopen = function () {
    writer.closeTheStream(writer.openTheStream.bind(writer));
  };

  app.sighupHandler = function () {
    debug('SIGHUP handler called.');
    app.reopen();
  };

  app.shutdown = function (complete) {
    process.removeListener('SIGHUP', app.sighupHandler);
    writer.write('', 'utf-8', () => {
      writer.end(complete);
    });
  };

  // On SIGHUP, close and reopen all files. This allows this appender to work with
  // logrotate. Note that if you are using logrotate, you should not set
  // `logSize`.
  process.on('SIGHUP', app.sighupHandler);

  return app;
}

function configure(config) {
  config = fileAppenderAdapter(config)
  return fileAppender(
    config.filename,
    config.maxLogSize,
    config.backups,
    config,
    config.timezoneOffset
  );
}

module.exports = configure
