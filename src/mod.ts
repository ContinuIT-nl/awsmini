export type { AWSConfig, AWSRequest, HTTPMethod } from './client.ts';
export { AWSClient } from './client.ts';

export {
  ListBuckets,
  S3CopyObject,
  S3DeleteObject,
  S3GetObject,
  S3HeadObject,
  S3ListObjects,
  S3PutObject,
} from './s3/s3.ts';

export type {
  S3AbortMultipartUploadRequest,
  S3CompleteMultipartUploadRequest,
  S3CopyObjectRequest,
  S3CreateMultipartUploadRequest,
  S3DeleteObjectRequest,
  S3GetObjectRequest,
  S3HeadObjectRequest,
  S3ListBucketsRequest,
  S3ListObjectsRequest,
  S3PutObjectRequest,
} from './s3/s3.ts';

export type { ListObjectResult, S3Bucket, S3BucketListResult, S3Object, S3Owner } from './s3/types.ts';

export type { ClientConfig } from './clientConfig.ts';
