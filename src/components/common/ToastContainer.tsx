'use client';

import { Toast, ToastPosition } from './Toast';
import { ToastItem } from '@/hooks/useToast';

export interface ToastContainerProps {
  /** Toast 列表 */
  toasts: ToastItem[];
  /** 关闭 Toast 的回调 */
  onClose: (id: string) => void;
  /** 动画完成后移除 Toast 的回调 */
  onRemove?: (id: string) => void;
  /** 默认位置 */
  defaultPosition?: ToastPosition;
  /** 最大显示数量 */
  maxCount?: number;
}

/**
 * Toast 容器组件
 * 用于统一管理和显示多个 Toast
 */
export const ToastContainer = ({
  toasts,
  onClose,
  onRemove,
  defaultPosition = 'bottom-center',
  maxCount = 5,
}: ToastContainerProps) => {
  // 按位置分组 Toast
  const groupedToasts = toasts.reduce(
    (groups, toast) => {
      const position = toast.position || defaultPosition;
      if (!groups[position]) {
        groups[position] = [];
      }
      groups[position].push(toast);
      return groups;
    },
    {} as Record<ToastPosition, ToastItem[]>
  );

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div key={position} className="toast-group">
          {positionToasts
            .slice(-maxCount) // 限制显示数量
            .map(toast => (
              <Toast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => onClose(toast.id)}
                onAnimationComplete={() => onRemove?.(toast.id)}
                duration={toast.duration}
                position={position as ToastPosition}
                closable={toast.closable}
                maskClosable={toast.maskClosable}
                icon={toast.icon}
                className={toast.className}
              />
            ))}
        </div>
      ))}
    </>
  );
};
