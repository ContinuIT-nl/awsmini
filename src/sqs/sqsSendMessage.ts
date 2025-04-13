import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest, sqsMarshallAttribute, type SqsMessageToSend, type SqsSendMessageSent } from './sqs.ts';

/**
 * SqsSendMessageRequest
 *
 * @typedef {Object} SqsSendMessageRequest
 * @property {string} queueUrl - The URL of the queue to send the message to.
 * @property {string} messageBody - The body of the message to send.
 * @property {Record<string, MessageAttributeValue>} messageAttributes - The attributes of the message to send.
 * @property {string} messageDeduplicationId - The deduplication id of the message to send.
 * @property {string} messageGroupId - The group id of the message to send.
 * @property {Record<string, MessageAttributeValue>} messageSystemAttributes - The system attributes of the message to send.
 *   Can only contain AWSTraceHeader which must be a AWS X-Ray trace header string.
 */
export type SqsSendMessageRequest = Prettify<AWSBaseRequest & SqsMessageToSend & { queueUrl: string }>;

/**
 * SqsSendMessageResponse
 *
 * @typedef {Object} SqsSendMessageResponse
 * @property {string} messageId - The id of the message to send.
 * @property {string} md5OfMessageBody - The MD5 hash of the message body.
 * @property {string} md5OfMessageAttributes - The MD5 hash of the message attributes.
 * @property {string} md5OfMessageSystemAttributes - The MD5 hash of the message attributes.
 * @property {string} sequenceNumber - The sequence number of the message to send.
 */
export type SqsSendMessageResponse = {
  messageId: string;
  md5OfMessageBody: string;
  md5OfMessageAttributes: string;
  md5OfMessageSystemAttributes: string;
  sequenceNumber: string;
};

/**
 * sqsSendMessage
 *
 * @param {SqsSendMessageRequest} request - The request to send the message to the queue.
 * @returns {Promise<SqsSendMessageResponse>} - The response from the queue.
 *
 * @example
 * ```ts
 * const response = await sqsSendMessage(client, {
 *   queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue',
 *   messageBody: 'Hello, world!',
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessage.html
 */
export const sqsSendMessage = async (
  client: AWSClient,
  request: SqsSendMessageRequest,
): Promise<SqsSendMessageResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.SendMessage', {
    QueueUrl: request.queueUrl,
    MessageBody: request.messageBody,
    MessageAttributes: request.messageAttributes
      ? Object.fromEntries(
        Object.entries(request.messageAttributes).map(([key, value]) => [key, sqsMarshallAttribute(value)]),
      )
      : undefined,
    MessageDeduplicationId: request.messageDeduplicationId,
    MessageGroupId: request.messageGroupId,
    MessageSystemAttributes: request.messageSystemAttributes
      ? Object.fromEntries(
        Object.entries(request.messageSystemAttributes).map(([key, value]) => [key, sqsMarshallAttribute(value)]),
      )
      : undefined,
    DelaySeconds: request.delaySeconds,
  });
  const response = await client.execute(awsRequest);
  const sentResponse = (await response.json()) as SqsSendMessageSent;
  return {
    messageId: sentResponse.MessageId,
    md5OfMessageBody: sentResponse.MD5OfMessageBody,
    md5OfMessageAttributes: sentResponse.MD5OfMessageAttributes,
    md5OfMessageSystemAttributes: sentResponse.MD5OfMessageSystemAttributes,
    sequenceNumber: sentResponse.SequenceNumber,
  };
};
