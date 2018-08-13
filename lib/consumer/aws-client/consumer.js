module.exports = class KinesisConsumer {
  constructor(options) {
    this.options = options
    this.name = options.name || 'seneca-kinesis';
    this.RecordProcessor = options.RecordProcessor || require('./record-processor')
  }

  get log() {
    logger().getLogger(this.name);
  }

  initialize(initializeInput, completeCallback) {
    this.shardId = initializeInput.shardId;
    this.options.shardId = shardId;
    completeCallback();
  }

  // SETUP like in microbial
  run(topics, services, cb) {}

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
    createRecordProcessor().process(record)
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