'use client';

import { useState, useEffect } from 'react';
import { useApi, useApiMutation } from '@/hooks/useApi';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';

// 模拟数据类型
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

/**
 * API Hook 使用示例组件
 * 展示 useApi 和 useApiMutation 的各种功能
 */
export const ApiExample = () => {
  const toast = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number>(1);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [newPost, setNewPost] = useState({ title: '', body: '' });
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 1. useApi - 组件挂载时自动加载用户列表
  const usersApi = useApi<User[]>('https://jsonplaceholder.typicode.com/users', {
    method: 'GET',
    timeout: 5000,
    retries: 2,
    onSuccess: data => {
      console.log('用户列表自动加载成功:', data);
      toast.success(`自动加载了 ${data.length} 个用户`);
    },
    onError: error => {
      toast.error(`用户列表自动加载失败: ${error.message}`);
    },
  });

  // 2. useApi - 根据选择的用户ID自动获取帖子（依赖变化时自动重新请求）
  const postsApi = useApi<Post[]>(
    `https://jsonplaceholder.typicode.com/posts?userId=${selectedUserId}`,
    {
      method: 'GET',
      timeout: 5000,
      onSuccess: data => {
        toast.success(`自动加载用户 ${selectedUserId} 的 ${data.length} 篇帖子`);
      },
      onError: error => {
        toast.error(`帖子自动加载失败: ${error.message}`);
      },
    }
  );

  // 3. useApi - 根据选择的帖子ID自动获取评论
  const commentsApi = useApi<Comment[]>(
    selectedPostId ? `https://jsonplaceholder.typicode.com/comments?postId=${selectedPostId}` : '',
    {
      method: 'GET',
      timeout: 5000,
      onSuccess: data => {
        if (selectedPostId) {
          toast.info(`自动加载帖子 ${selectedPostId} 的 ${data.length} 条评论`);
        }
      },
      onError: error => {
        toast.error(`评论自动加载失败: ${error.message}`);
      },
    }
  );

  // 4. useApiMutation - 创建新帖子
  const createPostApi = useApiMutation<
    Post,
    {
      url: string;
      body: { title: string; body: string; userId: number };
    }
  >({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
    onSuccess: data => {
      toast.success(`帖子创建成功！ID: ${data.id}`);
      setNewPost({ title: '', body: '' });
      // 自动刷新帖子列表
      postsApi.execute();
    },
    onError: error => {
      toast.error(`帖子创建失败: ${error.message}`);
    },
  });

  // 5. useApiMutation - 删除帖子
  const deletePostApi = useApiMutation<{}, { url: string }>({
    method: 'DELETE',
    timeout: 5000,
    onSuccess: () => {
      toast.success('帖子删除成功！');
      // 自动重新加载帖子列表
      postsApi.execute();
      // 如果删除的是当前查看的帖子，清除评论
      if (selectedPostId) {
        setSelectedPostId(null);
      }
    },
    onError: error => {
      toast.error(`帖子删除失败: ${error.message}`);
    },
  });

  // 6. useApiMutation - 更新用户信息
  const updateUserApi = useApiMutation<
    User,
    {
      url: string;
      body: Partial<User>;
    }
  >({
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    onSuccess: data => {
      toast.success(`用户信息更新成功！用户: ${data.name}`);
      // 自动刷新用户列表
      usersApi.execute();
    },
    onError: error => {
      toast.error(`用户信息更新失败: ${error.message}`);
    },
  });

  // 组件挂载时自动执行用户列表请求
  useEffect(() => {
    console.log('组件挂载，自动加载用户列表...');
    usersApi.execute();
  }, []);

  // 用户ID变化时自动执行帖子请求
  useEffect(() => {
    console.log(`用户ID变化为 ${selectedUserId}，自动加载帖子...`);
    postsApi.execute();
    // 清除之前选择的帖子
    setSelectedPostId(null);
  }, [selectedUserId]);

  // 帖子ID变化时自动执行评论请求
  useEffect(() => {
    if (selectedPostId) {
      console.log(`帖子ID变化为 ${selectedPostId}，自动加载评论...`);
      commentsApi.execute();
    }
  }, [selectedPostId]);

  // 自动刷新功能
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('自动刷新数据...');
        usersApi.execute();
        postsApi.execute();
        if (selectedPostId) {
          commentsApi.execute();
        }
        toast.info('自动刷新数据完成');
      }, 10000); // 每10秒自动刷新
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, selectedPostId]);

  // 处理函数
  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.body.trim()) {
      toast.warning('请填写完整的帖子标题和内容');
      return;
    }

    try {
      await createPostApi.mutate({
        url: 'https://jsonplaceholder.typicode.com/posts',
        body: {
          title: newPost.title,
          body: newPost.body,
          userId: selectedUserId,
        },
      });
    } catch (error) {
      console.error('创建帖子失败:', error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await deletePostApi.mutate({
        url: `https://jsonplaceholder.typicode.com/posts/${postId}`,
      });
    } catch (error) {
      console.error('删除帖子失败:', error);
    }
  };

  const handleUpdateUser = async (userId: number) => {
    try {
      await updateUserApi.mutate({
        url: `https://jsonplaceholder.typicode.com/users/${userId}`,
        body: {
          name: `更新的用户名 ${Date.now()}`,
          email: 'updated@example.com',
          phone: '123-456-7890',
        },
      });
    } catch (error) {
      console.error('更新用户失败:', error);
    }
  };

  const handleCancelRequest = (apiName: string, cancelFn: () => void) => {
    cancelFn();
    toast.info(`已取消 ${apiName} 请求`);
  };

  const handleResetApi = (apiName: string, resetFn: () => void) => {
    resetFn();
    toast.info(`已重置 ${apiName} 状态`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">useApi Hook 示例</h1>
        <p className="text-gray-600">演示 useApi 的自动执行和 useApiMutation 的手动触发功能</p>
      </div>

      {/* 自动刷新控制 */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-yellow-800">自动刷新功能</h3>
            <p className="text-sm text-yellow-700">开启后每10秒自动刷新所有数据</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-yellow-600 peer-focus:ring-4 peer-focus:ring-yellow-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
          </label>
        </div>
      </div>

      {/* 1. 用户列表 - 自动加载示例 */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">用户列表 (自动加载)</h2>
            <p className="text-sm text-gray-600">组件挂载时自动执行请求</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => usersApi.execute()}
              disabled={usersApi.loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {usersApi.loading ? '加载中...' : '手动刷新'}
            </button>
            <button
              onClick={() => handleCancelRequest('用户列表', usersApi.cancel)}
              disabled={!usersApi.loading}
              className="rounded-lg bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              取消请求
            </button>
            <button
              onClick={() => handleResetApi('用户列表', usersApi.reset)}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            >
              重置状态
            </button>
          </div>
        </div>

        {usersApi.loading && (
          <div className="py-4 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">正在自动加载用户列表...</p>
          </div>
        )}

        {usersApi.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-medium text-red-800">自动加载失败</h3>
            <p className="mt-1 text-sm text-red-600">{usersApi.error.message}</p>
          </div>
        )}

        {usersApi.data && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {usersApi.data.map(user => (
              <div
                key={user.id}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  selectedUserId === user.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedUserId(user.id)}
              >
                <h3 className="font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500">ID: {user.id}</p>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleUpdateUser(user.id);
                  }}
                  disabled={updateUserApi.loading}
                  className="mt-2 rounded bg-green-600 px-3 py-1 text-xs text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {updateUserApi.loading ? '更新中...' : '更新信息'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 帖子列表 - 依赖变化自动加载 */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              用户 {selectedUserId} 的帖子 (依赖变化自动加载)
            </h2>
            <p className="text-sm text-gray-600">选择不同用户时自动重新请求</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => postsApi.execute()}
              disabled={postsApi.loading}
              className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {postsApi.loading ? '加载中...' : '手动刷新'}
            </button>
            <button
              onClick={() => handleCancelRequest('帖子列表', postsApi.cancel)}
              disabled={!postsApi.loading}
              className="rounded-lg bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              取消请求
            </button>
          </div>
        </div>

        {postsApi.loading && (
          <div className="py-4 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
            <p className="mt-2 text-gray-600">正在自动加载帖子列表...</p>
          </div>
        )}

        {postsApi.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-medium text-red-800">自动加载失败</h3>
            <p className="mt-1 text-sm text-red-600">{postsApi.error.message}</p>
          </div>
        )}

        {postsApi.data && (
          <div className="space-y-4">
            {postsApi.data.length === 0 ? (
              <p className="py-4 text-center text-gray-500">该用户暂无帖子</p>
            ) : (
              postsApi.data.map(post => (
                <div
                  key={post.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    selectedPostId === post.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPostId(post.id)}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">{post.title}</h3>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                      disabled={deletePostApi.loading}
                      className="rounded bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletePostApi.loading ? '删除中...' : '删除'}
                    </button>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">{post.body}</p>
                  <p className="text-xs text-gray-500">
                    帖子ID: {post.id} {selectedPostId === post.id && '(点击查看评论)'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. 评论列表 - 条件自动加载 */}
      {selectedPostId && (
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                帖子 {selectedPostId} 的评论 (条件自动加载)
              </h2>
              <p className="text-sm text-gray-600">选择帖子时自动加载评论</p>
            </div>
            <button
              onClick={() => setSelectedPostId(null)}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            >
              关闭评论
            </button>
          </div>

          {commentsApi.loading && (
            <div className="py-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">正在自动加载评论...</p>
            </div>
          )}

          {commentsApi.error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="font-medium text-red-800">评论加载失败</h3>
              <p className="mt-1 text-sm text-red-600">{commentsApi.error.message}</p>
            </div>
          )}

          {commentsApi.data && (
            <div className="space-y-3">
              {commentsApi.data.length === 0 ? (
                <p className="py-4 text-center text-gray-500">该帖子暂无评论</p>
              ) : (
                commentsApi.data.map(comment => (
                  <div key={comment.id} className="rounded-lg bg-gray-50 p-3">
                    <div className="mb-1 flex items-start justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{comment.name}</h4>
                      <span className="text-xs text-gray-500">ID: {comment.id}</span>
                    </div>
                    <p className="mb-2 text-xs text-gray-600">{comment.email}</p>
                    <p className="text-sm text-gray-700">{comment.body}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. 创建新帖子 - useApiMutation 示例 */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          创建新帖子 (useApiMutation - 手动触发)
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">帖子标题</label>
            <input
              type="text"
              value={newPost.title}
              onChange={e => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="输入帖子标题"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">帖子内容</label>
            <textarea
              value={newPost.body}
              onChange={e => setNewPost(prev => ({ ...prev, body: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="输入帖子内容"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleCreatePost}
              disabled={createPostApi.loading}
              className="rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createPostApi.loading ? '创建中...' : '创建帖子'}
            </button>

            <button
              onClick={() => handleCancelRequest('创建帖子', createPostApi.cancel)}
              disabled={!createPostApi.loading}
              className="rounded-lg bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              取消创建
            </button>

            <button
              onClick={() => handleResetApi('创建帖子', createPostApi.reset)}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            >
              重置表单
            </button>
          </div>

          {createPostApi.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="font-medium text-red-800">创建失败</h3>
              <p className="mt-1 text-sm text-red-600">{createPostApi.error.message}</p>
            </div>
          )}

          {createPostApi.data && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="font-medium text-green-800">创建成功！</h3>
              <p className="mt-1 text-sm text-green-600">
                新帖子ID: {createPostApi.data.id}，标题: {createPostApi.data.title}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* API 状态总览 */}
      <div className="rounded-lg bg-gray-50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">API 状态总览</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="font-medium text-gray-700">用户列表</h3>
            <p className="text-sm text-gray-600">
              状态:{' '}
              {usersApi.loading
                ? '加载中'
                : usersApi.error
                  ? '错误'
                  : usersApi.data
                    ? '成功'
                    : '未开始'}
            </p>
            <p className="text-sm text-gray-600">数据: {usersApi.data?.length || 0} 个用户</p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="font-medium text-gray-700">帖子列表</h3>
            <p className="text-sm text-gray-600">
              状态:{' '}
              {postsApi.loading
                ? '加载中'
                : postsApi.error
                  ? '错误'
                  : postsApi.data
                    ? '成功'
                    : '未开始'}
            </p>
            <p className="text-sm text-gray-600">数据: {postsApi.data?.length || 0} 篇帖子</p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="font-medium text-gray-700">评论列表</h3>
            <p className="text-sm text-gray-600">
              状态:{' '}
              {commentsApi.loading
                ? '加载中'
                : commentsApi.error
                  ? '错误'
                  : commentsApi.data
                    ? '成功'
                    : '未开始'}
            </p>
            <p className="text-sm text-gray-600">数据: {commentsApi.data?.length || 0} 条评论</p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="font-medium text-gray-700">创建帖子</h3>
            <p className="text-sm text-gray-600">
              状态:{' '}
              {createPostApi.loading
                ? '创建中'
                : createPostApi.error
                  ? '错误'
                  : createPostApi.data
                    ? '成功'
                    : '待操作'}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="font-medium text-gray-700">自动刷新</h3>
            <p className="text-sm text-gray-600">状态: {autoRefresh ? '开启' : '关闭'}</p>
            <p className="text-sm text-gray-600">间隔: 10秒</p>
          </div>
        </div>
      </div>

      {/* Toast 容器 */}
      <ToastContainer
        toasts={toast.toasts}
        onClose={toast.close}
        onRemove={toast.remove}
        maxCount={3}
      />
    </div>
  );
};
