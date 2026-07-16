export const APP_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  DEFAULT_PAGE_SIZE: 10,
  TOKEN_REFRESH_INTERVAL: 900000, // 15 mins (matching backend JWT expiration)
};
