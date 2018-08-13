const Consumer = require('../consumer').awsClient
const Producer = require('../producer').awsClient

// Creates both a producer and a consumer for a given "stream", ie. a specific partitionId
module.exports = class Stream {
  constructor(options, cb) {
    this.options = options
    this.options.stream = this.options.stream || 'seneca' // default stream name

    this.consumer = new Consumer(options).initialize(options, cb)
    this.producer = new Producer(options)
  }

  createTopic(name) {
    this.consumer.addListenerTopic(name)
    this.producer.createTopic(name)
  }

  // TODO
  consume(topicName, onMessage) {
    this.consumer.consume(topicName, onMessage)
  }

  // send message on ack topic channel
  ack(message) {
    this.producer.send(message, 'ack')
  }

  assertQueue(name) {
    this.producer.assertQueue(name)
  }

  sendToQueue(topicName, strBuffer) {
    this.producer.send(strBuffer, topicName)
  }

  // send to default stream and partitionId
  send(strBuffer) {
    this.producer.send(strBuffer)
  }
}
