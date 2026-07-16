export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  enabled: boolean;
  profilePictureUrl?: string;
}

export interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  status: string;
  userId: number;
  userFullName: string;
}

export interface Transaction {
  id: number;
  transactionType: string;
  amount: number;
  timestamp: string;
  description: string;
  sourceAccountNumber?: string;
  destinationAccountNumber?: string;
  accountNumber: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminStats {
  totalUsers: number;
  totalAccounts: number;
  totalTransactions: number;
  totalBalance: number;
  activeAccounts: number;
  blockedUsers: number;
  transactionsByType: Record<string, number>;
}
