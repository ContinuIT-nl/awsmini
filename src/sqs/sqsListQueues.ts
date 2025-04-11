import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';

/**
 * SqsListQueuesRequest
 *
 * @typedef {Object} SqsListQueuesRequest
 * @property {number} [maxResults]      - Maximum number of results to include in the response.
 *                                        Value range is 1 to 1000.
 *                                        You must set MaxResults to receive a value for NextToken in the response.
 * @property {string} [nextToken]       - Pagination token to request the next set of results.
 * @property {string} [queueNamePrefix] - A string to use for filtering the list results.
 *                                        Only those queues whose names begin with the specified string are returned.
 */

export type SqsListQueuesRequest = Prettify<
  AWSBaseRequest & {
    maxResults?: number;
    nextToken?: string;
    queueNamePrefix?: string;
  }
>;

/**
 * SqsListQueuesResponse
 *
 * @typedef {Object} SqsListQueuesResponse
 * @property {string[]} QueueUrls - A list of queue URLs.
 * @property {string} NextToken   - Pagination token to include in the next request.
 *                                  Token value is null if there are no additional results to request,
 *                                  or if you did not set MaxResults in the request.
 */
export type SqsListQueuesResponse = {
  QueueUrls: string[];
  NextToken: string;
};

/**
 * List queues
 * @param client - The AWS client
 * @param request - The request describing the queue to delete
 * @returns The response from the AWS service.
 *
 * @example
 * ```ts
 * await sqsListQueues(client, { queueNamePrefix: 'test' });
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ListQueues.html
 */
export const sqsListQueues = async (
  client: AWSClient,
  request: SqsListQueuesRequest,
): Promise<SqsListQueuesResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.ListQueues', {
    MaxResults: request.maxResults,
    NextToken: request.nextToken,
    QueueNamePrefix: request.queueNamePrefix,
  });
  const response = await client.execute(awsRequest);
  return await response.json() as SqsListQueuesResponse;
  // todo: do we need some pedantic mode where we typecheck the response?
};

// todo: also add a generator version of this function
