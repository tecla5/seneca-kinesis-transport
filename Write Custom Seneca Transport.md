# Write Custom Seneca Transport

See [Writing Your Own Transport](https://github.com/senecajs/seneca-transport#writing-your-own-transport)

The JSON object is a wrapper for the message data. The wrapper contains
some tracking fields to make debugging easier. These are:

- _id_: action identifier (appears in Seneca logs after IN/OUT)
- _kind_: 'act' for inbound actions, 'res' for outbound responses
- _origin_: identifier of orginating Seneca instance, where action is submitted
- _accept_: identifier of accepting Seneca instance, where action is performed
- _time_:
  - _client_sent_: client timestamp when message sent
  - _listen_recv_: server timestamp when message received
  - _listen_sent_: server timestamp when response sent
  - _client_recv_: client timestamp when response received
- _act_: action message data, as submitted to Seneca
- _res_: response message data, as provided by Seneca
- _error_: error message, if any
- _input_: input generating error, if any

## Writing Your Own Transport

To write your own transport, the best approach is to copy one of the existing ones:

- [transport.js](https://github.com/senecajs/seneca-transport/blob/master/transport.js): disconnected or point-to-point
- [redis-transport.js](https://github.com/rjrodger/seneca-redis-transport/blob/master/lib/index.js): publish/subscribe
- [beanstalk-transport.js](https://github.com/rjrodger/seneca-beanstalk-transport/blob/master/lib/index.js): message queue

Choose a _type_ for your transport, say "foo". You will need to
implement two patterns:

- role:transport, hook:listen, type:foo
- role:transport, hook:client, type:foo

Rather than writing all of the code yourself, and dealing with all the
messy details, you can take advantage of the built-in message
serialization and error handling by using the utility functions that
the _transport_ plugin exports. These utility functions can be called
in a specific sequence, providing a template for the implementation of
a message transport:

The transport utility functions provide the concept of topics. Each
message pattern is encoded as a topic string (alphanumeric) that could
be used with a message queue server. You do not need to use topics,
but they can be convenient to separate message flows.

To implement the client, use the template:

```js
var transport_utils = seneca.export("transport/utils");

function hook_client_redis(args, clientdone) {
  var seneca = this;
  var type = args.type;

  // get your transport type default options
  var client_options = seneca.util.clean(_.extend({}, options[type], args));

  transport_utils.make_client(make_send, client_options, clientdone);

  // implement your transport here
  // see an existing transport for full example
  // make_send is called per topic
  function make_send(spec, topic, send_done) {
    // setup topic in transport mechanism

    // send the args over the transport
    send_done(null, function(args, done) {
      // create message JSON
      var outbound_message = transport_utils.prepare_request(
        seneca,
        args,
        done
      );

      // send JSON using your transport API

      // don't call done - that only happens if there's a response!
      // this will be done for you
    });
  }
}
```

To implement the server, use the template:

```js
var transport_utils = seneca.export('transport/utils')

function hook_listen_redis( args, done ) {
  var seneca         = this
  var type           = args.type

  // get your transport type default options
  var listen_options = seneca.util.clean(_.extend({},options[type],args))

  // get the list of topics
  var topics = tu.listen_topics( seneca, args, listen_options )

  topics.forEach( function(topic) {

    // "listen" on the topic - implementation dependent!

    // handle inbound messages
    transport_utils.handle_request( seneca, data, listen_options, function(out){

      // there may be no result!
      if( null == out ) return ...;

      // otherwise, send the result back
      // don't forget to stringifyJSON(out) if necessary
    })
  })
}
```

If you do not wish to use a template, you can implement transports
using entirely custom code. In this case, you need to need to provide
results from the _hook_ actions. For the _role:transport,hook:listen_
action, this is easy, as no result is required. For
_role:transport,hook:client_, you need to provide an object with
properties:

- `id`: an identifier for the client
- `toString`: a string description for debug logs
- `match( args )`: return _true_ if the client can transport the given args (i.e. they match the client action pattern)
- `send( args, done )`: a function that performs the transport, and calls `done` with the result when received

See the `make_anyclient` and `make_pinclient` functions in
[transport.js](transport.js) for implementation examples.

Message transport code should be written very carefully as it will be
subject to high load and many error conditions.

## Plugin Options

The transport plugin family uses an extension to the normal Seneca
options facility. As well as supporting the standard method for
defining options (see [How to Write a
Plugin](http://senecajs.org/tutorials/how-to-write-a-plugin.html#wp-options)), you can
also supply options via arguments to the <code>client</code> or
<code>listen</code> methods, and via the type name of the transport
under the top-level _transport_ property.

The primary options are:

- _msgprefix_: a string to prefix to topic names so that they are namespaced
- _callmax_: the maximum number of in-flight request/response messages to cache
- _msgidlen_: length of the message indentifier string

These can be set within the top-level _transport_ property of the main
Seneca options tree:

```js
var seneca = require("seneca");
seneca({
  transport: {
    msgprefix: "foo"
  }
});
```

Each transport type forms a sub-level within the _transport_
option. The recognized types depend on the transport plugins you have
loaded. By default, _web_ and _tcp_ are available. To use _redis_, for example, you
need to do this:

```js
var seneca = require("seneca");
seneca({
  transport: {
    redis: {
      timeout: 500
    }
  }
})
  // assumes npm install seneca-redis-transport
  .use("redis-transport")

  .listen({ type: "redis" });
```

You can set transport-level options inside the type property:

```js
var seneca = require("seneca");
seneca({
  transport: {
    tcp: {
      timeout: 1000
    }
  }
});
```

The transport-level options vary by transport.
