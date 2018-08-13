const AWS = require('aws-sdk');

module.exports = function createProducerQueue(options, seneca, producerBus) {
  const kinesis = AWS.Kinesis(options);

  function createProducerBus(config, options = {}) {
    const producer = new Producer(kinesis, config.producer);
    return producer.run(options);
  }

  return function (args, done) {
    seneca = this;
    producerBus = createProducerBus(config.kinesis, options);

    function execute(req, res) {
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

    function handler(err) {
      if (err) {
        return console.log(err);
      }
      seneca.log.info('listen', args.host, args.port, seneca.toString());
      done();
    }

    producerBus.run({
      topic: {
        group: options.kinesis.group,
        topicName: options.kinesis.requestTopic
      },
      service: {
        match: {
          kind: 'act'
        },
        execute
      },
      handler,
    });
  }
  return producerBus
}
