var util = require('util')
var EventEmitter = require('events').EventEmitter
var discovery = require('discovery-swarm')

const C = {
  REQUEST: 'request',
  REJECT: 'reject',
  ACCEPT: 'accept'
}

function ConsentSwarm (opts) {
  if (!(this instanceof ConsentSwarm)) return new ConsentSwarm(opts)
  this.info = discovery(opts)
  this.info.on('connection', this._onconnection.bind(this))
  this.info.on('error', this._onerror.bind(this))
  EventEmitter.call(this)
}

util.inherits(ConsentSwarm, EventEmitter)

ConsentSwarm.prototype.listen = function () {
  this.info.listen.apply(this.info, arguments)
}

ConsentSwarm.prototype.join = function () {
  this.info.join.apply(this.info, arguments)
}

ConsentSwarm.prototype._wrapConnection = function (conn) {
  var self = this
  conn.request = function (data) {
    conn.write(JSON.stringify({
      type: C.REQUEST,
      userData: data
    }))
  }

  conn.accept = function (data) {
    conn.write(JSON.stringify({
      type: C.ACCEPT,
      userData: data
    }))
  }

  conn.reject = function (data) {
    conn.write(JSON.stringify({
      type: C.REJECT,
      userData: data
    }))
  }
  return conn
}

ConsentSwarm.prototype._onconnection = function (conn, info) {
  conn.on('data', function (buf) {
    var data = JSON.parse(buf.toString())
    conn.emit(data.type, data.userData)
  })
  this.emit('connection', this._wrapConnection(conn), info)
}

ConsentSwarm.prototype._onerror = function (err) {
  this.emit('error', err)
}

ConsentSwarm.prototype.destroy = function () {
  this.info.destroy.apply(this.info, arguments)
}

module.exports = ConsentSwarm
