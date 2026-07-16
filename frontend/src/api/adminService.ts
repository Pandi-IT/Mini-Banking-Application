import axiosClient from './axiosClient';
import type { Account, ApiResponse, AdminStats, PaginatedResponse, Transaction, User } from '../types';

export const getAdminUsers = async (page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<User>>> => {
  const response = await axiosClient.get<ApiResponse<PaginatedResponse<User>>>(`/api/admin/users?page=${page}&size=${size}`);
  return response.data;
};

export const getAdminAccounts = async (page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<Account>>> => {
  const response = await axiosClient.get<ApiResponse<PaginatedResponse<Account>>>(`/api/admin/accounts?page=${page}&size=${size}`);
  return response.data;
};

export const getAdminTransactions = async (page: number = 0, size: number = 10): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
  const response = await axiosClient.get<ApiResponse<PaginatedResponse<Transaction>>>(`/api/admin/transactions?page=${page}&size=${size}`);
  return response.data;
};

export const toggleUserBlock = async (userId: number, enabled: boolean): Promise<ApiResponse<User>> => {
  const response = await axiosClient.put<ApiResponse<User>>(`/api/admin/users/${userId}/status?enabled=${enabled}`);
  return response.data;
};

export const toggleAccountBlock = async (accountNumber: string, status: string): Promise<ApiResponse<Account>> => {
  const response = await axiosClient.put<ApiResponse<Account>>(`/api/admin/accounts/${accountNumber}/status?status=${status}`);
  return response.data;
};

export const getAdminStatistics = async (): Promise<ApiResponse<AdminStats>> => {
  const response = await axiosClient.get<ApiResponse<AdminStats>>('/api/admin/statistics');
  return response.data;
};
