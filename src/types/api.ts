import { ApiError } from './error';

// API响应类型
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

// 请求配置
export interface ApiConfig extends Omit<RequestInit, 'body'> {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}
