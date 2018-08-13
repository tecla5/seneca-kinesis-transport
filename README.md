# seneca-kinesis-transport

Kinesis transport module for [senecaJS](senecajs.org/)

## AWS kinesis node client

The following goes through how to use the kinesis node client supplied by AWS.
This might be too raw (low level) for use with SenecaJS.

We then briefly touch on a more suitable alternative (wrapper) library [kinesis](https://github.com/mhart/kinesis) which looks like a much better fit.
This would need to be used with pattern matching using [patrun](https://www.npmjs.com/package/patrun)

### Implement the Record Processor

The simplest possible consumer using the KCL for Node.js must implement a recordProcessor function, which in turn contains the functions `initialize`, `processRecords`, and `shutdown`.

The sample app provides an implementation that you can use as a starting point.

The KCL calls the `initialize` function when the record processor starts. This record processor processes only the shard ID passed as `initializeInput.shardId`, and typically, the reverse is also true (this shard is processed only by this record processor). However, your consumer should account for the possibility that a data record might be processed more than one time.

This is because Kinesis Data Streams has at least once semantics, meaning that every data record from a shard is processed at least one time by a worker in your consumer. For more information about cases in which a particular shard might be processed by more than one worker, see Resharding, Scaling, and Parallel Processing.

#### processRecords

The KCL calls this function with input that contains a list of data records from the shard specified to the `initialize` function. The record processor that you implement processes the data in these records according to the semantics of your consumer. For example, the worker might perform a transformation on the data and then store the result in an _Amazon Simple Storage Service_ (Amazon S3) bucket.

In addition to the data itself, the record also contains a sequence number and partition key, which the worker can use when processing the data. For example, the worker could choose the S3 bucket in which to store the data based on the value of the partition key. The record dictionary exposes the following key-value pairs to access the record's data, sequence number, and partition key:

```js
record.data;
record.sequenceNumber;
record.partitionKey;
```

Note that the `data` is Base64-encoded.

In the basic sample, the function `processRecords` has code that shows how a worker can access the record's data, sequence number, and partition key.

_Kinesis Data Streams_ requires the record processor to keep track of the records that have already been processed in a shard. The KCL takes care of this tracking for with a checkpointer object passed as `processRecordsInput.checkpointer`. Your record processor calls the `checkpointer.checkpoint` function to inform the KCL how far it has progressed in processing the records in the shard. In the event that the worker fails, the KCL uses this information when you restart the processing of the shard so that it continues from the last known processed record.

For a split or merge operation, the KCL doesn't start processing the new shards until the processors for the original shards have called `checkpoint` to signal that all processing on the original shards is complete.

If you don't pass the sequence number to the `checkpoint` function, the KCL assumes that the call to `checkpoint` means that all records have been processed, up to the last record that was passed to the record processor. Therefore, the record processor should call `checkpoint` only after it has processed all the records in the list that was passed to it.

Record processors do not need to call `checkpoint` on each call to `processRecords`. A processor could, for example, call `checkpoint` on every third call, or some event external to your record processor, such as a custom verification/validation service you've implemented.

You can optionally specify the exact sequence number of a record as a parameter to `checkpoint`. In this case, the KCL assumes that all records have been processed up to that record only.

The basic sample application shows the simplest possible call to the `checkpointer.checkpoint` function. You can add other checkpointing logic you need for your consumer at this point in the function.

In `processRecords(processRecordsInput, completeCallback)` we call `processRecord` for each record being consumed.

```js
  processRecords(processRecordsInput, completeCallback) {
      // ...
      for (record of records) {
        // process each incoming record from kinesis stream
        this.processRecord(record)
      }
      // ...
      // call completeCallback
  }

  processRecord(record) {
    createRecordProcessor().process(record)
  }

  createRecordProcessor() {
    return new this.RecordProcessor(this.options)
  }
```

To customize record processing, simply pass a `RecordProcessor` class in options.
You can subclass the default `RecordProcessor` in `lib/consumer/record-processor` to suit your needs

#### shutdown

The KCL calls the `shutdown` function either when processing ends (`shutdownInput.reason` is `TERMINATE`) or the worker is no longer responding (`shutdownInput.reason` is `ZOMBIE`).

Processing ends when the record processor does not receive any further records from the shard, because either the shard was split or merged, or the stream was deleted.

The KCL also passes a `shutdownInput.checkpointer` object to shutdown. If the shutdown reason is `TERMINATE`, you should make sure that the record processor has finished processing any data records, and then call the checkpoint function on this interface.

### AWS Credentials

See [DefaultAWSCredentialsProviderChain](https://docs.aws.amazon.com/AWSJavaSDK/latest/javadoc/com/amazonaws/auth/DefaultAWSCredentialsProviderChain.html)

AWS credentials provider chain that looks for credentials in this order:

- Environment Variables - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (RECOMMENDED since they are recognized by all the AWS SDKs and CLI except for .NET), or `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` (only recognized by Java SDK)
- Java System Properties - `aws.accessKeyId` and `aws.secretKey`
  Credential profiles file at the default location (`~/.aws/credentials`) shared by all AWS SDKs and the AWS CLI
- Credentials delivered through the Amazon EC2 container service if `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` environment variable is set and security manager has permission to access the variable,
- Instance profile credentials delivered through the Amazon EC2 metadata service

The `sample/consumer/sample.properties` file contains sample values.

### Setup Kinesis

Set the following process environment variables in your run environment:

From a Node.js app: `process.env.AWS_KINESIS_REGION = "us-east-1";`

The defaults used are the following:

```js
AWS_KINESIS_REGION = "us-east-1";
AWS_KINESIS_TOPIC = "seneca-default-topic";
AWS_KINESIS_SHARDS = 2;
AWS_KINESIS_WAIT_SECS = 5;
```

See [AWS kinesis-client-nodejs basic sample](https://github.com/awslabs/amazon-kinesis-client-nodejs/blob/master/samples/basic_sample)

In Kinesis we use `ack` (inbound actions) and `res` (outbound responses) stream partitions as required for implementing custom Seneca transports

We need to match on inbound actions (in consumer) using [patrun](https://www.npmjs.com/package/patrun) just like [microbial](https://github.com/pelger/microbial/blob/master/lib/kernel/executor.js#L40) does.

Here the most important microbial code extracts we can (or are) reusing to some extent in the `SenecaBus` class.

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

We could also look at [pc-seneca-kafka-transport](https://www.npmjs.com/package/pc-seneca-kafka-transport) for inspiration

## create a request topic

TODO

```

```

## create a reponse topic

TODO

```

```

## run tests

Step into the `test` folder

`seneca-kinesis-transport $ cd test`

Run the tests

### Support

TODO
