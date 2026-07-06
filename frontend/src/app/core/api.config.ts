import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Centralized Backend API URL Configuration
 * - Local Development: Leave empty '' to use relative paths (e.g. proxied via proxy.conf.json)
 * - Standalone Production (Vercel, Netlify, etc.): Paste your backend live URL here (e.g. 'https://bankease-backend.onrender.com')
 */
export const BACKEND_API_URL: string = '';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // If a backend URL is configured and the request is destined for the /api route
  if (BACKEND_API_URL && req.url.startsWith('/api')) {
    // Trim trailing slash from base URL and prepend it to the request path
    const baseUrl = BACKEND_API_URL.replace(/\/$/, '');
    const clone = req.clone({
      url: `${baseUrl}${req.url}`
    });
    return next(clone);
  }
  return next(req);
};
