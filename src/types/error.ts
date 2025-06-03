export interface TransactionError {
  cause?: {
    details?: string;
    shortMessage?: string;
    code?: number;
  };
  details?: string;
  shortMessage?: string;
  name?: string;
  code?: number;
}

// API错误类型
export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
}
