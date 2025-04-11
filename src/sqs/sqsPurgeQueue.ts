import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import { cancelBody, type Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';

/**
 * SqsPurgeQueueRequest
 *
 * @typedef {Object} SqsPurgeQueueRequest
 * @property {string} queueUrl - The URL of the queue to purge.
 */

export type SqsPurgeQueueRequest = Prettify<AWSBaseRequest & { queueUrl: string }>;

/**
 * Purge a queue
 * @param client - The AWS client
 * @param request - The request describing the queue to purge
 * @returns The response from the AWS service.
 *
 * @example
 * ```ts
 * await sqsPurgeQueue(client, { queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue' });
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_PurgeQueue.html
 */
export const sqsPurgeQueue = async (
  client: AWSClient,
  request: SqsPurgeQueueRequest,
): Promise<Response> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.PurgeQueue', { QueueUrl: request.queueUrl });
  return cancelBody(await client.execute(awsRequest));
};
