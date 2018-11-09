var consent = require('./fuckyeah.js')
var hypercore = require('hypercore')
var multifeed = require('multifeed')

var multi = multifeed(hypercore, process.argv[2], { valueEncoding: 'json' })

var swarm = consent({
  stream: function (peer) {
    return multi.replicate()
  }
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
    if (process.argv[2] === 'request') {
      console.log('requesting..')
      conn.request({
        name: 'my-secret-friend ' + process.argv[2]
      })
    }

    conn.on('request', function (data) {
      if (data.name === 'my-secret-friend request') conn.accept({message: 'i love you'})
      else conn.reject({message: 'i only accept secret friends'})
    })
    conn.on('reject', function (data) {
      console.log('rejected!', data)
    })
    conn.on('accept', function (data) {
      console.log('accepted!', data)
    })
  })
})
