# Lambda Examples

## lambdaListFunctionsAll

```typescript
import { lambdaListFunctionsAll } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

for await (const func of lambdaListFunctionsAll(client, {})) {
  console.log(func.FunctionName);
}
```

## lambdaInvoke

```typescript
import { lambdaInvoke } from '@continuit/awsmini';

const client = obtainClient(); // See Setup AWS client

const response = await lambdaInvoke(client, { 
  functionName: 'functionName', 
  payload: { id: '1234567890' } 
});
console.log(response.response, response.statusCode, ... );
``` 