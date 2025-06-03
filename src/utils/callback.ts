import { logWarn } from './log';

/**
 * 安全调用回调函数
 */
export const safeCallback = (callback: (() => void) | undefined, errorMsg: string): void => {
  if (!callback) return;
  try {
    callback();
  } catch (callbackError) {
    logWarn(errorMsg, callbackError);
  }
};

/**
 * 创建防抖回调
 */
export const createDebouncedCallback = (
  callback: (...args: any[]) => void,
  delay: number
): ((...args: any[]) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
};

/**
 * 创建节流回调
 */
export const createThrottledCallback = (
  callback: (...args: any[]) => void,
  delay: number
): ((...args: any[]) => void) => {
  let lastCall = 0;

  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      callback(...args);
    }
  };
};
