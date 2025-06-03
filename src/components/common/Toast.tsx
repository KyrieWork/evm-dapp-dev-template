'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

// Toast 类型枚举
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast 位置枚举
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

// Toast 配置接口
export interface ToastConfig {
  /** 显示时长（毫秒），0 表示不自动关闭 */
  duration?: number;
  /** Toast 位置 */
  position?: ToastPosition;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 是否可通过点击遮罩关闭 */
  maskClosable?: boolean;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 自定义样式类名 */
  className?: string;
}

export interface ToastProps extends ToastConfig {
  /** 消息内容 */
  message: string;
  /** Toast 类型 */
  type: ToastType;
  /** 是否可见 */
  isVisible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 动画完成回调 */
  onAnimationComplete?: () => void;
}

// 默认配置
const DEFAULT_CONFIG: Required<Omit<ToastConfig, 'icon' | 'className'>> = {
  duration: 3000,
  position: 'bottom-center',
  closable: true,
  maskClosable: false,
};

// 类型样式映射
const TYPE_STYLES: Record<ToastType, { bg: string; text: string; border: string }> = {
  success: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-700' },
  error: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  warning: { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-600' },
  info: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
};

// 位置样式映射
const POSITION_STYLES: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

// 默认图标
const DEFAULT_ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export const Toast = (props: ToastProps) => {
  const {
    message,
    type,
    isVisible,
    onClose,
    onAnimationComplete,
    duration = DEFAULT_CONFIG.duration,
    position = DEFAULT_CONFIG.position,
    closable = DEFAULT_CONFIG.closable,
    maskClosable = DEFAULT_CONFIG.maskClosable,
    icon,
    className = '',
  } = props;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  // 动画状态管理
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 处理自动关闭
  const handleAutoClose = useCallback(() => {
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, duration);
    }
  }, [duration, onClose]);

  // 清理定时器
  const clearAutoClose = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    },
    [isVisible, onClose]
  );

  // 处理遮罩点击
  const handleMaskClick = useCallback(
    (event: React.MouseEvent) => {
      if (maskClosable && event.target === event.currentTarget) {
        onClose();
      }
    },
    [maskClosable, onClose]
  );

  // 处理动画结束
  const handleTransitionEnd = useCallback(() => {
    if (!isVisible && !isAnimating) {
      setShouldRender(false);
      onAnimationComplete?.();
    }
  }, [isVisible, isAnimating, onAnimationComplete]);

  // 管理渲染状态和动画
  useEffect(() => {
    if (isVisible) {
      // 显示时：先渲染到DOM，然后触发进入动画
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10); // 短暂延迟确保DOM已更新
      return () => clearTimeout(timer);
    } else {
      // 隐藏时：先播放退出动画，然后从DOM移除
      setIsAnimating(false);
    }
  }, [isVisible]);

  // 生命周期管理
  useEffect(() => {
    if (isVisible && isAnimating) {
      handleAutoClose();
      document.addEventListener('keydown', handleKeyDown);

      // 聚焦到 toast 以便键盘导航
      if (toastRef.current) {
        toastRef.current.focus();
      }
    } else {
      clearAutoClose();
    }

    return () => {
      clearAutoClose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, isAnimating, handleAutoClose, handleKeyDown, clearAutoClose]);

  // 鼠标悬停时暂停自动关闭
  const handleMouseEnter = useCallback(() => {
    clearAutoClose();
  }, [clearAutoClose]);

  const handleMouseLeave = useCallback(() => {
    if (isVisible && isAnimating) {
      handleAutoClose();
    }
  }, [isVisible, isAnimating, handleAutoClose]);

  // 不渲染时返回 null
  if (!shouldRender) return null;

  const styles = TYPE_STYLES[type];
  const positionClass = POSITION_STYLES[position];
  const displayIcon = icon !== undefined ? icon : DEFAULT_ICONS[type];

  // 动画类名 - 根据位置确定动画方向
  const getAnimationClass = () => {
    if (isAnimating) {
      return 'translate-y-0 opacity-100 scale-100';
    }

    // 退出动画方向根据位置决定
    if (position.includes('top')) {
      return '-translate-y-2 opacity-0 scale-95';
    } else {
      return 'translate-y-2 opacity-0 scale-95';
    }
  };

  return (
    <div
      className={`pointer-events-none fixed z-50 ${positionClass}`}
      onClick={handleMaskClick}
      role="presentation"
    >
      <div
        ref={toastRef}
        className={`pointer-events-auto w-full max-w-md ${styles.bg} ${styles.text} ${styles.border} transform rounded-lg border shadow-lg transition-all duration-300 ease-in-out ${getAnimationClass()} ${className} `}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        tabIndex={-1}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* 图标 */}
            {displayIcon && (
              <div className="mt-0.5 flex-shrink-0" aria-hidden="true">
                {displayIcon}
              </div>
            )}

            {/* 消息内容 */}
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-5 font-medium break-words whitespace-pre-wrap">
                {message}
              </p>
            </div>

            {/* 关闭按钮 */}
            {closable && (
              <button
                onClick={onClose}
                className="ml-2 flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/10 focus:ring-2 focus:ring-white/20 focus:outline-none"
                aria-label="关闭提示"
                type="button"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
