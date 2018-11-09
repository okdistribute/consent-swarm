var util = require('util')
var EventEmitter = require('events').EventEmitter
var discovery = require('discovery-swarm')

const C = {
  REQUEST: 'request',
  REJECT: 'reject',
  ACCEPT: 'accept'
}

var events = ['error', 'handshake']

function propagateEvents (origin, next) {
  events.forEach(function (name) {
    origin.on(name, function () {
      var args = Array.prototype.slice.call(arguments)
      args.unshift(name)
      next.emit.apply(next, args)
    })
  })
}

function ConsentSwarm (opts) {
  if (!(this instanceof ConsentSwarm)) return new ConsentSwarm(opts)
  this.info = discovery()
  this.data = discovery()
  this.info.on('connection', this._onconnection.bind(this))
  propagateEvents(this.info, this)
  propagateEvents(this.data, this)
  EventEmitter.call(this)
}

util.inherits(ConsentSwarm, EventEmitter)

ConsentSwarm.prototype.listen = function () {
  this.info.listen.apply(this.info, arguments)
}

ConsentSwarm.prototype.join = function () {
  this.info.join.apply(this.info, Array.prototype.slice.call(arguments))
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
    self.data.join('data')
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

module.exports = ConsentSwarm
