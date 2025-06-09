# awsmini

Access AWS (compatible) services fast with simple tree-shakeable code

This module is a work in progress.

## Setup AWS client

The class AWSClient is used to perform the requests you want to make.
When setting up an instance, you can specify the credentials and a few other parameters.

If you want to set the parameters manually, you can do:

```typescript
const client = new AWSClient({
  region: 'us-east-1',
  accessKeyId: 'my-access-key',
  secretAccessKey: 'my-secret-access-key',
  ...
});
```

### From environment variables

```typescript
const client = new AWSClient(clientConfigEnv());
```

The configuration should be present in the environment variables (example for connecting to R2):

```ini
AWS_ENDPOINT_URL=https://some-user-id.r2.cloudflarestorage.com
AWS_ACCESS_KEY=my-access-key
AWS_SECRET_KEY=my-secret-key
AWS_REGION=auto
```

### From `~/.aws`

To be implemented

### From SSO

To be implemented

### From IMDSv2

To be implemented

### Combining several sources

Better explanation here

```typescript
const client = new AWSClient(clientConfigEnv(clientConfigFromSSO()));
```

## S3

For detailed examples and usage, see the [S3 documentation](./doc/s3.md).

### Available Functions

- [`s3AbortMultipartUpload`](./doc/s3.md#s3abortmultipartupload) - Abort a multipart upload
- [`s3CompleteMultipartUpload`](./doc/s3.md#s3completemultipartupload) - Complete a multipart upload
- [`s3CopyObject`](./doc/s3.md#s3copyobject) - Copy an object from one location to another
- [`s3CreateMultipartUpload`](./doc/s3.md#s3createmultipartupload) - Initiate a multipart upload
- [`s3DeleteObject`](./doc/s3.md#s3deleteobject) - Delete an object from S3
- [`s3DeleteObjects`](./doc/s3.md#s3deleteobjects) - Delete multiple objects from S3
- [`s3GetObject`](./doc/s3.md#s3getobject) - Get an object from S3
- [`s3HeadObject`](./doc/s3.md#s3headobject) - Get object metadata without downloading the object
- [`s3ListBuckets`](./doc/s3.md#s3listbuckets) - List all buckets
- [`s3ListObjects`](./doc/s3.md#s3listobjects) - List objects in a bucket with optional prefix and delimiter
- [`s3PutObject`](./doc/s3.md#s3putobject) - Upload a file to S3
- [`s3UploadPart`](./doc/s3.md#s3uploadpart) - Upload a part of a multipart upload

## Lambda

For detailed examples and usage, see the [Lambda documentation](./doc/lambda.md).

### Available Functions

- [`lambdaInvoke`](./doc/lambda.md#lambdainvoke) - Invoke a Lambda function
- [`lambdaListFunctionsAll`](./doc/lambda.md#lambdalistfunctionsall) - List all Lambda functions with pagination

## SQS

For detailed examples and usage, see the [SQS documentation](./doc/sqs.md).

### Available Functions

- [`sqsCreateQueue`](./doc/sqs.md#sqscreatequeue) - Create a new queue
- [`sqsDeleteMessage`](./doc/sqs.md#sqsdeletemessage) - Delete a message from a queue
- [`sqsDeleteMessageBatch`](./doc/sqs.md#sqsdeletemessagebatch) - Delete multiple messages from a queue
- [`sqsDeleteQueue`](./doc/sqs.md#sqsdeletequeue) - Delete a queue
- [`sqsGetQueueAttributes`](./doc/sqs.md#sqsgetqueueattributes) - Get queue attributes
- [`sqsGetQueueUrl`](./doc/sqs.md#sqsgetqueueurl) - Get the URL for a queue by name
- [`sqsListQueues`](./doc/sqs.md#sqslistqueues) - List all queues
- [`sqsPurgeQueue`](./doc/sqs.md#sqspurgequeue) - Purge all messages from a queue
- [`sqsReceiveMessage`](./doc/sqs.md#sqsreceivemessage) - Receive messages from a queue
- [`sqsSendMessage`](./doc/sqs.md#sqssendmessage) - Send a message to a queue
- [`sqsSendMessageBatch`](./doc/sqs.md#sqssendmessagebatch) - Send multiple messages to a queue
