const create_hook_listen_kinesis = require('./listen')
const create_hook_client_kinesis = require('./client')

module.exports = function (options) {
  const seneca = this
  const plugin = 'kinesis-transport'

  const so = seneca.options()

  options = seneca.util.deepextend({
      kinesis: {
        type: 'kinesis',
      }
    },
    so.transport,
    options)

  const hook_listen_kinesis = create_hook_listen_kinesis(options)
  const hook_client_kinesis = create_hook_client_kinesis(options)

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
