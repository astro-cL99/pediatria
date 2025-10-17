/// <reference no-default-lib="true" />
/// <reference lib="deno.window" />

// Global type definitions for Deno
declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  };

  export function readTextFileSync(path: string | URL): string;
  export function writeTextFileSync(path: string | URL, data: string): void;
  
  // Add other Deno globals as needed
}

// Add type definitions for the Response object
declare class Response {
  constructor(body?: BodyInit | null, init?: ResponseInit);
  static json(data: any, init?: ResponseInit): Response;
  static error(): Response;
  static redirect(url: string | URL, status?: number): Response;
  
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
  readonly body: ReadableStream<Uint8Array> | null;
  readonly bodyUsed: boolean;
  
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<any>;
  text(): Promise<string>;
  clone(): Response;
}
