const kcl = require('kinesis-client-library');
const nid = require('nid');

module.exports = function createConsumerHandler(options, seneca, consumerBus) {

  // return a kinesis consumer bus
  function createConsumerBus(options) {
    const consumer = new Consumer(options);
    return kcl(consumer).run();
  }

  return function (args, done) {
    var callmap = {};
    consumerBus = createConsumerBus(options);

    // TODO: change the following to match with kinesis
    // what is group and topicName in kinesis? stream?
    function handler(err) {
      if (err) {
        console.log(err);
        return
      }

      function client(args, done) {
        var outmsg = {
          id: nid(),
          kind: 'act',
          act: args
        };

        callmap[outmsg.id] = {
          done: done
        };

        function consumerRequestHandler(res) {
          var call = callmap[res.response.id];
          if (call) {
            delete callmap[res.response.id];
            call.done(res.response.err ? new Error(res.response.err) : null, res.response.res);
          }
        }

        // Do we have request method on kinesis that takes these three args??
        consumerBus.request({
          topicName: options.kinesis.requestTopic
        }, outmsg, consumerRequestHandler);
      };
      seneca.log.info('client', 'pubsub', args.host, args.port, seneca.toString());
      done(null, client);
    }

    // needs run method on kinesis that takes these two args??
    consumerBus.run({
      topic: {
        group: options.kinesis.group,
        topicName: options.kinesis.responseTopic,
        responseChannel: true
      },
      handler
    });
    return consumerBus
  }
}
