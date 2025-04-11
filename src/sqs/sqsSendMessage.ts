import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest, sqsMarshallAttribute } from './sqs.ts';

/**
 * SqsMessageToSend
 *
 * @typedef {Object} SqsMessageToSend
 * @property {string} MessageBody - The body of the message to send. 1 byte to 256 KB.
 *                                  A message can include only XML, JSON, and unformatted text.
 *                                  Supported characters are #x9 | #xA | #xD | #x20 to #xD7FF | #xE000 to #xFFFD | #x10000 to #x10FFFF
 * @property {Record<string, MessageAttributeValue>} MessageAttributes - The attributes of the message to send.
 * @property {string} MessageDeduplicationId - The deduplication id of the message to send.
 *                                             This parameter applies only to FIFO (first-in-first-out) queues.
 * @property {string} MessageGroupId - The group id of the message to send.
 *                                     This parameter applies only to FIFO (first-in-first-out) queues.
 * @property {Record<string, MessageAttributeValue>} MessageSystemAttributes - The system attributes of the message to send.
 *   Can only contain AWSTraceHeader which must be a AWS X-Ray trace header string.
 * @property {number} DelaySeconds - The delay in seconds for the message to be sent.
 */
export type SqsMessageToSend = {
  messageBody: string;
  messageAttributes?: Record<string, string | number | Uint8Array>;
  messageDeduplicationId?: string;
  messageGroupId?: string;
  messageSystemAttributes?: Record<'AWSTraceHeader', string>;
  delaySeconds?: number;
};

// todo: SendMessageBatchRequestEntry also contains Id, An identifier for a message in this batch used to communicate the result.

/**
 * SqsSendMessageRequest
 *
 * @typedef {Object} SqsSendMessageRequest
 * @property {string} queueUrl - The URL of the queue to send the message to.
 * @property {string} messageBody - The body of the message to send.
 */
export type SqsSendMessageRequest = Prettify<AWSBaseRequest & SqsMessageToSend & { queueUrl: string }>;

/**
 * SqsSendMessageResponse
 *
 * @typedef {Object} SqsSendMessageResponse
 * @property {string} MessageId - The id of the message to send.
 * @property {string} MD5OfMessageBody - The MD5 hash of the message body.
 * @property {string} MD5OfMessageAttributes - The MD5 hash of the message attributes.
 * @property {string} MD5OfMessageSystemAttributes - The MD5 hash of the message attributes.
 * @property {string} SequenceNumber - The sequence number of the message to send.
 */
export type SqsSendMessageResponse = {
  MessageId: string;
  MD5OfMessageBody: string;
  MD5OfMessageAttributes: string;
  MD5OfMessageSystemAttributes: string;
  SequenceNumber: string;
};

/**
 * sqsSendMessage
 *
 * @param {SqsSendMessageRequest} request - The request to send the message to the queue.
 * @returns {Promise<SqsSendMessageResponse>} - The response from the queue.
 */
export const sqsSendMessage = async (
  client: AWSClient,
  request: SqsSendMessageRequest,
): Promise<SqsSendMessageResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.SendMessage', {
    QueueUrl: request.queueUrl,
    MessageBody: request.messageBody,
    MessageAttributes: request.messageAttributes ? Object.fromEntries(
      Object.entries(request.messageAttributes).map(([key, value]) => [key, sqsMarshallAttribute(value)]),
    ) : undefined,
    MessageDeduplicationId: request.messageDeduplicationId,
    MessageGroupId: request.messageGroupId,
    MessageSystemAttributes: request.messageSystemAttributes ? Object.fromEntries(
      Object.entries(request.messageSystemAttributes).map(([key, value]) => [key, sqsMarshallAttribute(value)]),
    ) : undefined,
    DelaySeconds: request.delaySeconds,
  });
  const response = await client.execute(awsRequest);
  const json = await response.json();
  return json as SqsSendMessageResponse;
};
