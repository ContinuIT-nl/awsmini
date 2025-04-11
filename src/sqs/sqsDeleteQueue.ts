import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import { cancelBody, type Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';

/**
 * SqsDeleteQueueRequest
 *
 * @typedef {Object} SqsDeleteQueueRequest
 * @property {string} queueUrl - The URL of the queue to delete.
 */

export type SqsDeleteQueueRequest = Prettify<AWSBaseRequest & { queueUrl: string }>;

/**
 * Delete a queue
 * @param client - The AWS client
 * @param request - The request describing the queue to delete
 * @returns The response from the AWS service.
 *
 * You must wait 60 seconds after deleting a queue before you can create another with the same name.
 *
 * @example
 * ```ts
 * await sqsDeleteQueue(client, { queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue' });
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_DeleteQueue.html
 */
export const sqsDeleteQueue = async (
  client: AWSClient,
  request: SqsDeleteQueueRequest,
): Promise<Response> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.DeleteQueue', { QueueUrl: request.queueUrl });
  return cancelBody(await client.execute(awsRequest));
};
