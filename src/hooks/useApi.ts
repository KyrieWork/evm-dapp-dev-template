'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  executeHttpRequest,
  toApiError,
  validateUrl,
  serializeRequestBody,
  safeCallback,
} from '@/utils';
import { ApiConfig } from '@/types';

// Hook状态
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: any | null;
}

// Hook返回值
export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: any | null;
  execute: () => Promise<T>;
  reset: () => void;
  cancel: () => void;
}

// 手动请求的Hook返回值
export interface UseApiMutationReturn<T, P = any> {
  data: T | null;
  loading: boolean;
  error: any | null;
  mutate: (params?: P) => Promise<T>;
  reset: () => void;
  cancel: () => void;
}

// 初始状态常量
const INITIAL_STATE = {
  data: null,
  loading: false,
  error: null,
} as const;

/**
 * 通用的Hook逻辑
 */
const useApiCommon = <T>() => {
  const [state, setState] = useState<UseApiState<T>>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const createSafeStateUpdater =
    (currentController: AbortController) => (updater: (prev: UseApiState<T>) => UseApiState<T>) => {
      if (isMountedRef.current && abortControllerRef.current === currentController) {
        setState(updater);
      }
    };

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState(INITIAL_STATE);
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    setState,
    abortControllerRef,
    isMountedRef,
    createSafeStateUpdater,
    reset,
    cancel,
  };
};

/**
 * 用于自动执行的API请求Hook
 */
export const useApi = <T = any>(url: string, config: ApiConfig = {}): UseApiReturn<T> => {
  const {
    state,
    setState,
    abortControllerRef,
    isMountedRef,
    createSafeStateUpdater,
    reset,
    cancel,
  } = useApiCommon<T>();
  const configRef = useRef(config);
  configRef.current = config;

  const execute = useCallback(async (): Promise<T> => {
    try {
      validateUrl(url);
    } catch (error) {
      const apiError = toApiError(error);
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, error: apiError, loading: false }));
      }
      throw apiError;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;
    const safeSetState = createSafeStateUpdater(controller);

    safeSetState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await executeHttpRequest<T>(url, configRef.current, controller.signal);

      if (controller.signal.aborted || !isMountedRef.current) {
        return response.data;
      }

      safeSetState(() => ({
        data: response.data,
        loading: false,
        error: null,
      }));

      safeCallback(() => configRef.current.onSuccess?.(response.data), 'onSuccess 回调执行出错:');
      return response.data;
    } catch (error) {
      if (controller.signal.aborted || !isMountedRef.current) {
        throw error;
      }

      const apiError = toApiError(error);
      safeSetState(prev => ({ ...prev, loading: false, error: apiError }));
      safeCallback(() => configRef.current.onError?.(apiError), 'onError 回调执行出错:');
      throw apiError;
    }
  }, [url, isMountedRef, abortControllerRef, createSafeStateUpdater]);

  return { ...state, execute, reset, cancel };
};

/**
 * 用于手动触发的API请求Hook
 */
export const useApiMutation = <T = any, P = any>(
  config: ApiConfig = {}
): UseApiMutationReturn<T, P> => {
  const {
    state,
    setState,
    abortControllerRef,
    isMountedRef,
    createSafeStateUpdater,
    reset,
    cancel,
  } = useApiCommon<T>();
  const configRef = useRef(config);
  configRef.current = config;

  const mutate = useCallback(
    async (params?: P): Promise<T> => {
      if (!params) {
        const error = toApiError(new Error('缺少请求参数'));
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, error, loading: false }));
        }
        throw error;
      }

      if (typeof params !== 'object' || params === null) {
        const error = toApiError(new Error('请求参数必须是对象类型'));
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, error, loading: false }));
        }
        throw error;
      }

      const { url, body, ...requestConfig } = params as any;

      try {
        validateUrl(url);
      } catch (error) {
        const apiError = toApiError(error);
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, error: apiError, loading: false }));
        }
        throw apiError;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const controller = abortControllerRef.current;
      const safeSetState = createSafeStateUpdater(controller);

      safeSetState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const serializedBody = serializeRequestBody(body);
        const response = await executeHttpRequest<T>(
          url,
          { ...configRef.current, ...requestConfig },
          controller.signal,
          serializedBody
        );

        if (controller.signal.aborted || !isMountedRef.current) {
          return response.data;
        }

        safeSetState(() => ({
          data: response.data,
          loading: false,
          error: null,
        }));

        safeCallback(() => configRef.current.onSuccess?.(response.data), 'onSuccess 回调执行出错:');
        return response.data;
      } catch (error) {
        if (controller.signal.aborted || !isMountedRef.current) {
          throw error;
        }

        const apiError = toApiError(error);
        safeSetState(prev => ({ ...prev, loading: false, error: apiError }));
        safeCallback(() => configRef.current.onError?.(apiError), 'onError 回调执行出错:');
        throw apiError;
      }
    },
    [isMountedRef, abortControllerRef, createSafeStateUpdater]
  );

  return { ...state, mutate, reset, cancel };
};
