import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import { cancelBody, type Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';

/**
 * SqsDeleteMessageRequest
 *
 * @typedef {Object} SqsDeleteMessageRequest
 * @property {string} queueUrl - The URL of the queue to delete.
 * @property {string} receiptHandle - The receipt handle associated with the message to delete.
 */

export type SqsDeleteMessageRequest = Prettify<AWSBaseRequest & { queueUrl: string; receiptHandle: string }>;

/**
 * Delete a message from a queue
 * @param client - The AWS client
 * @param request - The request describing the message to delete
 * @returns The response from the AWS service.
 *
 * You must wait 60 seconds after deleting a queue before you can create another with the same name.
 *
 * @example
 * ```ts
 * await sqsDeleteMessage(client, {
 *   queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
 *   receiptHandle: '1234567890'
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_DeleteMessage.html
 */
export const sqsDeleteMessage = async (client: AWSClient, request: SqsDeleteMessageRequest): Promise<Response> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.DeleteMessage', {
    QueueUrl: request.queueUrl,
    ReceiptHandle: request.receiptHandle,
  });
  return cancelBody(await client.execute(awsRequest));
};
