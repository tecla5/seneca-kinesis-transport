const Runner = require('.../runner')

module.exports = class KinesisProducer {
  get log() {
    logger().getLogger(this.name);
  }

  // SETUP like in microbial
  run(topics, services, cb) {}

  constructor(kinesis, config = {}, options = {}) {
    this.kinesis = kinesis;
    this.config = config;
    this.options = options
    this.name = options.name || config.name || 'seneca-kinesis';
    this.Runner = options.Runner || Runner
    this.runner = new this.Runner(this)
  }
}
