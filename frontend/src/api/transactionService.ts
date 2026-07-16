import axiosClient from './axiosClient';
import type { ApiResponse, PaginatedResponse, Transaction } from '../types';

export const deposit = async (accountNumber: string, amount: number): Promise<ApiResponse<Transaction>> => {
  const uuid = crypto.randomUUID();
  const response = await axiosClient.post<ApiResponse<Transaction>>(
    `/api/transactions/deposit?accountNumber=${accountNumber}&amount=${amount}`,
    {},
    {
      headers: {
        'X-Idempotency-Key': uuid,
      },
    }
  );
  return response.data;
};

export const withdraw = async (accountNumber: string, amount: number): Promise<ApiResponse<Transaction>> => {
  const uuid = crypto.randomUUID();
  const response = await axiosClient.post<ApiResponse<Transaction>>(
    `/api/transactions/withdraw?accountNumber=${accountNumber}&amount=${amount}`,
    {},
    {
      headers: {
        'X-Idempotency-Key': uuid,
      },
    }
  );
  return response.data;
};

export const transfer = async (fromAccount: string, toAccount: string, amount: number): Promise<ApiResponse<Transaction>> => {
  const uuid = crypto.randomUUID();
  const response = await axiosClient.post<ApiResponse<Transaction>>(
    '/api/transactions/transfer',
    { fromAccount, toAccount, amount },
    {
      headers: {
        'X-Idempotency-Key': uuid,
      },
    }
  );
  return response.data;
};

export interface HistoryParams {
  page?: number;
  size?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const getTransactionHistory = async (
  accountId: number,
  params: HistoryParams = {}
): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());
  if (params.type) queryParams.append('type', params.type);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.search) queryParams.append('search', params.search);

  const response = await axiosClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
    `/api/transactions/account/${accountId}?${queryParams.toString()}`
  );
  return response.data;
};
