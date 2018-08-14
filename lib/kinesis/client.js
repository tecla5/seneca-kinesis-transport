// http://senecajs.org/api/#method-client
// Send outbound messages. (Producer)
const Stream = require('./stream');


module.exports = function (options, tu) {
  return function hook_client_kinesis(args, client_done) {
    const seneca = this
    const tu = seneca.export('transport/utils')
    const type = args.type
    const kinesis_options = options[type]
    const client_options = seneca.util.clean(_.extend({}, kinesis_options, args))

    try {
      const stream = new Stream(kinesis_options)
      // consume from rest topic stream
      // on message, send back to rest ack stream
      tu.make_client(seneca, make_send, client_options, client_done)

      function make_send(spec, topic, send_done) {
        const acttopic = topic + '_act'
        const restopic = topic + '_res'

        stream.on('error', send_done)

        stream.createTopic(acttopic, 'ack')
        stream.createTopic(restopic, 'res')

        seneca.log.debug('client', 'subscribe', restopic, client_options, seneca)

        // Subscribe
        stream.consume(restopic, function (message) {
          const content = message.content ? message.content.toString() : undefined
          const input = tu.parseJSON(seneca, 'client-' + type, content)
          channel.ack(message)
          tu.handle_response(seneca, input, client_options)
        })

        // Publish
        send_done(null, function (args, done) {
          const outmsg = tu.prepare_request(this, args, done)
          const outstr = tu.stringifyJSON(seneca, 'client-kinesis', outmsg)
          stream.sendToQueue(acttopic, new Buffer(outstr))
        })

        seneca.add('role:seneca,cmd:close', function (close_args, done) {
          const closer = this
          channel.close()
          connection.close()
          closer.prior(close_args, done)
        })
      }
    } catch (err) {
      client_done(err)
    }
  }
}
