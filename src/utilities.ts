import type { AWSRequest } from './awsTypes.ts';

// Utility functions
export const toDashName = (name: string) => name.replace(/([A-Z])/g, '-$1').toLowerCase();

export type KeyNameArray<T> = (keyof T extends string ? keyof T : never)[];

export const addParameters = <T extends Record<string, unknown>>(
  req: T,
  awsRequest: AWSRequest,
  names: KeyNameArray<T>,
) => {
  for (const name of names) {
    if (req[name] !== undefined) {
      awsRequest.queryParameters[toDashName(name)] = `${req[name]}`;
    }
  }
};
