module.exports = function createHookListenQueue(options, seneca, producerBus) {
  const kinesis = AWS.Kinesis(options);

  function createProducerBus(config, options = {}) {
    const producer = new Producer(kinesis, config.producer);
    return producer.run(options);
  }

  function hookListenQueue(args, done) {
    seneca = this;
    producerBus = createProducerBus(config.kinesis, options);

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
  return producerBus
}
