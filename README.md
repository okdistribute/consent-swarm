# consent-swarm

discovery-swarm with two-way replication consent

```
npm install consent-swarm
```


[![build status](http://img.shields.io/travis/karissa/consent-swarm.svg?style=flat)](http://travis-ci.org/karissa/consent-swarm)



## Usage

``` js
var swarm = require('consent-swarm')

var sw = swarm()

sw.listen(1000)
sw.join('ubuntu-14.04') // can be any id/name/hash

sw.on('connection', function (connection) {
  connection.on('request', function (data) {
    // here the client can send some data that might help the user
    // make a decision if they want to continue the connection
    // or only replicate parts of the data
    if (data === 'my-secret-decision-process') {
      connection.accept({message: 'ok sure'})
    } else {
      connection.reject({message: 'nope'})
    }
  })

  connection.on('reject', function (data) {
    console.log('rejected! reason:', data.message)
  })

  connection.on('accept', function (data) {
    connection.write('some more stuff now, thanks for the consent buddy\n')
  })

  console.log('found + connected to peer')
})

sw.on('error', function (err) {
  console.error(err)
})
```

