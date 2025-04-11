import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';

export const sqsAwsRequest = (request: AWSBaseRequest, target: string, body: unknown): AWSRequest => ({
  method: 'POST',
  path: '/',
  service: 'sqs',
  queryParameters: {},
  headers: {
    'x-amz-target': target,
    'content-type': 'application/x-amz-json-1.0',
  },
  body: new TextEncoder().encode(JSON.stringify(body)),
  checkResponse: true,
  signal: request.signal,
});
