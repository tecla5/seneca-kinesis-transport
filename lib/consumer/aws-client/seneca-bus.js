const patrun = require('patrun');
const seneca = require('seneca');
const $patrun = patrun()

module.exports = class SenecaBus {
  constructor(options = {}) {
    this.act = options.async ? undefined : options.act || this.act
    this.label = options.label || 'seneca:kinesis'

    const execute = this.execute.bind(this)
    this.pm = $patrun.add({
      kind: 'act'
    }, execute);
  }

  execute(data) {
    seneca.act(data, this.act)
  }

  execute(data) {
    const onMatchingData = this.pm.find(data);
    onMatchingData && onMatchingData(data);
  }

  // default act handler
  // http://senecajs.org/api/#method-act
  act(error, data) {
    error ? this._onError(error) : this._onData(data)
  }

  _logConsole(stream, msg) {
    if (!this.options.console) return
    console[stream](this.label, msg)
  }

  _onError(error) {
    this._logConsole('error', {
      data
    })
  }

  _onData(data) {
    this._logConsole('log', {
      data
    })
  }
}
