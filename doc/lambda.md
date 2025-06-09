# Lambda Examples

AWS Lambda is a serverless compute service that lets you run code without provisioning or managing servers. It automatically scales your applications in response to incoming traffic and you only pay for the compute time you use.

This library provides two main functions for working with AWS Lambda:

For more information about AWS Lambda, see the [official AWS documentation](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html).

## lambdaListFunctionsAll

Lists all Lambda functions in your AWS account with automatic pagination. This function returns an async iterator that yields each function one at a time, making it memory efficient when dealing with large numbers of functions.

```typescript
import { lambdaListFunctionsAll } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

for await (const func of lambdaListFunctionsAll(client, {})) {
  console.log(func.FunctionName);
}
```

## lambdaInvoke

Invokes a Lambda function with the specified payload. This function allows you to execute Lambda functions and receive their response. The function supports both synchronous and asynchronous invocation modes.

Parameters:

- `client`: The AWS client instance
- `options`: An object containing:
  - `functionName`: The name of the Lambda function to invoke
  - `payload`: The data to pass to the Lambda function (will be automatically JSON stringified)
  - `invocationType` (optional): The invocation type ('RequestResponse' for synchronous, 'Event' for asynchronous)
  - `qualifier` (optional): The version or alias of the function to invoke

Returns a promise that resolves to an object containing:

- `response`: The response from the Lambda function (parsed from JSON)
- `statusCode`: The HTTP status code of the invocation
- `executedVersion`: The version of the function that was executed
- `functionError`: Any error message if the function failed
- `logResult`: The last 4KB of the execution log (base64 encoded)

Example:

```typescript
import { lambdaInvoke } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

const response = await lambdaInvoke(client, { 
  functionName: 'functionName', 
  payload: { id: '1234567890' } 
});
console.log(response.response, response.statusCode, ... );
```
