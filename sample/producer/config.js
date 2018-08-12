module.exports = {
  kinesis: {
    region: 'us-east-1'
  },
  sampleProducer: {
    stream: 'kclnodejssample', // topic
    shards: 2,
    waitBetweenDescribeCallsInSeconds: 5
  }
}
