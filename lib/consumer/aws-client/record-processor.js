const SenecaBus = require('./seneca-bus')

module.exports = class RecordProcessor {
  constructor(options = {}) {
    this.options = options
    this.shardId = options.shardId
    this.Bus = options.Bus || SenecaBus
  }

  process(record) {
    this.record = record
    const {
      log
    } = this
    this.data = this.extractData(record)
    this.execute(this.data)
    this.info();
  }

  info() {
    const {
      partitionKey,
      sequenceNumber,
      data
    } = this.record

    if (this.options.console) {
      console.log('kinesis record', {
        shardId: this.shardId,
        data,
        sequenceNumber,
        partitionKey
      })
    }

    log.info(util.format('ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s', this.shardId, this._stringData, sequenceNumber, partitionKey));
  }

  extractData(record) {
    return record.data
  }

  execute() {
    const data = this.data
    this.bus = this.createBus(data)
    this.bus.execute()
  }

  createBus(data) {
    return new this.Bus(data)
  }

  // TODO: Avoid transforming data into a buffer! Not the SenecaJS way ;)
  _stringData() {
    const buffer = new Buffer(this.record.data, 'base64')
    return buffer.toString();
  }
}
