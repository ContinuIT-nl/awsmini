// Base part

export { AWSClient } from './client/AWSClient.ts';
export type { AWSFullRequest, AWSRequest } from './misc/awsTypes.ts';
export type { ClientConfig } from './client/clientConfig.ts';
export { clientConfigEnv } from './client/clientConfigEnv.ts';
export { clientConfigFile } from './client/clientConfigFile.ts';

// S3

export {
  S3AbortMultipartUpload,
  S3CompleteMultipartUpload,
  S3CreateMultipartUpload,
  S3GetObject,
  S3HeadObject,
  S3ListBuckets,
  S3ListObjects,
  S3PutObject,
  S3UploadPart,
} from './s3/s3.ts';

export type {
  S3AbortMultipartUploadRequest,
  S3CompleteMultipartUploadRequest,
  S3CreateMultipartUploadRequest,
  S3GetObjectRequest,
  S3HeadObjectRequest,
  S3ListBucketsRequest,
  S3ListObjectsRequest,
  S3PutObjectRequest,
} from './s3/s3.ts';

export { s3CopyObject, type S3CopyObjectRequest } from './s3/s3CopyObject.ts';
export { s3DeleteObject, type S3DeleteObjectRequest } from './s3/s3DeleteObject.ts';

export type { ListObjectResult, S3Bucket, S3BucketListResult, S3Object, S3Owner } from './s3/types.ts';

export { S3MultipartUpload, S3MultipartUploadStream } from './s3/multiPartUpload.ts';

// SQS

// SNS

// Lambda

// DynamoDB
