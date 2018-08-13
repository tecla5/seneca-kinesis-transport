'use strict';

var seneca = require('seneca')();

seneca
  .use('..', {
    kinesis: {
      stream: 'seneca',
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
