import axiosClient from './axiosClient';
import type { ApiResponse, User } from '../types';

export const getProfile = async (): Promise<ApiResponse<User>> => {
  const response = await axiosClient.get<ApiResponse<User>>('/api/users/profile');
  return response.data;
};

export const updateProfile = async (fullName: string): Promise<ApiResponse<User>> => {
  const response = await axiosClient.put<ApiResponse<User>>('/api/users/profile', { fullName });
  return response.data;
};

export const uploadProfilePicture = async (file: File): Promise<ApiResponse<User>> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosClient.post<ApiResponse<User>>('/api/users/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
