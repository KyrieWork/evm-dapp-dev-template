import { TransactionError } from '@/types';

// 安全的错误消息提取
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
};

// 提取交易错误中的详细信息
export const extractTransactionErrorDetails = (error: unknown): string => {
  try {
    let errorObj: TransactionError;

    if (typeof error === 'string') {
      try {
        errorObj = JSON.parse(error);
      } catch {
        errorObj = { details: error };
      }
    } else if (error && typeof error === 'object') {
      errorObj = error as TransactionError;
    } else {
      return 'No details available';
    }

    // 按优先级查找错误信息
    // 1. 优先返回 cause.details
    if (errorObj.cause?.details) {
      return errorObj.cause.details;
    }

    // 2. 其次返回顶层 details
    if (errorObj.details) {
      return errorObj.details;
    }

    // 3. 如果没有 details，查找 cause.shortMessage
    if (errorObj.cause?.shortMessage) {
      return errorObj.cause.shortMessage;
    }

    // 4. 最后查找顶层 shortMessage
    if (errorObj.shortMessage) {
      return errorObj.shortMessage;
    }

    // 5. 如果是标准 Error 对象，尝试获取 message
    if (errorObj instanceof Error && errorObj.message) {
      return errorObj.message;
    }

    // 6. 如果有 name 属性，返回 name
    if (errorObj.name) {
      return errorObj.name;
    }

    return 'No details available';
  } catch (e) {
    return 'Error parsing transaction error';
  }
};
