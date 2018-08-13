const util = require('util')

module.exports = class RecordProcessor {
  constructor(options = {}) {
    this.options = options
    this.shardId = options.shardId
    this.Bus = options.Bus || SenecaBus
  }

  process(record) {
    this.info();
  }

  info() {
    const {
      log
    } = this
    const {
      partitionKey,
      streamName,
      sequenceNumber,
      data
    } = this.record

    if (this.options.console) {
      console.log('kinesis record', {
        shardId: this.shardId,
        data,
        sequenceNumber,
        partitionKey,
        streamName
      })
    }

    const formatted = util.format('ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s', this.shardId, this._stringData, sequenceNumber, partitionKey)
    log.info(formatted);
  }

  extractData(record) {
    return record.data
  }

  // TODO: Avoid transforming data into a buffer! Not the SenecaJS way ;)
  _stringData() {
    const buffer = new Buffer(this.record.data, 'base64')
    return buffer.toString();
  }
}
