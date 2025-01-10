export type ApiStatus = 'success' | 'error' | 'fail';

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiResponseMetadata {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: any;
}

export interface ApiResponseProps<T> {
  success: boolean;
  status: ApiStatus;
  message: string;
  data?: T;
  errors?: ApiErrorDetail[];
  metadata?: ApiResponseMetadata;
}