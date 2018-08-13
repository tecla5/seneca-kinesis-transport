const Runner = require('../runner')
const logger = require('../../util/logger')

module.exports = class KinesisProducer {
  get log() {
    logger().getLogger(this.name);
  }

  // SETUP like in microbial?
  run(options = {}) {
    const {
      topic,
      service,
      handler
    } = options
  }

  send(data, topic) {
    this.runner.send(data, topic);
  }

  constructor(options = {}) {
    this.kinesis = AWS.Kinesis(options);
    this.options = options
    this.name = options.name || 'seneca-kinesis';
    this.Runner = options.Runner || Runner
    this.runner = new this.Runner(this)
  }

  createTopic(name) {
    this.runner
  }
}
