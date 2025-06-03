'use client';

import { useState, useCallback, useRef } from 'react';
import { ToastType, ToastConfig } from '@/components/common/Toast';

export interface ToastItem extends ToastConfig {
  id: string;
  message: string;
  type: ToastType;
  isVisible: boolean;
}

export interface UseToastReturn {
  /** 当前显示的 toast 列表 */
  toasts: ToastItem[];
  /** 显示成功提示 */
  success: (message: string, config?: ToastConfig) => string;
  /** 显示错误提示 */
  error: (message: string, config?: ToastConfig) => string;
  /** 显示警告提示 */
  warning: (message: string, config?: ToastConfig) => string;
  /** 显示信息提示 */
  info: (message: string, config?: ToastConfig) => string;
  /** 显示自定义 toast */
  show: (message: string, type: ToastType, config?: ToastConfig) => string;
  /** 关闭指定的 toast */
  close: (id: string) => void;
  /** 关闭所有 toast */
  closeAll: () => void;
  /** 动画完成后移除 toast */
  remove: (id: string) => void;
}

// 生成唯一 ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Toast 管理 Hook
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * const handleSuccess = () => {
 *   toast.success('操作成功！');
 * };
 *
 * const handleError = () => {
 *   toast.error('操作失败，请重试', { duration: 5000 });
 * };
 * ```
 */
export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 清理定时器
  const clearToastTimeout = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  // 从状态中移除 toast（动画完成后调用）
  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 关闭 toast（开始退出动画）
  const close = useCallback(
    (id: string) => {
      clearToastTimeout(id);
      setToasts(prev =>
        prev.map(toast => (toast.id === id ? { ...toast, isVisible: false } : toast))
      );
    },
    [clearToastTimeout]
  );

  // 关闭所有 toast
  const closeAll = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setToasts(prev => prev.map(toast => ({ ...toast, isVisible: false })));

    // 延迟清空所有toast，给动画时间
    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  // 显示 toast
  const show = useCallback(
    (message: string, type: ToastType, config: ToastConfig = {}): string => {
      const id = generateId();
      const { duration = 3000, ...restConfig } = config;

      const newToast: ToastItem = {
        id,
        message,
        type,
        isVisible: true,
        duration,
        ...restConfig,
      };

      setToasts(prev => [...prev, newToast]);

      // 设置自动关闭
      if (duration > 0) {
        const timeout = setTimeout(() => {
          close(id);
        }, duration);
        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [close]
  );

  // 便捷方法
  const success = useCallback(
    (message: string, config?: ToastConfig) => {
      return show(message, 'success', config);
    },
    [show]
  );

  const error = useCallback(
    (message: string, config?: ToastConfig) => {
      return show(message, 'error', config);
    },
    [show]
  );

  const warning = useCallback(
    (message: string, config?: ToastConfig) => {
      return show(message, 'warning', config);
    },
    [show]
  );

  const info = useCallback(
    (message: string, config?: ToastConfig) => {
      return show(message, 'info', config);
    },
    [show]
  );

  return {
    toasts,
    success,
    error,
    warning,
    info,
    show,
    close,
    closeAll,
    remove,
  };
};
