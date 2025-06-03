export * from './error';
export * from './log';
export * from './text';
export * from './api';
export * from './callback';
export * from './http';

/**
 * 调用方法重试
 * @param fn 要重试的异步函数
 * @param options 重试选项
 * @param options.maxAttempts 最大重试次数，默认3次
 * @param options.delayMs 重试间隔时间(ms)，默认1000ms
 * @param options.backoff 是否使用指数退避，默认true
 * @param options.onError 错误处理回调
 * @returns 函数执行结果
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: boolean;
    onError?: (error: any, attempt: number) => void;
  } = {}
): Promise<T> => {
  const { maxAttempts = 3, delayMs = 1000, backoff = true, onError } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxAttempts) {
        throw error;
      }

      // 调用错误处理回调
      if (onError) {
        onError(error, attempt);
      }

      // 计算延迟时间
      const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

      // 等待后继续重试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 这里理论上不会执行到，因为要么成功返回，要么在最后一次失败时抛出异常
  throw lastError;
};
