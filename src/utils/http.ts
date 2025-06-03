import { ApiConfig, ApiResponse } from '@/types';
import { logWarn } from './log';
import { retry } from './index';
import {
  validateUrl,
  toApiError,
  buildFullUrl,
  setDefaultContentType,
  parseResponseData,
  createApiError,
} from './api';

/**
 * 创建 AbortSignal 组合器
 */
export const createCombinedSignal = (
  signal?: AbortSignal,
  timeoutController?: AbortController
): {
  effectiveSignal: AbortSignal;
  cleanup: (() => void) | null;
} => {
  if (!signal || !timeoutController) {
    return {
      effectiveSignal: timeoutController?.signal || new AbortController().signal,
      cleanup: null,
    };
  }

  const combinedController = new AbortController();
  const handleAbort = () => {
    if (!combinedController.signal.aborted) {
      combinedController.abort();
    }
  };

  signal.addEventListener('abort', handleAbort, { once: true });
  timeoutController.signal.addEventListener('abort', handleAbort, { once: true });

  const cleanup = () => {
    signal.removeEventListener('abort', handleAbort);
    timeoutController.signal.removeEventListener('abort', handleAbort);
  };

  return { effectiveSignal: combinedController.signal, cleanup };
};

/**
 * 处理HTTP响应错误
 */
const handleResponseError = async (response: Response) => {
  let errorData: any;
  try {
    const text = await response.text();
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = text;
    }
  } catch {
    errorData = null;
  }

  throw createApiError(`HTTP ${response.status}: ${response.statusText}`, response, errorData);
};

/**
 * 执行HTTP请求的核心函数
 */
export const executeHttpRequest = async <T>(
  url: string,
  config: ApiConfig,
  signal?: AbortSignal,
  body?: any
): Promise<ApiResponse<T>> => {
  const {
    baseUrl = '',
    timeout = 10000,
    retries = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    ...requestConfig
  } = config;

  validateUrl(url);

  const fullUrl = buildFullUrl(url, baseUrl);
  const headers = new Headers(requestConfig.headers);
  setDefaultContentType(headers, body);

  const timeoutController = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  const { effectiveSignal, cleanup } = createCombinedSignal(signal, timeoutController);

  try {
    timeoutId = setTimeout(() => {
      if (!timeoutController.signal.aborted) {
        timeoutController.abort();
      }
    }, timeout);

    const response = await retry(
      async () => {
        const res = await fetch(fullUrl, {
          ...requestConfig,
          headers,
          signal: effectiveSignal,
          body,
        });

        if (!res.ok) {
          await handleResponseError(res);
        }

        return res;
      },
      {
        maxAttempts: retries + 1,
        delayMs: retryDelay,
        onError: (error, attempt) => {
          logWarn(`API请求重试 ${attempt}/${retries + 1}:`, error.message);
        },
      }
    );

    const data = await parseResponseData<T>(response);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw createApiError('请求已取消');
      }
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        throw createApiError('网络连接失败，请检查网络状态');
      }
    }

    throw toApiError(error);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (cleanup) {
      cleanup();
    }
  }
};
