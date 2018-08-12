module.exports = class RecordProcessor {
  constructor(options = {}) {
    this.options = options
    this.shardId = options.shardId
    this.actor = options.actor // should be a seneca instance with act method
  }

  process(record) {
    this.record = record
    const {
      matchRecord,
      actOnRecord,
      log
    } = this
    this.data = this.extractData()
    match() && act()

    this.info(this.shardId, data, sequenceNumber, partitionKey);
  }

  info() {
    const {
      partitionKey,
      sequenceNumber,
      data
    } = record
    log.info(util.format('ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s', this.shardId, data, sequenceNumber, partitionKey));
  }

  // TODO: Use patrun matcher to match on {act: 'kind'}
  match() {
    return false;
  }

  actOnRecord(record) {
    actor.act(this.data)
  }

  // TODO: Avoid transforming data into a buffer! Not the SenecaJS way ;)
  extract() {
    // const buffer = new Buffer(this.record.data, 'base64')
    // return buffer.toString();
  }
}
