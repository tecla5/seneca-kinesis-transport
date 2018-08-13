# Message pattern matching

If we want to do low-level pattern matching on messages directly, we can use [patrun](https://www.npmjs.com/package/patrun) in the consumer, just like [microbial](https://github.com/pelger/microbial/blob/master/lib/kernel/executor.js#L40) does.

Here the most important microbial code extracts we could reuse to some extent.

```js
var load = function(services) {
  assert(services);

  if (_.isArray(services)) {
    _.each(services, function(service) {
      _pr.add(service.match, service.execute);
    });
  } else {
    _pr.add(services.match, services.execute);
  }
};
```

Which takes a run function of the following form:

```js
var run = function(topics, services, cb) {
  if (!_setupDone) {
    setup(function(err) {
      if (err) {
        return cb(err);
      }
      engage(topics, services, cb);
    });
  } else {
    engage(topics, services, cb);
  }
};
```

`run` uses `engage` to register topics to listen to and services to match and trigger

```js
var engage = function(topics, services, cb) {
  if (!_.isArray(topics)) {
    topics = [topics];
  }

  registerTopics(0, topics, function(err) {
    if (err) {
      return cb(err);
    }
    load(services);
    cb(null);
  });
};
```

## Patrun matcher and activator

We have currently implemented it like this in the `SenecaBus`.
Note: We should likely extract this handler logic as a dedicated class.

```js
  matchAndExecute() {
    const data = this.data
    const execute = this.pm.find(data);
    execute && execute(data);
  }

  // Add an action function to be called when inbound messages match the pattern.
  // http://senecajs.org/api/#method-add

  // Add an action for pattern a:1 using an object to define the pattern.
  // .add({a: 1}, function (msg, reply) {
  //   reply({z: msg.z})
  // })
  execute() {
    const data = this.data
    seneca.act(data, this.act)
  }

  // default act handler
  // http://senecajs.org/api/#method-act
  // Send a message and receive a response via the callback. If there is no callback the message is asynchronous.
  act(err, data) {
    err ? console.error(err) : console.log(data)
  }
```
