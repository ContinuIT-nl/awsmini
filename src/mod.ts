// Base part

export { AWSClient } from './client/AWSClient.ts';
export type { AWSFullRequest, AWSRequest } from './misc/awsTypes.ts';
export type { ClientConfig } from './client/clientConfig.ts';
export { clientConfigEnv } from './client/clientConfigEnv.ts';

// S3

export { s3CopyObject, type S3CopyObjectRequest } from './s3/s3CopyObject.ts';
export { s3DeleteObject, type S3DeleteObjectRequest } from './s3/s3DeleteObject.ts';
export { s3GetObject, type S3GetObjectRequest, s3GetObjectStream, s3GetObjectText } from './s3/s3GetObject.ts';
export { s3HeadObject, type S3HeadObjectRequest } from './s3/s3HeadObject.ts';
export { s3ListBuckets, type S3ListBucketsRequest } from './s3/s3ListBuckets.ts';
export { s3ListObjects, type S3ListObjectsRequest } from './s3/s3ListObjects.ts';
export { s3PutObject, type S3PutObjectRequest } from './s3/s3PutObject.ts';

export { s3CreateMultipartUpload, type S3CreateMultipartUploadRequest } from './s3/s3CreateMultipartUpload.ts';
export { s3UploadPart, type S3UploadPartRequest } from './s3/s3UploadPart.ts';
export { s3CompleteMultipartUpload, type S3CompleteMultipartUploadRequest } from './s3/s3CompleteMultipartUpload.ts';
export { s3AbortMultipartUpload, type S3AbortMultipartUploadRequest } from './s3/s3AbortMultipartUpload.ts';

export type { ListObjectResult, S3Bucket, S3BucketListResult, S3Object, S3Owner } from './s3/types.ts';

export { buildMultipartUploadBody, S3MultipartUpload, S3MultipartUploadStream } from './s3/multiPartUpload.ts';

// SQS

export { type MessageAttributeValue, sqsMarshallAttribute } from './sqs/sqs.ts';
export { sqsCreateQueue, type SqsCreateQueueRequest, type SqsCreateQueueResponse } from './sqs/sqsCreateQueue.ts';
export { sqsDeleteQueue, type SqsDeleteQueueRequest } from './sqs/sqsDeleteQueue.ts';
export { sqsPurgeQueue, type SqsPurgeQueueRequest } from './sqs/sqsPurgeQueue.ts';
export { sqsListQueues, type SqsListQueuesRequest, type SqsListQueuesResponse } from './sqs/sqsListQueues.ts';
export { sqsGetQueueUrl, type SqsGetQueueUrlRequest, type SqsGetQueueUrlResponse } from './sqs/sqsGetQueueUrl.ts';
export {
  sqsGetQueueAttributes,
  type SqsGetQueueAttributesRequest,
  type SqsGetQueueAttributesResponse,
} from './sqs/sqsGetQueueAttributes.ts';

export { sqsDeleteMessage, type SqsDeleteMessageRequest } from './sqs/sqsDeleteMessage.ts';
export { sqsDeleteMessageBatch, type SqsDeleteMessageBatchRequest } from './sqs/sqsDeleteMessageBatch.ts';
export { sqsSendMessage, type SqsSendMessageRequest, type SqsSendMessageResponse } from './sqs/sqsSendMessage.ts';
export {
  sqsSendMessageBatch,
  type SqsSendMessageBatchRequest,
  type SqsSendMessageBatchResponse,
} from './sqs/sqsSendMessageBatch.ts';
export {
  sqsReceiveMessage,
  type SqsReceiveMessageRequest,
  type SqsReceiveMessageResponse,
} from './sqs/sqsReceiveMessage.ts';

// SNS

// Lambda

export { lambdaInvoke, type LambdaInvokeRequest, type LambdaInvokeResponse } from './lambda/lambdaInvoke.ts';
export {
  lambdaListFunctions,
  type LambdaListFunctionsRequest,
  type LambdaListFunctionsResponse,
} from './lambda/lambdaListFunctions.ts';
export { lambdaListFunctionsAll, type LambdaListFunctionsAllRequest } from './lambda/lambdaListFunctionsAll.ts';

// DynamoDB
