import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auto-generated from root .env configuration. DO NOT EDIT DIRECTLY.
 * Update FRONTEND_BACKEND_API_URL in the root .env file instead.
 */
export const BACKEND_API_URL: string = '';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (BACKEND_API_URL && req.url.startsWith('/api')) {
    const baseUrl = BACKEND_API_URL.replace(/\/$/, '');
    const clone = req.clone({
      url: `${baseUrl}${req.url}`
    });
    return next(clone);
  }
  return next(req);
};
