import { ApiError } from '@/types';

/**
 * 创建API错误对象
 */
export const createApiError = (message: string, response?: Response, data?: any): ApiError => ({
  message,
  status: response?.status,
  statusText: response?.statusText,
  data,
});

/**
 * 验证URL
 */
export const validateUrl = (url: string): void => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw createApiError('请求URL不能为空');
  }
};

/**
 * 安全的错误类型转换
 */
export const toApiError = (error: unknown): ApiError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return error as ApiError;
  }
  return createApiError('未知错误', undefined, error);
};

/**
 * 序列化请求体
 */
export const serializeRequestBody = (body: any): any => {
  if (body === undefined) return undefined;
  if (body instanceof FormData || body instanceof URLSearchParams || typeof body === 'string') {
    return body;
  }
  try {
    return JSON.stringify(body);
  } catch {
    throw createApiError('请求体序列化失败');
  }
};

/**
 * 解析响应数据
 */
export const parseResponseData = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type');

  try {
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return (await response.text()) as unknown as T;
    }
  } catch (parseError) {
    throw createApiError('响应数据解析失败', response);
  }
};

/**
 * 构建完整的请求URL
 */
export const buildFullUrl = (url: string, baseUrl = ''): string => {
  return url.startsWith('http') ? url : `${baseUrl}${url}`;
};

/**
 * 设置请求头的 Content-Type
 */
export const setDefaultContentType = (headers: Headers, body: any): void => {
  if (!headers.has('Content-Type') && body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
};
