const logger = require('log4js')

module.exports = class KinesisConsumer {
  constructor(options) {
    this.options = options
    this.logName = options.logName || 'seneca-kinesis';
    this.RecordProcessor = options.RecordProcessor || require('./record-processor')
    this.recordProcessor = this.createRecordProcessor()
    this.topics = {}
  }

  get log() {
    logger().getLogger(this.logName);
  }

  initialize(initializeInput, completeCallback) {
    this.shardId = initializeInput.shardId;
    this.options.shardId = shardId;

    if (!completeCallback) {
      console.error('Consumer missing completeCallback argument')
      return
    }
    completeCallback();
  }

  addTopic(name) {
    this.topics[name] = true
  }

  isValidTopic(record) {
    return this.topics[record.partitionKey]
  }

  // SETUP like in microbial
  run(options = {}) {
    const {
      topic,
      handler
    } = options
  }

  processRecords(processRecordsInput, completeCallback) {
    const {
      log
    } = this

    if (!processRecordsInput || !processRecordsInput.records) {
      completeCallback();
      return;
    }

    const records = processRecordsInput.records;
    let sequenceNumber
    let record

    for (record of records) {
      this.processRecord(record)
    }

    sequenceNumber = record.sequenceNumber
    if (!sequenceNumber) {
      completeCallback();
      return;
    }
    // If checkpointing, completeCallback should only be called once checkpoint is complete.
    processRecordsInput.checkpointer.checkpoint(sequenceNumber, function (_, sequenceNumber) {
      log.info(util.format('Checkpoint successful. ShardID: %s, SeqenceNumber: %s', shardId, sequenceNumber));
      completeCallback();
    });
  }

  createRecordProcessor() {
    return new this.RecordProcessor(this.options)
  }

  processRecord(record) {
    const {
      partitionKey,
      streamName
    } = record

    if (!this.isValidTopic(record)) {
      console.error('Ivalid listener topic', partitionKey, 'not registered', this.listenerTopics)
    } else {
      this.recordProcessor.process(record)
    }
  }

  shutdownRequested(shutdownRequestedInput, completeCallback) {
    shutdownRequestedInput.checkpointer.checkpoint(function (err) {
      completeCallback();
    });
  }

  shutdown(shutdownInput, completeCallback) {
    // Checkpoint should only be performed when shutdown reason is TERMINATE.
    if (shutdownInput.reason !== 'TERMINATE') {
      completeCallback();
      return;
    }
    // Whenever checkpointing, completeCallback should only be invoked once checkpoint is complete.
    shutdownInput.checkpointer.checkpoint(function (err) {
      completeCallback();
    });
  }
}
