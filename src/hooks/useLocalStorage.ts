import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logWarn, getErrorMessage } from '@/utils';

/**
 * 序列化选项接口
 */
interface SerializationOptions<T> {
  /**
   * 自定义序列化函数
   */
  serialize?: (value: T) => string;
  /**
   * 自定义反序列化函数
   */
  deserialize?: (value: string) => T;
}

/**
 * useLocalStorage hook 选项
 */
interface UseLocalStorageOptions<T> extends SerializationOptions<T> {
  /**
   * 是否启用跨标签页同步，默认为 true
   */
  syncAcrossTabs?: boolean;
  /**
   * 是否在 SSR 环境中静默失败，默认为 true
   */
  ssrSilent?: boolean;
}

/**
 * hook 返回值类型
 */
interface UseLocalStorageReturn<T> {
  /**
   * 当前存储的值
   */
  value: T;
  /**
   * 设置新值的函数
   */
  setValue: (value: T | ((prevValue: T) => T)) => void;
  /**
   * 移除当前键的函数
   */
  remove: () => void;
  /**
   * 清空整个 localStorage 的函数
   */
  clear: () => void;
  /**
   * 检查 localStorage 是否可用
   */
  isSupported: boolean;
  /**
   * 强制重新读取 localStorage 的值
   */
  refresh: () => void;
}

/**
 * 检查 localStorage 是否可用
 */
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * 默认序列化函数
 */
const defaultSerialize = <T>(value: T): string => JSON.stringify(value);

/**
 * 默认反序列化函数
 */
const defaultDeserialize = <T>(value: string): T => JSON.parse(value);

/**
 * 增强的 localStorage hook
 *
 * @param key localStorage 键名
 * @param initialValue 初始值
 * @param options 配置选项
 * @returns hook 返回值
 *
 * @example
 * ```tsx
 * const { value, setValue, remove } = useLocalStorage('user', null);
 *
 * // 使用自定义序列化
 * const { value: customValue } = useLocalStorage('data', [], {
 *   serialize: (data) => JSON.stringify(data),
 *   deserialize: (str) => JSON.parse(str),
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    syncAcrossTabs = true,
    ssrSilent = true,
  } = options;

  // 使用 ref 来避免在依赖数组中包含这些函数
  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);
  const initialValueRef = useRef(initialValue);

  // 更新 ref 以确保总是使用最新的函数
  serializeRef.current = serialize;
  deserializeRef.current = deserialize;
  initialValueRef.current = initialValue;

  // 检查 localStorage 是否可用
  const isSupported = useMemo(() => isLocalStorageAvailable(), []);

  /**
   * 读取 localStorage 中的值
   */
  const readValue = useCallback((): T => {
    if (!isSupported) {
      if (!ssrSilent) {
        logWarn(`[useLocalStorage] localStorage is not available`);
      }
      return initialValueRef.current;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return initialValueRef.current;
      }
      return deserializeRef.current(item);
    } catch (error) {
      logWarn(
        `[useLocalStorage] Error reading localStorage key "${key}": ${getErrorMessage(error)}`
      );
      return initialValueRef.current;
    }
  }, [key, isSupported, ssrSilent]);

  // 使用 lazy initial state 避免每次渲染都调用 readValue
  const [storedValue, setStoredValue] = useState<T>(readValue);

  /**
   * 设置新值到 localStorage 和 state
   */
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      if (!isSupported) {
        if (!ssrSilent) {
          logWarn(
            `[useLocalStorage] Tried setting localStorage key "${key}" in non-client environment`
          );
        }
        return;
      }

      try {
        // 计算新值
        const newValue = value instanceof Function ? value(storedValue) : value;

        // 序列化并保存到 localStorage
        const serializedValue = serializeRef.current(newValue);
        localStorage.setItem(key, serializedValue);

        // 更新 state
        setStoredValue(newValue);

        // 如果启用跨标签页同步，派发自定义事件
        if (syncAcrossTabs) {
          window.dispatchEvent(
            new CustomEvent('local-storage-change', {
              detail: { key, newValue, oldValue: storedValue },
            })
          );
        }
      } catch (error) {
        logWarn(
          `[useLocalStorage] Error setting localStorage key "${key}": ${getErrorMessage(error)}`
        );
      }
    },
    [key, storedValue, isSupported, ssrSilent, syncAcrossTabs]
  );

  /**
   * 移除 localStorage 中的键
   */
  const remove = useCallback(() => {
    if (!isSupported) {
      return;
    }

    try {
      localStorage.removeItem(key);
      setStoredValue(initialValueRef.current);

      if (syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key, newValue: null, oldValue: storedValue },
          })
        );
      }
    } catch (error) {
      logWarn(
        `[useLocalStorage] Error removing localStorage key "${key}": ${getErrorMessage(error)}`
      );
    }
  }, [key, isSupported, syncAcrossTabs, storedValue]);

  /**
   * 清空整个 localStorage
   */
  const clear = useCallback(() => {
    if (!isSupported) {
      return;
    }

    try {
      localStorage.clear();
      setStoredValue(initialValueRef.current);

      if (syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key: null, newValue: null, oldValue: null },
          })
        );
      }
    } catch (error) {
      logWarn(`[useLocalStorage] Error clearing localStorage: ${getErrorMessage(error)}`);
    }
  }, [isSupported, syncAcrossTabs]);

  /**
   * 强制重新读取 localStorage 的值
   */
  const refresh = useCallback(() => {
    const newValue = readValue();
    setStoredValue(newValue);
  }, [readValue]);

  // 监听 localStorage 变化（包括跨标签页）
  useEffect(() => {
    if (!isSupported || !syncAcrossTabs) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      // 只处理当前 key 的变化
      if (e.key === key || e.key === null) {
        const newValue = readValue();
        setStoredValue(newValue);
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      const { key: changedKey } = e.detail;
      // 如果是当前 key 或者是清空操作，重新读取值
      if (changedKey === key || changedKey === null) {
        const newValue = readValue();
        setStoredValue(newValue);
      }
    };

    // 监听原生 storage 事件（其他标签页的变化）
    window.addEventListener('storage', handleStorageChange);

    // 监听自定义事件（当前标签页的变化）
    window.addEventListener('local-storage-change', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'local-storage-change',
        handleCustomStorageChange as EventListener
      );
    };
  }, [key, readValue, isSupported, syncAcrossTabs]);

  return {
    value: storedValue,
    setValue,
    remove,
    clear,
    isSupported,
    refresh,
  };
}
