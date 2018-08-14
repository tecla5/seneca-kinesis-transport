// http://senecajs.org/api/#method-listen
// Listen for inbound messages.
const Stream = require('./stream');

module.exports = function (options, tu) {

  return function hook_listen_kinesis(args, done) {
    const seneca = this
    const tu = seneca.export('transport/utils')
    const type = args.type
    const kinesis_options = options[type]
    const listen_options = seneca.util.clean(_.extend({}, kinesis_options, args))

    function createStream(options) {
      const clazz = options.Stream || Stream
      return new clazz(kinesis_options)
    }

    try {
      const stream = createStream(kinesis_options)

      // consume from ack topic stream
      // on message, send back to rest topic stream

      tu.listen_topics(seneca, args, listen_options, function (topic) {
        const acttopic = topic + '_act'
        const restopic = topic + '_res'

        seneca.log.debug('listen', 'subscribe', acttopic, listen_options, seneca)

        stream.on('error', done)

        stream.createTopic(acttopic, 'ack')
        stream.createTopic(restopic, 'res')

        // Subscribe
        stream.consume(acttopic, on_message)

        function on_message(message) {
          const content = message.content ? message.content.toString() : undefined
          const data = tu.parseJSON(seneca, 'listen-' + type, content)

          stream.ack(message)

          // Publish
          tu.handle_request(seneca, data, listen_options, function (out) {
            if (out == null) return
            const outstr = tu.stringifyJSON(seneca, 'listen-' + type, out)
            stream.sendToQueue(restopic, new Buffer(outstr))
          })
        }
      })

      seneca.add('role:seneca,cmd:close', function (close_args, done) {
        const closer = this
        stream.close()
        closer.prior(close_args, done)
      })

      seneca.log.info('listen', 'open', listen_options, seneca)

      done()
    } catch (err) {
      done(err)
    }
  }
}
