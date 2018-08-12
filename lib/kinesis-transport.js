'use strict';

const nid = require('nid');
const kcl = require('kinesis-client-library');
const AWS = require('aws-sdk');
const Consumer = require('./consumer');
const Producer = require('./producer');

module.exports = function (options) {
  const kinesis = AWS.Kinesis(options);

  var seneca = this;
  var plugin = 'kinesis-transport';
  var listenBus;
  var clientBus;

  if (!seneca.hasplugin('transport')) {
    seneca.use('transport');
  }

  function createProducerBus(config, options = {}) {
    const producer = new Producer(kinesis, config.producer);
    return producer.run(options);
  }

  function createConsumerBus(options) {
    const consumer = new Consumer(options);
    return kcl(consumer).run();
  }

  function hookListenQueue(args, done) {
    const producerBus = createProducerBus(config.kinesis, options);

    var handlerFn = function (req, res) {
      seneca.act(req.request.act, function (err, result) {
        var outmsg = {
          kind: 'res',
          id: req.request.id,
          err: err ? err.message : null,
          res: result
        };
        res.respond(outmsg);
      });
    };

    // TODO: change the following to match with kinesis
    // what is group and topicName in kinesis? stream?
    // what about kind: act?

    producerBus.run([{
      group: options.kinesis.group,
      topicName: options.kinesis.requestTopic
    }], [{
      match: {
        kind: 'act'
      },
      execute: handlerFn
    }], function (err) {
      if (err) {
        return console.log(err);
      }
      seneca.log.info('listen', args.host, args.port, seneca.toString());
      done();
    });
  }

  function hookClientQueue(args, done) {
    var seneca = this;
    var callmap = {};
    const consumerBus = createConsumerBus(options);

    // TODO: change the following to match with kinesis
    // what is group and topicName in kinesis? stream?

    consumerBus.run([{
      group: options.kinesis.group,
      topicName: options.kinesis.responseTopic,
      responseChannel: true
    }], [], function (err) {
      if (err) {
        console.log(err);
      } else {
        var client = function (args, done) {
          var outmsg = {
            id: nid(),
            kind: 'act',
            act: args
          };
          callmap[outmsg.id] = {
            done: done
          };
          consumerBus.request({
            topicName: options.kinesis.requestTopic
          }, outmsg, function (res) {
            var call = callmap[res.response.id];
            if (call) {
              delete callmap[res.response.id];
              call.done(res.response.err ? new Error(res.response.err) : null, res.response.res);
            }
          });
        };
        seneca.log.info('client', 'pubsub', args.host, args.port, seneca.toString());
        done(null, client);
      }
    });
  }

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
