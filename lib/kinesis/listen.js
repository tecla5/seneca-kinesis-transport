// http://senecajs.org/api/#method-listen
// Listen for inbound messages.
const Stream = require('./stream');

module.exports = function hook_listen_kinesis(args, done) {
  var seneca = this
  var type = args.type
  var kinesis_options = options[type]
  var listen_options = seneca.util.clean(_.extend({}, kinesis_options, args))

  try {
    const stream = new Stream(kinesis_options)

    // consume from ack topic stream
    // on message, send back to rest topic stream

    tu.listen_topics(seneca, args, listen_options, function (topic) {
      var acttopic = topic + '_act'
      var restopic = topic + '_res'

      seneca.log.debug('listen', 'subscribe', acttopic, listen_options, seneca)

      stream.on('error', done)

      stream.createTopic(acttopic)
      stream.createTopic(restopic)

      // Subscribe
      stream.consume(acttopic, on_message)

      function on_message(message) {
        var content = message.content ? message.content.toString() : undefined
        var data = tu.parseJSON(seneca, 'listen-' + type, content)

        stream.ack(message)

        // Publish
        tu.handle_request(seneca, data, listen_options, function (out) {
          if (out == null) return
          var outstr = tu.stringifyJSON(seneca, 'listen-' + type, out)
          stream.sendToQueue(restopic, new Buffer(outstr))
        })
      }
    })

    seneca.add('role:seneca,cmd:close', function (close_args, done) {
      var closer = this
      stream.close()
      closer.prior(close_args, done)
    })

    seneca.log.info('listen', 'open', listen_options, seneca)

    done()
  } catch (err) {
    done(err)
  }
}
