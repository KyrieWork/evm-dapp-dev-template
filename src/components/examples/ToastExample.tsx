'use client';

import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';

/**
 * Toast 使用示例组件
 */
export const ToastExample = () => {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('操作成功！', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleError = () => {
    toast.error('操作失败，请检查网络连接', {
      duration: 5000,
      position: 'top-center',
    });
  };

  const handleWarning = () => {
    toast.warning('请注意：这是一个警告信息', {
      duration: 4000,
      position: 'bottom-left',
    });
  };

  const handleInfo = () => {
    toast.info('这是一条提示信息', {
      duration: 3000,
      position: 'bottom-right',
    });
  };

  const handleCustom = () => {
    toast.show('自定义消息，永不消失', 'info', {
      duration: 0, // 永不自动关闭
      position: 'top-left',
      closable: true,
      maskClosable: true,
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    });
  };

  const handleLongMessage = () => {
    toast.error(
      `这是一个很长的错误消息，用来测试组件如何处理长文本内容。
它包含了换行符和很多文字，
应该能够正确地显示和换行。
同时测试 whitespace-pre-wrap 是否正常工作。`,
      {
        duration: 8000,
      }
    );
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-gray-800">Toast 组件示例</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <button
          onClick={handleSuccess}
          className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
        >
          成功提示
        </button>

        <button
          onClick={handleError}
          className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
        >
          错误提示
        </button>

        <button
          onClick={handleWarning}
          className="rounded-lg bg-yellow-500 px-4 py-2 text-white transition-colors hover:bg-yellow-600"
        >
          警告提示
        </button>

        <button
          onClick={handleInfo}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          信息提示
        </button>

        <button
          onClick={handleCustom}
          className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
        >
          自定义 Toast
        </button>

        <button
          onClick={handleLongMessage}
          className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
        >
          长消息测试
        </button>
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={() => toast.closeAll()}
          className="rounded-lg bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
        >
          关闭所有 Toast
        </button>

        <div className="text-sm text-gray-600">当前显示 {toast.toasts.length} 个 Toast</div>
      </div>

      {/* Toast 容器 */}
      <ToastContainer
        toasts={toast.toasts}
        onClose={toast.close}
        onRemove={toast.remove}
        maxCount={5}
      />
    </div>
  );
};
