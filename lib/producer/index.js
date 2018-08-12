module.exports = class KinesisProducer {
  get log() {
    logger().getLogger(this.name);
  }

  constructor(kinesis, config = {}, options = {}) {
    this.kinesis = kinesis;
    this.config = config;
    this.options = options
    this.name = options.name || config.name || 'seneca-kinesis';
  }

  run() {
    this._createStreamIfNotCreated(function (err) {
      if (err) {
        log.error(util.format('Error creating stream: %s', err));
        return;
      }
      var count = 0;
      const maxTries = options.maxTries || 10
      while (count < maxTries) {
        setTimeout(_writeToKinesis, 1000);
        count++;
      }
    });
  }

  _createStreamIfNotCreated(callback) {
    var params = {
      ShardCount: config.shards,
      StreamName: config.stream
    };

    kinesis.createStream(params, function (err, data) {
      if (err) {
        if (err.code !== 'ResourceInUseException') {
          callback(err);
          return;
        } else {
          log.info(util.format('%s stream is already created. Re-using it.', config.stream));
        }
      } else {
        log.info(util.format("%s stream doesn't exist. Created a new stream with that name ..", config.stream));
      }

      // Poll to make sure stream is in ACTIVE state before start pushing data.
      this._waitForStreamToBecomeActive(callback);
    });
  }

  _waitForStreamToBecomeActive(callback) {
    kinesis.describeStream({
      StreamName: config.stream
    }, function (err, data) {
      if (!err) {
        log.info(util.format('Current status of the stream is %s.', data.StreamDescription.StreamStatus));
        if (data.StreamDescription.StreamStatus === 'ACTIVE') {
          callback(null);
        } else {
          setTimeout(function () {
            _waitForStreamToBecomeActive(callback);
          }, 1000 * config.waitBetweenDescribeCallsInSeconds);
        }
      }
    });
  }

  _writeToKinesis() {
    var currTime = new Date().getMilliseconds();
    var sensor = 'sensor-' + Math.floor(Math.random() * 100000);
    var reading = Math.floor(Math.random() * 1000000);

    var record = JSON.stringify({
      time: currTime,
      sensor: sensor,
      reading: reading
    });

    var recordParams = {
      Data: record,
      PartitionKey: sensor,
      StreamName: config.stream
    };

    kinesis.putRecord(recordParams, function (err, data) {
      if (err) {
        log.error(err);
      } else {
        log.info('Successfully sent data to Kinesis.');
      }
    });
  }
}
