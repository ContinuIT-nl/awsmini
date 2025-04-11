import { assert } from '@std/assert';
import { clientAWS, sleep } from './testUtilities.ts';
import {
  sqsCreateQueue,
  sqsDeleteMessage,
  sqsDeleteQueue,
  sqsGetQueueAttributes,
  sqsGetQueueUrl,
  sqsListQueues,
  sqsPurgeQueue,
  sqsReceiveMessage,
  sqsSendMessage,
} from '../src/mod.ts';

const randomSuffix = Math.random().toString(36).substring(2, 15);

Deno.test('sqs - create/list/delete queue', async () => {
  const queueName = `test-queue-${randomSuffix}`;
  console.log('queueName', queueName);

  const result = await sqsCreateQueue(clientAWS, { queueName });
  assert(result.QueueUrl, 'queueUrl should be present');

  const result2 = await sqsListQueues(clientAWS, { queueNamePrefix: 'test' });
  assert(result2.QueueUrls.length > 0, 'QueueUrls should be present');
  assert(result2.QueueUrls.includes(result.QueueUrl), 'QueueUrl should be present');

  const result3 = await sqsGetQueueUrl(clientAWS, { queueName });
  assert(result3.QueueUrl, 'queueUrl should be present');
  assert(result3.QueueUrl === result.QueueUrl, 'queueUrl should be the same');

  const result4 = await sqsGetQueueAttributes(clientAWS, { queueUrl: result.QueueUrl });
  assert(result4.Attributes, 'attributes should be present');
  assert(Object.keys(result4.Attributes).length > 0, 'attributes should be present');
  console.log('attributes', result4.Attributes);

  await sqsPurgeQueue(clientAWS, { queueUrl: result.QueueUrl });

  await sqsDeleteQueue(clientAWS, { queueUrl: result.QueueUrl });
});

Deno.test('sqs - send message', async () => {
  const queueName = `test-queue2-${randomSuffix}`;
  console.log('queueName', queueName);

  const result = await sqsCreateQueue(clientAWS, { queueName });
  assert(result.QueueUrl, 'queueUrl should be present');

  const result2 = await sqsSendMessage(clientAWS, {
    QueueUrl: result.QueueUrl,
    MessageBody: 'Hello, world!',
    MessageAttributes: {
      'test': {
        DataType: 'String',
        StringValue: 'test',
      },
    },
  });
  assert(result2.MessageId, 'messageId should be present');
  console.log('result2', result2);

  // Wait for message to be received
  await sleep(1000);

  const result3 = await sqsReceiveMessage(clientAWS, {
    queueUrl: result.QueueUrl,
    maxNumberOfMessages: 1,
  });
  console.log('result3', result3);
  assert(result3.Messages.length > 0, 'messages should be present');
  assert(result3.Messages[0].Body, 'body should be present');
  assert(result3.Messages[0].Body === 'Hello, world!', 'body should be Hello, world!');
  assert(result3.Messages[0].MessageId, 'messageId should be present');
  assert(result3.Messages[0].ReceiptHandle, 'receiptHandle should be present');

  await sqsDeleteMessage(clientAWS, {
    queueUrl: result.QueueUrl,
    receiptHandle: result3.Messages[0].ReceiptHandle,
  });

  // Delete queue
  await sqsDeleteQueue(clientAWS, { queueUrl: result.QueueUrl });
});
