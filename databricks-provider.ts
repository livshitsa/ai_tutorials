/**
 * Databricks Provider for Vercel AI SDK
 * 
 * This module provides a reusable Databricks provider that wraps the OpenAI Compatible
 * provider with custom fetch logic to handle Databricks API endpoints.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export interface DatabricksProviderConfig {
  /**
   * Base URL for the Databricks serving endpoint.
   * Should include the full path to the serving endpoint.
   * Example: https://dbc-xxx.cloud.databricks.com/serving-endpoints/my-model
   */
  baseURL: string;

  /**
   * API key for authentication with Databricks.
   */
  apiKey: string;

  /**
   * Custom headers to include in the request.
   */
  headers?: Record<string, string>;

  /**
   * Provider name (optional, defaults to 'databricks').
   */
  name?: string;
}

/**
 * Create a custom fetch function that rewrites URLs for Databricks compatibility
 */
function createDatabricksFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    // Convert input to URL string for manipulation
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = input.url;
    }

    // Replace '/chat/completions' with '/invocations' for Databricks API
    if (url.includes('/chat/completions')) {
      url = url.replace('/chat/completions', '/invocations');
    }

    return fetch(url, init);
  };
}

/**
 * Create a Databricks provider instance that's compatible with the Vercel AI SDK.
 * 
 * @param config - Configuration object with baseURL, apiKey, and optional settings
 * @returns A provider instance that can be used with the AI SDK
 * 
 * @example
 * ```typescript
 * import { createDatabricksProvider } from './lib/databricks-provider';
 * 
 * const databricks = createDatabricksProvider({
 *   baseURL: process.env.BASE_URL!,
 *   apiKey: process.env.API_KEY!,
 * });
 * 
 * const result = await streamText({
 *   model: databricks('meta-llama/Meta-Llama-3.1-8B-Instruct'),
 *   prompt: 'Hello, world!',
 * });
 * ```
 */
export function createDatabricksProvider(config: DatabricksProviderConfig) {
  // Clean the base URL to remove any trailing '/invocations' to avoid duplication
  const cleanBaseURL = config.baseURL.replace(/\/invocations\/?$/, '');
  
  // Create the Databricks-compatible provider
  return createOpenAICompatible({
    name: config.name || 'databricks',
    baseURL: cleanBaseURL,
    apiKey: config.apiKey,
    headers: config.headers,
    fetch: createDatabricksFetch(),
  });
}

/**
 * Create a Databricks provider using environment variables.
 * Requires API_KEY and BASE_URL environment variables to be set.
 * 
 * @param name - Optional provider name (defaults to 'databricks')
 * @returns A provider instance configured from environment variables
 * 
 * @example
 * ```typescript
 * import { createDatabricksProviderFromEnv } from './lib/databricks-provider';
 * 
 * const databricks = createDatabricksProviderFromEnv();
 * ```
 */
export function createDatabricksProviderFromEnv(name?: string) {
  const API_KEY = process.env.API_KEY;
  const BASE_URL = process.env.BASE_URL;

  if (!API_KEY) {
    throw new Error('API_KEY environment variable is required');
  }

  if (!BASE_URL) {
    throw new Error('BASE_URL environment variable is required');
  }

  return createDatabricksProvider({
    baseURL: BASE_URL,
    apiKey: API_KEY,
    name,
  });
}
