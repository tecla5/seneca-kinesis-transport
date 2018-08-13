module.exports = class Runner {
  constructor(producer) {
    this.options = producer.options
    this.kinesis = producer.kinesis
    this.log = producer.log
    this.topics = {}
  }

  send(data, topic) {
    this._writeToKinesis(data, topic)
  }

  addTopic(name) {
    this.topics[name] = true
  }

  isValidTopic(record) {
    return this.topics[record.partitionKey]
  }

  _writeToKinesis(data, topic) {
    const {
      kinesis,
      log
    } = this

    kinesis.putRecord(this.recordData(data, topic), function (err, data) {
      if (err) {
        log.error(err);
      } else {
        log.info('Successfully sent data to Kinesis.');
      }
    });
  }

  // format data for kinesis to put record on stream
  _recordData(data, topic = {}) {
    var record = JSON.stringify(data)
    topic.streamName = topic.streamName || this.options.stream

    const {
      partitionKey,
      streamName
    } = topic

    var recordParams = {
      Data: record,
      PartitionKey: partitionKey,
      StreamName: streamName
    };
    return recordParams
  }
}
