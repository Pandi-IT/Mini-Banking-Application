import axiosClient from './axiosClient';
import type { ApiResponse, AuthResponse } from '../types';

export const registerUser = async (fullName: string, email: string, password: string): Promise<ApiResponse<any>> => {
  const response = await axiosClient.post<ApiResponse<any>>('/api/auth/register', { fullName, email, password });
  return response.data;
};

export const loginUser = async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await axiosClient.post<ApiResponse<AuthResponse>>('/api/auth/login', { email, password });
  return response.data;
};

export const forgotPassword = async (email: string): Promise<ApiResponse<string>> => {
  const response = await axiosClient.post<ApiResponse<string>>('/api/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<ApiResponse<any>> => {
  const response = await axiosClient.post<ApiResponse<any>>('/api/auth/reset-password', { token, newPassword });
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<ApiResponse<any>> => {
  const response = await axiosClient.post<ApiResponse<any>>('/api/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

export const logoutUser = async (): Promise<ApiResponse<any>> => {
  const response = await axiosClient.post<ApiResponse<any>>('/api/auth/logout');
  return response.data;
};
