import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';
import { capitalize, type Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';

/**
 * SqsCreateQueueRequest
 *
 * @typedef {Object} SqsCreateQueueRequest
 * @property {string} queueName - The name of the new queue. The following limits apply to this name:
 *  - A queue name can have up to 80 characters.
 *  - Valid values: alphanumeric characters, hyphens (-), and underscores (_).
 *  - A FIFO queue name must end with the .fifo suffix.
 *  - Queue URLs and names are case-sensitive.
 * @property {Object} [attributes] - The attributes of the queue
 * @property {number} [attributes.delaySeconds] - The length of time, in seconds, for which the delivery of all messages in the queue is delayed. Valid values: An integer from 0 to 900.
 * @property {number} [attributes.maximumMessageSize] - The limit of how many bytes a message can contain before Amazon SQS rejects it. Valid values: An integer from 1024 to 262144. Default: 262144 (256 KiB).
 * @property {number} [attributes.messageRetentionPeriod] - The length of time, in seconds, for which Amazon SQS retains a message. Valid values: An integer from 60 to 1209600 (14 days). Default: 4 days.
 * @property {string} [attributes.policy] - A policy that grants Amazon SQS or Amazon SNS permissions to access resources in the queue.
 * @property {number} [attributes.receiveMessageWaitTimeSeconds] - The length of time, in seconds, for which a ReceiveMessage action waits for a message to arrive. Valid values: An integer from 0 to 20. Default: 0.
 * @property {number} [attributes.visibilityTimeout] - The length of time, in seconds, for which a message is hidden from other consumers after a message is received. Valid values: An integer from 0 to 43200 (12 hours). Default: 30.
 * Dead letter queue properties
 * @property {string} [attributes.redrivePolicy] - The string that includes the parameters for the dead-letter queue functionality of the source queue.
 * Server side encryption properties
 * @property {string} [attributes.kmsMasterKeyId] - The ID of an AWS-managed customer master key (CMK) for Amazon SQS or a custom CMK.
 * @property {string} [attributes.kmsDataKeyReusePeriodSeconds] - The length of time, in seconds, for which Amazon SQS can reuse a data key to encrypt or decrypt messages.
 * @property {boolean} [attributes.sqsManagedSseEnabled] - Enables server-side encryption (SSE) using a service-managed key for the queue.
 * FIFO queue properties
 * @property {boolean} [attributes.fifoQueue] - Enables the FIFO queue feature for the queue.
 * @property {number} [attributes.contentBasedDeduplication] - Enables content-based deduplication for the queue.
 * High throughput FIFO queue properties
 * @property {number} [attributes.deduplicationScope] - Specifies whether message deduplication in the queue is based on the message body or attributes.
 * @property {number} [attributes.fifoThroughputLimit] - Specifies the maximum number of transactions per second (TPS) for the queue.
 * @property {number} [attributes.maxReceiveCount] - The number of times a message is received from the queue before it is dead-lettered.
 * @property {number} [attributes.messageGroupPrefix] - The tag that specifies that a message belongs to a specific message group.
 *
 * @property {Record<string, string>} [tags] - The tags to be added to the queue.
 */

export type SqsCreateQueueRequest = Prettify<
  AWSBaseRequest & {
    queueName: string;
    attributes?: {
      delaySeconds?: number;
      maximumMessageSize?: number;
      messageRetentionPeriod?: number;
      policy?: string;
      receiveMessageWaitTimeSeconds?: number;
      visibilityTimeout?: number;
      redrivePolicy?: string;
      kmsMasterKeyId?: string;
      kmsDataKeyReusePeriodSeconds?: number;
      sqsManagedSseEnabled?: boolean;
      fifoQueue?: boolean;
      contentBasedDeduplication?: boolean;
      deduplicationScope?: 'messageGroup' | 'queue';
      fifoThroughputLimit?: 'perQueue' | 'perMessageGroup';
      maxReceiveCount?: number;
      messageGroupPrefix?: string;
    };
    tags?: Record<string, string>;
  }
>;

/**
 * SqsCreateQueueResponse
 *
 * @typedef {Object} SqsCreateQueueResponse
 * @property {string} QueueUrl - The URL of the queue.
 */
export type SqsCreateQueueResponse = {
  QueueUrl: string;
};

/**
 * Create a queue
 * @param client - The AWS client
 * @param request - The request describing the queue to create
 * @returns The response from the AWS service containing the queue URL
 *
 * @example
 * ```ts
 * const queueUrl = await sqsCreateQueue(client, { queueName: 'test-queue' });
 * console.log(queueUrl.QueueUrl);
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_CreateQueue.html
 */
export const sqsCreateQueue = async (
  client: AWSClient,
  request: SqsCreateQueueRequest,
): Promise<SqsCreateQueueResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.CreateQueue', {
    QueueName: request.queueName,
    Attributes: capitalize(request.attributes),
    tags: request.tags,
  });
  const response = await client.execute(awsRequest);
  if (!response.ok) throw new AwsminiError('Error creating queue', 'sqs');
  return await response.json() as SqsCreateQueueResponse;
  // todo: do we need some pedantic mode where we typecheck the response?
};
