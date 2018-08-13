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

    // NOTE: not sure if we still need this step when we use transport/util
    // this.data = this.extractData(record)
    // this.execute(record)

    this.info();
  }

  info() {
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

    log.info(util.format('ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s', this.shardId, this._stringData, sequenceNumber, partitionKey));
  }

  extractData(record) {
    return record.data
  }

  // execute(record) {
  //   this.bus = this.getOrCreateBus(record)
  //   this.bus.execute(record.data)
  // }

  // getOrCreateBus(record) {
  //   const {
  //     partitionKey
  //   } = record
  //   registry[partitionKey] = registry[partitionKey] || new this.Bus(record)
  //   return registry[partitionKey]
  // }

  // TODO: Avoid transforming data into a buffer! Not the SenecaJS way ;)
  _stringData() {
    const buffer = new Buffer(this.record.data, 'base64')
    return buffer.toString();
  }
}
