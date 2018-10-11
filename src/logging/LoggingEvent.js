const CircularJSON = require('circular-json');

/**
 * @name LoggingEvent
 * @namespace Log4js
 */
class LoggingEvent {
  /**
   * Models a logging event.
   * @constructor
   * @param {Log4js.Level} level level of message
   * @param {Array} data objects to log
   * @author Seth Chisamore
   */
  constructor(level, data) {
    this.startTime = new Date();
    this.data = data;
    this.level = level;
    this.pid = process.pid;
  }

  serialise() {
    const logData = this.data.map((e) => {
      // JSON.stringify(new Error('test')) returns {}, which is not really useful for us.
      // The following allows us to serialize errors correctly.
      if (e && e.message && e.stack) {
        e = Object.assign({ message: e.message, stack: e.stack }, e);
      }
      return e;
    });
    this.data = logData;
    return CircularJSON.stringify(this);
  }

  static deserialise(serialised) {
    let event;
    try {
      const rehydratedEvent = CircularJSON.parse(serialised);
      rehydratedEvent.data = rehydratedEvent.data.map((e) => {
        if (e && e.message && e.stack) {
          const fakeError = new Error(e);
          Object.keys(e).forEach((key) => { fakeError[key] = e[key]; });
          e = fakeError;
        }
        return e;
      });
      event = new LoggingEvent(
        rehydratedEvent.level,
        rehydratedEvent.data
      );
      event.startTime = new Date(rehydratedEvent.startTime);
      event.pid = rehydratedEvent.pid;
      event.cluster = rehydratedEvent.cluster;
    } catch (e) {
      event = new LoggingEvent(
        'ERROR',
        ['Unable to parse log:', serialised, 'because: ', e]
      );
    }

    return event;
  }
}

module.exports = LoggingEvent;
