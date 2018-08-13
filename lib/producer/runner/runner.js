module.exports = class SenecaRunner extends BaseRunner {
  // seneca runner
  _runner(options = {}) {}

  respond(msg) {
    this._writeToKinesis(data)
  }

  _writeToKinesis(data) {
    const {
      kinesis,
      log
    } = this

    kinesis.putRecord(this.recordData(data), function (err, data) {
      if (err) {
        log.error(err);
      } else {
        log.info('Successfully sent data to Kinesis.');
      }
    });
  }

  _recordData(data) {
    const {
      config
    } = this
    var record = JSON.stringify(data)
    var recordParams = {
      Data: record,
      StreamName: config.stream
    };
    return recordParams
  }
}
