'use strict';

var seneca = require('seneca')();

seneca
  .use('..', {
    kinesis: {
      namespace: 'seneca',
      group: 'seneca',
      requestTopic: 'request',
      responseTopic: 'response'
    },
    client: {
      namespace: 'seneca',
      start: 'all'
    }
  })
  .use('foo')
  .listen({
    type: 'queue'
  });


process.on('SIGINT', function () {
  seneca.close(function () {
    process.exit();
  });
});
