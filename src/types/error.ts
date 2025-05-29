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
