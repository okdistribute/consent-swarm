var consent = require('./')
var hypercore = require('hypercore')
var test = require('tape')
var ram = require('random-access-memory')
var multifeed = require('multifeed')

test('request and accept the connection', function (t) {
  var swarm, swarm2
  swarm = create('request', 'my-secret-friend', function (eventName, data) {
    if (eventName === 'accept') {
      t.same(eventName, 'accept')
      t.same(data.message, 'i love you')
      swarm.destroy()
      swarm2.destroy()
      t.end()
    }
  })
  swarm2 = create('listener', 'my-secret-friend', function (eventName, data) {
    if (eventName === 'request') {
      t.same(data.name, 'my-secret-friend')
    }
  })
})

test('request and reject the connection', function (t) {
  var swarm, swarm2
  swarm = create('request', 'my-bad-secret', function (eventName, data) {
    if (eventName === 'reject') {
      t.same(data.message, 'i only accept secret friends')
      swarm.destroy()
      swarm2.destroy()
      t.end()
    }
  })
  swarm2 = create('listener', 'my-secret-friend', function (eventName, data) {
    if (eventName === 'request') {
      t.same(data.name, 'my-bad-secret')
    }
  })
})

function create (name, secret, cb) {
  var multi = multifeed(hypercore, ram, { valueEncoding: 'json' })

  var swarm = consent({
    dht: false,
    utp: false
  })

  swarm.on('error', function (err) {
    console.error('swarm error')
    console.trace(err)
  })

  swarm.on('handshake', function () {
    console.log('handshake', arguments)
  })

  multi.writer('local', function (err, feed) {
    if (err) console.error(err)
    swarm.listen()
    swarm.join('mapeo-info')

    swarm.on('connection', function (conn, info) {
      if (name === 'request') {
        conn.request({
          name: secret
        })
      }

      conn.on('request', function (data) {
        if (data.name === secret) conn.accept({message: 'i love you'})
        else conn.reject({message: 'i only accept secret friends'})
        cb('request', data)
      })
      conn.on('reject', function (data) {
        cb('reject', data)
      })
      conn.on('accept', function (data) {
        cb('accept', data)
      })
    })
  })
  return swarm
}
