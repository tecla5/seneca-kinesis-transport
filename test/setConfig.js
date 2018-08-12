'use strict';

var options = {
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


const kcl = require('kinesis-client-library')
const client = kcl(options).run()

client.setup(function (err) {
  if (!err || (err && err.name && err.name === 'config_block_not_available')) {
    console.log('updating config');
    // var config = mcb.blankConfig();

    kcl(recordProcessor()).run();

    mcb.addBrokerToConfig(config, 'localhost', 9092, 2000000);
    mcb.addTopicToConfig(config, 'request', 'queue', 3, 'roundRobin');
    mcb.addTopicToConfig(config, 'response', 'queue', 3, 'direct');

    console.log(JSON.stringify(config, null, 2));
    mcb.writeConfig(config, function (err) {
      mcb.tearDown();
      if (err) {
        console.log(err);
      }
      console.log('done');
    });
  } else {
    console.log(err);
  }
});
