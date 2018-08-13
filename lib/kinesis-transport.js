'use strict';

const nid = require('nid');
const kcl = require('kinesis-client-library');
const AWS = require('aws-sdk');
const {
  Consumer
} = require('./consumer').awsClient;
const {
  Producer
} = require('./producer').awsClient;

module.exports = function (options) {
  var seneca = this;
  var plugin = 'kinesis-transport';
  var listenBus;
  var clientBus;

  if (!seneca.hasplugin('transport')) {
    seneca.use('transport');
  }

  const {
    createHookClientQueue,
    createHookListenQueue
  } = require('./hooks')
  const hookClientQueue = createHookClientQueue(options, seneca, clientBus)
  const hookListenQueue = createHookListenQueue(options, seneca, listenBus)

  var shutdown = function (args, done) {
    if (listenBus) {
      listenBus.tearDown(function (err) {
        done(err);
      });
    } else if (clientBus) {
      clientBus.tearDown(function (err) {
        done(err);
      });
    }
  };

  seneca.add({
    role: 'transport',
    hook: 'listen',
    type: 'kinesis'
  }, hookListenQueue);
  seneca.add({
    role: 'transport',
    hook: 'client',
    type: 'kinesis'
  }, hookClientQueue);

  seneca.add({
    role: 'seneca',
    cmd: 'close'
  }, shutdown);

  return {
    name: plugin,
  };
};
