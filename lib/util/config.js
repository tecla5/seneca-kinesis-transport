module.exports = {
  kinesis: {
    region: process.env.AWS_KINESIS_REGION || 'us-east-1'
  },
  producer: {
    stream: process.env.AWS_KINESIS_TOPIC || 'seneca-default-topic',
    shards: process.env.AWS_KINESIS_SHARDS || 2,
    waitBetweenDescribeCallsInSeconds: process.env.AWS_KINESIS_WAIT_SECS || 5
  }
};
