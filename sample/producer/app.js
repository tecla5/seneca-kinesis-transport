var AWS = require('aws-sdk');
var config = require('./config');
var producer = require('./producer');

var kinesis = new AWS.Kinesis({
  region: config.kinesis.region
});
producer(kinesis, config.sampleProducer).run();
