// http://senecajs.org/api/#method-client
// Send outbound messages. (Producer)
const Stream = require('./stream');

module.exports = function hook_client_kinesis(args, client_done) {
  var seneca = this
  var type = args.type
  var kinesis_options = options[type]
  var client_options = seneca.util.clean(_.extend({}, kinesis_options, args))

  try {
    const stream = new Stream(kinesis_options)
    // consume from rest topic stream
    // on message, send back to rest ack stream
    tu.make_client(seneca, make_send, client_options, client_done)

    function make_send(spec, topic, send_done) {
      var acttopic = topic + '_act'
      var restopic = topic + '_res'

      stream.on('error', send_done)

      stream.createTopic(acttopic)
      stream.createTopic(restopic)

      seneca.log.debug('client', 'subscribe', restopic, client_options, seneca)

      // Subscribe
      stream.consume(restopic, function (message) {
        var content = message.content ? message.content.toString() : undefined
        var input = tu.parseJSON(seneca, 'client-' + type, content)
        channel.ack(message)
        tu.handle_response(seneca, input, client_options)
      })

      // Publish
      send_done(null, function (args, done) {
        var outmsg = tu.prepare_request(this, args, done)
        var outstr = tu.stringifyJSON(seneca, 'client-kinesis', outmsg)
        stream.sendToQueue(acttopic, new Buffer(outstr))
      })

      seneca.add('role:seneca,cmd:close', function (close_args, done) {
        var closer = this
        channel.close()
        connection.close()
        closer.prior(close_args, done)
      })
    }
  } catch (err) {
    client_done(err)
  }
}
