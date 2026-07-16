import axiosClient from './axiosClient';
import type { Account, ApiResponse } from '../types';

export const getUserAccounts = async (userId: number): Promise<Account[]> => {
  const response = await axiosClient.get<Account[]>(`/api/accounts/user/${userId}`);
  return response.data;
};

export const createAccount = async (userId: number, type: string): Promise<ApiResponse<Account>> => {
  const response = await axiosClient.post<ApiResponse<Account>>(`/api/accounts/${userId}?type=${type}`);
  return response.data;
};

export const getBalance = async (accountNumber: string): Promise<ApiResponse<number>> => {
  const response = await axiosClient.get<ApiResponse<number>>(`/api/accounts/${accountNumber}/balance`);
  return response.data;
};
