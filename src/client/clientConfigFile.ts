import type { ClientConfig } from './clientConfig.ts';
import { readFile } from 'node:fs/promises';
import * as process from 'node:process';

//  and
// - Shared cred file = ~/.aws/credentials or the path indicated by AWS_SHARED_CREDENTIALS_FILE
// - the shared credentials file contains config for the configured profile.
// or else
// contains a Region for the configured profile, that Region is used.

/**
 * Funcion that takes a ClientConfig object and returns a new ClientConfig object with config from the  file.
 *
 * @param config
 * @returns
 */
export const clientConfigFile = async (config: ClientConfig, configFile?: string): Promise<ClientConfig> => {
  // If the AWS_SDK_LOAD_CONFIG environment variable is set to any value
  if (!process.env.AWS_SDK_LOAD_CONFIG) return config;

  // Get shared credentials filename

  const configFilename = configFile ?? process.env.AWS_CONFIG_FILE ?? '~/.aws/credentials';
  const configFileContent = await readFile(configFilename, 'utf-8');
  console.log(configFileContent);
  return {
    ...config,
  };
};
