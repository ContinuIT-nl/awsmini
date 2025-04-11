import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';

/**
 * SqsGetQueueAttributesRequest
 *
 * @typedef {Object} SqsGetQueueAttributesRequest
 * @property {string} queueUrl - The URL of the queue.
 * @property {string[]} [attributeNames] - A list of attributes to retrieve information for.
 */
export type SqsGetQueueAttributesRequest = Prettify<AWSBaseRequest & { queueUrl: string; attributeNames?: string[] }>;

/**
 * SqsGetQueueAttributesResponse
 *
 * @typedef {Object} SqsGetQueueAttributesResponse
 * @property {Object} Attributes - A map of attribute names to their values.
 */
export type SqsGetQueueAttributesResponse = {
  Attributes: {
    [key: string]: string;
  };
};

/**
 * Get the attributes of a queue
 *
 * @param client - The AWS client
 * @param request - The request describing the queue to get the attributes of
 * @returns The response from the AWS service containing the queue attributes
 *
 * @example
 * ```ts
 * const attributes = await sqsGetQueueAttributes(client, { queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue' });
 * console.log(attributes.Attributes);
 * ```
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_GetQueueAttributes.html
 */
export const sqsGetQueueAttributes = async (
  client: AWSClient,
  request: SqsGetQueueAttributesRequest,
): Promise<SqsGetQueueAttributesResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.GetQueueAttributes', {
    QueueUrl: request.queueUrl,
    AttributeNames: request.attributeNames ?? ['All'],
  });
  const response = await client.execute(awsRequest);
  if (!response.ok) throw new AwsminiError('Error getting queue attributes', 'sqs');
  return await response.json() as SqsGetQueueAttributesResponse;
  // todo: do we need some pedantic mode where we typecheck the response?
};
