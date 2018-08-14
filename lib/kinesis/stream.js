const Consumer = require('../consumer')
const Producer = require('../producer')
const kcl = require('aws-kcl')

// Creates both a producer and a consumer for a given "stream", ie. a specific
// partitionId
module.exports = class Stream {
  constructor(options, cb) {
    this.options = options
    this.options.stream = this.options.stream || 'seneca' // default stream name

    this.consumer = this.createConsumer(options, cb)
    this.producer = this.createProducer(options)
    this.registry = {}

    // See: https://github.com/awslabs/amazon-kinesis-client-nodejs
    kcl(this.consumer).run()
  }

  // can be used to subscribe to event types of different kinds, such as 'error'
  on(eventType, cb) {

  }

  createConsumer(options, cb) {
    return new Consumer(options).initialize(options, cb)
  }

  createProducer(options) {
    return new Producer(options)
  }

  // type of event, either 'res' or 'ack'
  createTopic(name, type) {
    this.registry[type] = name

    this
      .consumer
      .addListenerTopic(name)
    this
      .producer
      .createTopic(name)
  }

  getTopicFor(type) {
    return this.registry[type]
  }

  consume(topicName, onMessage) {
    this
      .consumer
      .consume(topicName, onMessage)
  }

  // send message on ack topic channel
  ack(message) {
    const topicName = getTopicFor('ack')
    this
      .producer
      .send(message, topicName)
  }

  assertQueue(name) {
    this
      .producer
      .assertQueue(name)
  }

  sendToQueue(topicName, strBuffer) {
    this
      .producer
      .send(strBuffer, topicName)
  }

  // send to default stream partition
  send(strBuffer) {
    this
      .producer
      .send(strBuffer)
  }
}
