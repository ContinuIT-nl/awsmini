# SQS Examples

## sqsSendMessage

```typescript
import { sqsSendMessage } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// Send a message to the queue
const response = await sqsSendMessage(client, {
  queueUrl: 'YOUR_QUEUE_URL',
  messageBody: 'Hello SQS!',
});

console.log('Message sent with ID:', response.messageId);
```

## sqsSendMessageBatch

```typescript
import { sqsSendMessageBatch } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// Send multiple messages to the queue
const response = await sqsSendMessageBatch(client, {
  queueUrl: 'YOUR_QUEUE_URL',
  entries: [
    { id: 'msg1', messageBody: 'First batch message' },
    { id: 'msg2', messageBody: 'Second batch message' },
  ],
});

console.log('Successfully sent:', response.Successful?.map((entry) => entry.Id));
console.log('Failed:', response.Failed?.map((entry) => entry.Id));
```

## sqsDeleteMessageBatch

```typescript
import { sqsDeleteMessageBatch } from '@continuit/awsmini';
// Assuming you have received messages and have their receipt handles
// from sqsReceiveMessage, e.g., receivedMessages = result.messages

const client = obtainClient(); // See Setup AWS client

// Delete multiple messages after processing
const deleteEntries = receivedMessages.map((msg, index) => ({
  id: `del${index}`, // Unique ID for the delete request entry
  receiptHandle: msg.receiptHandle,
}));

if (deleteEntries.length > 0) {
  const response = await sqsDeleteMessageBatch(client, {
    queueUrl: 'YOUR_QUEUE_URL',
    entries: deleteEntries,
  });

  console.log('Successfully deleted:', response.successful?.map((entry) => entry.id));
  console.log('Failed deletions:', response.failed?.map((entry) => entry.id));
} else {
  console.log('No messages to delete.');
}
```

## sqsReceiveMessage

```typescript
import { sqsReceiveMessage } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// Receive messages from the queue
const result = await sqsReceiveMessage(client, {
  queueUrl: 'YOUR_QUEUE_URL',
  maxNumberOfMessages: 10,
  waitTimeSeconds: 20,
});

if (result.messages) {
  console.log('Received messages:', result.messages.length);
  result.messages.forEach((message) => {
    console.log('Message Body:', message.body);
    console.log('Receipt Handle:', message.receiptHandle);
    // Remember to delete the message after processing
  });
} else {
  console.log('No messages received.');
}
```

## sqsDeleteMessage

```typescript
import { sqsDeleteMessage } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// Delete a message after processing (use receipt handle from sqsReceiveMessage)
const response = await sqsDeleteMessage(client, {
  queueUrl: 'YOUR_QUEUE_URL',
  receiptHandle: 'MESSAGE_RECEIPT_HANDLE',
});

console.log('Message deleted successfully:', response.ok);
```

## sqsPurgeQueue

```typescript
import { sqsPurgeQueue } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// Purge all messages from a queue
const response = await sqsPurgeQueue(client, {
  queueUrl: 'YOUR_QUEUE_URL',
});

console.log('Queue purge initiated successfully:', response.ok);
```

## sqsGetQueueAttributes

```typescript
import { sqsGetQueueAttributes } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// Get attributes of a queue
const result = await sqsGetQueueAttributes(client, {
  queueUrl: 'YOUR_QUEUE_URL',
  attributeNames: ['All'], // Or specify ['ApproximateNumberOfMessages', 'CreatedTimestamp'] etc.
});

console.log('Queue Attributes:', result.attributes);
```

## sqsListQueues

```typescript
import { sqsListQueues } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// List queues (optionally with a prefix)
const result = await sqsListQueues(client, {
  // queueNamePrefix: 'my-prefix-',
});

console.log('Queue URLs:', result.queueUrls);
```

## sqsGetQueueUrl

```typescript
import { sqsGetQueueUrl } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// Get the URL for a queue by its name
const result = await sqsGetQueueUrl(client, {
  queueName: 'my-queue-name',
});

console.log('Queue URL:', result.queueUrl);
```

## sqsCreateQueue

```typescript
import { sqsCreateQueue } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// Create a new queue
const result = await sqsCreateQueue(client, {
  queueName: 'my-new-queue',
  attributes: { // Optional attributes
    VisibilityTimeout: '60', // seconds
    // DelaySeconds: '0',
    // MessageRetentionPeriod: '345600', // seconds (4 days)
  },
});

console.log('Queue created with URL:', result.queueUrl);
```

## sqsDeleteQueue

```typescript
import { sqsDeleteQueue } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

// Delete a queue
const response = await sqsDeleteQueue(client, {
  queueUrl: 'URL_OF_QUEUE_TO_DELETE',
});

console.log('Queue deleted successfully:', response.ok);
``` 