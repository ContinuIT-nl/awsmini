import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';
import type { SqsSendMessageBatchFailedEntry } from './sqsSendMessageBatch.ts';

/**
 * SqsDeleteMessageBatchRequest
 *
 * @typedef {Object} SqsDeleteMessageBatchRequest
 * @property {string} queueUrl - The URL of the queue to delete messages from.
 * @property {Array<Object>} entries - A list of receipt handles for the messages to be deleted.
 * @property {string} entries[].id - An identifier for this particular receipt handle.
 * @property {string} entries[].receiptHandle - The receipt handle associated with the message to delete.
 */
export type SqsDeleteMessageBatchRequest = Prettify<
  AWSBaseRequest & {
    queueUrl: string;
    entries: {
      id: string;
      receiptHandle: string;
    }[];
  }
>;

/**
 * SqsDeleteMessageBatchResponse
 *
 * @typedef {Object} SqsDeleteMessageBatchResponse
 * @property {Array<Object>} successful - A list of successful deletions.
 * @property {Array<Object>} failed - A list of failed deletions.
 */
export type SqsDeleteMessageBatchResponse = Prettify<{
  successful?: { id: string }[];
  failed?: { id: string; code: string; message: string; senderFault: boolean }[];
}>;

/**
 * Delete a batch of messages from a queue
 * @param client - The AWS client
 * @param request - The request describing the messages to delete
 * @returns The response from the AWS service.
 *
 * @example
 * ```ts
 * await sqsDeleteMessageBatch(client, {
 *   queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
 *   entries: [
 *     { id: '1', receiptHandle: '12345678901' },
 *     { id: '2', receiptHandle: '12345678902' },
 *   ]
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_DeleteMessageBatch.html
 */
export const sqsDeleteMessageBatch = async (
  client: AWSClient,
  request: SqsDeleteMessageBatchRequest,
): Promise<SqsDeleteMessageBatchResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.DeleteMessageBatch', {
    QueueUrl: request.queueUrl,
    Entries: request.entries.map((e) => ({ Id: e.id, ReceiptHandle: e.receiptHandle })),
  });
  const response = await client.execute(awsRequest);
  const responseJson = await response.json();
  return {
    successful: responseJson.Successful?.map((e: { Id: string }) => ({ id: e.Id })),
    failed: responseJson.Failed?.map((e: SqsSendMessageBatchFailedEntry) => (
      { id: e.Id, code: e.Code, message: e.Message, senderFault: e.SenderFault }
    )),
  };
};
