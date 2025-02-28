import type { AWSBaseRequest, AWSRequest, HTTPMethod } from '../misc/awsTypes.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';

// types
export type S3BucketRequest = AWSBaseRequest & { bucket: string };

export type S3KeyRequest = S3BucketRequest & { key: string };

// Request building
export const S3KeyOptions = (request: S3KeyRequest, method: HTTPMethod): AWSRequest => {
  if (!request.key) throw new AwsminiError('Key is required and should be at least one character long', 's3');
  return {
    method,
    subhost: request.bucket,
    path: `/${request.key}`,
    service: 's3',
    queryParameters: {},
    headers: {},
    checkResponse: request.checkResponse ?? true,
    signal: request.signal,
  };
};

export const S3BaseOptions = (request: S3BucketRequest, method: HTTPMethod): AWSRequest => ({
  method,
  subhost: request.bucket,
  path: '/',
  service: 's3',
  queryParameters: {},
  headers: {},
  checkResponse: request.checkResponse ?? true,
  signal: request.signal,
});

// Precondition Header Fields
// See https://datatracker.ietf.org/doc/html/rfc7232#section-3
export type AWSIfOptions = {
  ifMatch?: string;
  ifNoneMatch?: string;
  ifModifiedSince?: string;
  ifUnmodifiedSince?: string;
};

export const awsAddIfOptions = (req: AWSRequest, options: AWSIfOptions) => {
  // Validate options
  if (options.ifMatch && !options.ifNoneMatch) {
    throw new AwsminiError('ifMatch and ifNoneMatch cannot be used together', 's3');
  }
  if (options.ifNoneMatch && !options.ifMatch) {
    throw new AwsminiError('ifNoneMatch and ifMatch cannot be used together', 's3');
  }
  if (options.ifModifiedSince && !options.ifUnmodifiedSince) {
    throw new AwsminiError('ifModifiedSince and ifUnmodifiedSince cannot be used together', 's3');
  }
  if (options.ifUnmodifiedSince && !options.ifModifiedSince) {
    throw new AwsminiError('ifUnmodifiedSince and ifModifiedSince cannot be used together', 's3');
  }

  // Add options
  if (options.ifMatch) req.headers['If-Match'] = options.ifMatch;
  if (options.ifNoneMatch) req.headers['If-None-Match'] = options.ifNoneMatch;
  if (options.ifModifiedSince) req.headers['If-Modified-Since'] = options.ifModifiedSince;
  if (options.ifUnmodifiedSince) req.headers['If-Unmodified-Since'] = options.ifUnmodifiedSince;
};
