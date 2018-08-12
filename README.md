# seneca-kinesis-transport

Kinesis transport module for seneca.

## Implement the Record Processor

The simplest possible consumer using the KCL for Node.js must implement a recordProcessor function, which in turn contains the functions `initialize`, `processRecords`, and `shutdown`.

The sample app provides an implementation that you can use as a starting point.

The KCL calls the `initialize` function when the record processor starts. This record processor processes only the shard ID passed as `initializeInput.shardId`, and typically, the reverse is also true (this shard is processed only by this record processor). However, your consumer should account for the possibility that a data record might be processed more than one time.

This is because Kinesis Data Streams has at least once semantics, meaning that every data record from a shard is processed at least one time by a worker in your consumer. For more information about cases in which a particular shard might be processed by more than one worker, see Resharding, Scaling, and Parallel Processing.

### processRecords

The KCL calls this function with input that contains a list of data records from the shard specified to the `initialize` function. The record processor that you implement processes the data in these records according to the semantics of your consumer. For example, the worker might perform a transformation on the data and then store the result in an _Amazon Simple Storage Service_ (Amazon S3) bucket.

In addition to the data itself, the record also contains a sequence number and partition key, which the worker can use when processing the data. For example, the worker could choose the S3 bucket in which to store the data based on the value of the partition key. The record dictionary exposes the following key-value pairs to access the record's data, sequence number, and partition key:

```js
record.data;
record.sequenceNumber;
record.partitionKey;
```

Note that the data is Base64-encoded.

In the basic sample, the function `processRecords` has code that shows how a worker can access the record's data, sequence number, and partition key.

_Kinesis Data Streams_ requires the record processor to keep track of the records that have already been processed in a shard. The KCL takes care of this tracking for with a checkpointer object passed as `processRecordsInput.checkpointer`. Your record processor calls the `checkpointer.checkpoint` function to inform the KCL how far it has progressed in processing the records in the shard. In the event that the worker fails, the KCL uses this information when you restart the processing of the shard so that it continues from the last known processed record.

For a split or merge operation, the KCL doesn't start processing the new shards until the processors for the original shards have called `checkpoint` to signal that all processing on the original shards is complete.

If you don't pass the sequence number to the `checkpoint` function, the KCL assumes that the call to `checkpoint` means that all records have been processed, up to the last record that was passed to the record processor. Therefore, the record processor should call `checkpoint` only after it has processed all the records in the list that was passed to it.

Record processors do not need to call `checkpoint` on each call to `processRecords`. A processor could, for example, call `checkpoint` on every third call, or some event external to your record processor, such as a custom verification/validation service you've implemented.

You can optionally specify the exact sequence number of a record as a parameter to `checkpoint`. In this case, the KCL assumes that all records have been processed up to that record only.

The basic sample application shows the simplest possible call to the `checkpointer.checkpoint` function. You can add other checkpointing logic you need for your consumer at this point in the function.

### shutdown

The KCL calls the `shutdown` function either when processing ends (`shutdownInput.reason` is `TERMINATE`) or the worker is no longer responding (`shutdownInput.reason` is `ZOMBIE`).

Processing ends when the record processor does not receive any further records from the shard, because either the shard was split or merged, or the stream was deleted.

The KCL also passes a `shutdownInput.checkpointer` object to shutdown. If the shutdown reason is `TERMINATE`, you should make sure that the record processor has finished processing any data records, and then call the checkpoint function on this interface.

## AWS Credentials

See [DefaultAWSCredentialsProviderChain](https://docs.aws.amazon.com/AWSJavaSDK/latest/javadoc/com/amazonaws/auth/DefaultAWSCredentialsProviderChain.html)

AWS credentials provider chain that looks for credentials in this order:

- Environment Variables - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (RECOMMENDED since they are recognized by all the AWS SDKs and CLI except for .NET), or `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` (only recognized by Java SDK)
- Java System Properties - `aws.accessKeyId` and `aws.secretKey`
  Credential profiles file at the default location (`~/.aws/credentials`) shared by all AWS SDKs and the AWS CLI
- Credentials delivered through the Amazon EC2 container service if `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` environment variable is set and security manager has permission to access the variable,
- Instance profile credentials delivered through the Amazon EC2 metadata service

The `sample/consumer/sample.properties` file contains sample values.

## Setup Kinesis

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