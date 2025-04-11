import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest, sqsMarshallAttribute, type SqsMessageToSend, type SqsSendMessageSent } from './sqs.ts';

/**
 * SqsSendMessageBatchRequestEntry
 *
 * @typedef {Object} SqsSendMessageBatchRequestEntry
 * @property {string} id - The id of the message to send.
 * @property {string} queueUrl - The URL of the queue to send the message to.
 * @property {string} messageBody - The body of the message to send.
 * @property {Record<string, MessageAttributeValue>} messageAttributes - The attributes of the message to send.
 * @property {string} messageDeduplicationId - The deduplication id of the message to send.
 * @property {string} messageGroupId - The group id of the message to send.
 * @property {Record<string, MessageAttributeValue>} messageSystemAttributes - The system attributes of the message to send.
 *   Can only contain AWSTraceHeader which must be a AWS X-Ray trace header string.
 */
export type SqsSendMessageBatchRequestEntry = SqsMessageToSend & { id: string };

/**
 * SqsSendMessageBatchRequest
 *
 * @typedef {Object} SqsSendMessageBatchRequest
 * @property {string} queueUrl - The URL of the queue to send the message to.
 * @property {SqsSendMessageBatchRequestEntry[]} entries - The entries to send.
 */
export type SqsSendMessageBatchRequest = Prettify<
  AWSBaseRequest & {
    queueUrl: string;
    entries: SqsSendMessageBatchRequestEntry[];
  }
>;

export type SqsSendMessageBatchFailedEntry = {
  Id: string;
  Code: string;
  Message: string;
  SenderFault: boolean;
};

/**
 * SqsSendMessageBatchSuccessfulEntry
 *
 * @typedef {Object} SqsSendMessageBatchSuccessfulEntry
 * @property {string} Id - The id of the message to send.
 * @property {SqsSendMessageSent} SqsSendMessageResponse - The response from the queue.
 */
export type SqsSendMessageBatchSuccessfulEntry = SqsSendMessageSent & { Id: string };

/**
 * SqsSendMessageBatchResponse
 *
 * @typedef {Object} SqsSendMessageBatchResponse
 * @property {SqsSendMessageBatchFailedEntry[]} Failed - The failed entries.
 * @property {SqsSendMessageBatchSuccessfulEntry[]} Successful - The successful entries.
 */
export type SqsSendMessageBatchResponse = {
  Failed: SqsSendMessageBatchFailedEntry[];
  Successful: SqsSendMessageBatchSuccessfulEntry[];
};

// todo: uncapitalize these?

/**
 * sqsSendMessageBatch
 *
 * @param {AWSClient} client - The AWS client.
 * @param {SqsSendMessageBatchRequest} request - The request to send the message to the queue.
 * @returns {Promise<SqsSendMessageBatchResponse>} - The response from the queue.
 *
 * @example
 * ```ts
 * const response = await sqsSendMessageBatch(client, {
 *   queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue',
 *   entries: [{ id: '1', messageBody: 'Hello,  world!' }, { id: '2', messageBody: 'Hello, again!' }],
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessageBatch.html
 */
export const sqsSendMessageBatch = async (
  client: AWSClient,
  request: SqsSendMessageBatchRequest,
): Promise<SqsSendMessageBatchResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.SendMessageBatch', {
    QueueUrl: request.queueUrl,
    Entries: request.entries.map((entry) => ({
      Id: entry.id,
      MessageBody: entry.messageBody,
      MessageAttributes: entry.messageAttributes
        ? Object.fromEntries(
          Object.entries(entry.messageAttributes).map(([key, value]) => [key, sqsMarshallAttribute(value)]),
        )
        : undefined,
      MessageDeduplicationId: entry.messageDeduplicationId,
      MessageGroupId: entry.messageGroupId,
      MessageSystemAttributes: entry.messageSystemAttributes
        ? Object.fromEntries(
          Object.entries(entry.messageSystemAttributes).map(([key, value]) => [key, sqsMarshallAttribute(value)]),
        )
        : undefined,
      DelaySeconds: entry.delaySeconds,
    })),
  });
  const response = await client.execute(awsRequest);
  const json = await response.json();
  return json as SqsSendMessageBatchResponse;
};
