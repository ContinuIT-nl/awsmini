import { AwsminiError } from '../misc/AwsminiError.ts';

export const lambdaName = (name: string, region: string = '', accountId: string = ''): string => {
  if (!name) throw new AwsminiError('Lambda name is required', 'lambda');
  // arn:aws:lambda:us-west-2:123456789012:function:my-function, max length 170 characters
  if (region && accountId) return `arn:aws:lambda:${region}:${accountId}:function:${name}`;
  // 123456789012:function:my-function
  if (accountId) return `${accountId}:function:${name}`;
  // my-function:v1, max length 64 characters
  return `${name}:v1`;
};
