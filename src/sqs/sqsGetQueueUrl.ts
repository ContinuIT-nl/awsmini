import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';

/**
 * SqsGetQueueUrlRequest
 *
 * @typedef {Object} SqsGetQueueUrlRequest
 * @property {string} queueName - The name of the queue.
 * @property {string} [queueOwnerAWSAccountId] - The AWS account ID of the queue's owner (if not specified, the queue's owner is the account of the caller).
 */
export type SqsGetQueueUrlRequest = Prettify<AWSBaseRequest & { queueName: string; queueOwnerAWSAccountId?: string }>;

/**
 * SqsGetQueueUrlResponse
 *
 * @typedef {Object} SqsGetQueueUrlResponse
 * @property {string} QueueUrl - The URL of the queue.
 */
export type SqsGetQueueUrlResponse = {
  QueueUrl: string;
};

/**
 * Get the URL of a queue
 * @param client - The AWS client
 * @param request - The request describing the queue to get the URL of
 * @returns The response from the AWS service containing the queue URL
 *
 * @example
 * ```ts
 * const queueUrl = await sqsGetQueueUrl(client, { queueName: 'test-queue' });
 * console.log(queueUrl.QueueUrl);
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_GetQueueUrl.html
 */
export const sqsGetQueueUrl = async (
  client: AWSClient,
  request: SqsGetQueueUrlRequest,
): Promise<SqsGetQueueUrlResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.GetQueueUrl', {
    QueueName: request.queueName,
    QueueOwnerAWSAccountId: request.queueOwnerAWSAccountId,
  });
  const response = await client.execute(awsRequest);
  if (!response.ok) throw new AwsminiError('Error getting queue URL', 'sqs');
  return await response.json() as SqsGetQueueUrlResponse;
  // todo: do we need some pedantic mode where we typecheck the response?
};
