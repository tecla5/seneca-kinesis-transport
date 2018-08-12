# seneca-kinesis-transport

Kinesis transport module for seneca

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

```

```

## create a reponse topic

```

```

## run tests

cd into the module test folder

```
cd seneca-kinesis-transport/test
```

### Support

TODO
