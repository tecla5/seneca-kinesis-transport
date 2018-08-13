'use strict';

const {
  Consumer
} = require('./consumer').awsClient;
const {
  Producer
} = require('./producer').awsClient;

module.exports = function (options) {
  const seneca = this;
  const plugin = 'kinesis-transport';

  let consumerBus;
  let producerBus;

  if (!seneca.hasplugin('transport')) {
    seneca.use('transport');
  }

  const {
    createHookClientQueue,
    createHookListenQueue
  } = require('./hooks')
  const listenHandler = createProducerHandler(options, seneca, producerBus)
  const clientHandler = createConsumerHandler(options, seneca, consumerBus)

  function shutdown(args, done) {
    consumerBus && consumerBus.tearDown(function (err) {
      done(err);
    });

    producerBus && producerBus.tearDown(function (err) {
      done(err);
    });
  };

  seneca.add({
    role: 'transport',
    hook: 'listen',
    type: 'kinesis'
  }, listenHandler);
  seneca.add({
    role: 'transport',
    hook: 'client',
    type: 'kinesis'
  }, clientHandler);

  seneca.add({
    role: 'seneca',
    cmd: 'close'
  }, shutdown);

  return {
    name: plugin,
  };
};
