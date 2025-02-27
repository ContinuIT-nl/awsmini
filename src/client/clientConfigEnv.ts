import type { ClientConfig } from './clientConfig.ts';
import * as process from 'node:process';

/**
 * Funcion that takes a ClientConfig object and returns a new ClientConfig object augmented with the environment variables set.
 *
 * @param config - The ClientConfig object to augment.
 * @returns A new ClientConfig object with the environment variables set.
 *
 * @property {string} region is set from `AWS_REGION`, `AWS_DEFAULT_REGION`, `AMAZON_REGION` respectively if not already set
 * @property {string} accessKeyId is set from `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_KEY` respectively if not already set
 * @property {string} secretAccessKey is set from `AWS_SECRET_ACCESS_KEY`, `AWS_SECRET_KEY` respectively if not already set
 * @property {string} sessionToken is set from `AWS_SESSION_TOKEN` if present and not already set
 * @property {string} endpoint is set from `AWS_ENDPOINT_URL` if present and not already set
 */
export const clientConfigEnv = (config: ClientConfig): ClientConfig => {
  return {
    region: config.region ?? process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? process.env.AMAZON_REGION,
    accessKeyId: config.accessKeyId ?? process.env.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY,
    secretAccessKey: config.secretAccessKey ?? process.env.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_KEY,
    sessionToken: config.sessionToken ?? process.env.AWS_SESSION_TOKEN,
    endpoint: config.endpoint ?? process.env.AWS_ENDPOINT_URL,
    fetch: config.fetch,
  };
};
