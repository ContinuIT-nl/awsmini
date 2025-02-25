import type { AWSRequest } from './awsTypes.ts';

// Utility functions
export const toDashName = (name: string) => name.replace(/([A-Z])/g, '-$1').toLowerCase();

export const addQueryParameters = <T extends Record<string, unknown>>(
  req: T,
  awsRequest: AWSRequest,
  names: readonly string[],
) => {
  for (const name of names) {
    if (req[name] !== undefined) {
      awsRequest.queryParameters[toDashName(name)] = `${req[name]}`;
    }
  }
};

export const encodeRfc3986 = (str: string) =>
  encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export const bufferToHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

export const hmacSha256 = async (key: BufferSource, data: BufferSource) => {
  const skey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return await crypto.subtle.sign('HMAC', skey, data);
};

export const hashSha256 = async (data: BufferSource) => bufferToHex(await crypto.subtle.digest('SHA-256', data));

export const emptyHashSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const xmlEscapeMap = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
} as const;

export const xmlEscape = (str: string) => str.replace(/[<>&'"]/g, (c) => xmlEscapeMap[c as keyof typeof xmlEscapeMap]);

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
