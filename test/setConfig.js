'use strict';

const kcl = require('kinesis-client-library')
const Consumer = require('../lib/consumer')

const options = {
  namespace: 'seneca',
  start: 'config'
};

const config = {
  kinesis: {
    region: process.env.AWS_KINESIS_REGION || 'us-east-1'
  },
  producer: {
    stream: process.env.AWS_KINESIS_TOPIC || 'seneca-default-topic',
    shards: process.env.AWS_KINESIS_SHARDS || 2,
    waitBetweenDescribeCallsInSeconds: process.env.AWS_KINESIS_WAIT_SECS || 5
  }
};

const client = kcl(options).run()

client.setup(function (err) {
  if (!err || (err && err.name && err.name === 'config_block_not_available')) {
    console.log('updating config');
    const consumer = new Consumer(options)
    kcl(consumer).run();

    console.log(JSON.stringify(config, null, 2));

    // TODO...
  } else {
    console.log(err);
  }
});
