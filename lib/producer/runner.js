module.exports = class Runner {
  constructor(producer) {
    this.log = producer.log
    this.options = producer.options
    this.config = producer.config
    this.kinesis = producer.kinesis
  }

  // pass custom runner function or use _runner function of class
  run(runner) {
    const {
      options
    } = this
    runner = runner || this._runner
    const _writeToKinesis = this._writeToKinesis.bind(this)
    this._createStreamIfNotCreated(function (err) {
      if (err) {
        log.error(util.format('Error creating stream: %s', err));
        return;
      }

      runner()
    });
  }

  _createStreamIfNotCreated(callback) {
    const {
      log,
      config,
      _waitForStreamToBecomeActive
    } = this

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
      _waitForStreamToBecomeActive(callback);
    });
  }

  _waitForStreamToBecomeActive(callback) {
    const {
      config
    } = this
    const _waitForStreamToBecomeActive = this._waitForStreamToBecomeActive.bind(this)

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

  // default runner
  // writes sample data 10 times with 1 second between each write
  _runner(options = {}) {
    const _writeToKinesis = this._writeToKinesis.bind(this)
    var count = 0;
    maxTries = options.maxTries || 10
    while (count < maxTries) {
      setTimeout(_writeToKinesis, options.waitTime || 1000);
      count++;
    }
  }

  _writeToKinesis() {
    const {
      kinesis,
      log
    } = this

    kinesis.putRecord(this.recordData(), function (err, data) {
      if (err) {
        log.error(err);
      } else {
        log.info('Successfully sent data to Kinesis.');
      }
    });
  }

  _recordData() {
    const {
      config
    } = this
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
    return recordParams
  }
}
