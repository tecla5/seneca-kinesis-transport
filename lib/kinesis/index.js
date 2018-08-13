const hook_listen_kinesis = require('./listen')
const hook_client_kinesis = require('./client')

module.exports = function (options) {
  var seneca = this
  var plugin = 'kinesis-transport'

  var so = seneca.options()

  options = seneca.util.deepextend({
      kinesis: {
        type: 'kinesis',
      }
    },
    so.transport,
    options)

  var tu = seneca.export('transport/utils')

  seneca.add({
    role: 'transport',
    hook: 'listen',
    type: 'kinesis'
  }, hook_listen_kinesis)

  seneca.add({
    role: 'transport',
    hook: 'client',
    type: 'kinesis'
  }, hook_client_kinesis)

  return {
    name: plugin
  }
}
