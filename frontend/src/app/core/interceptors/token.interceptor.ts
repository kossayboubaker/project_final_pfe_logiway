import { HttpInterceptorFn, HttpErrorResponse, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { HttpRequest } from '@angular/common/http';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<boolean>(false);

// Endpoints publics qui ne nécessitent pas de token
const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/rejection-reason',
  '/api/auth/verify-email'
];

export const tokenInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  // Ignore les endpoints publics
  if (isPublicEndpoint(req.url)) {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicEndpoint(req.url)) {
        return handleTokenRefresh(req, next, authService);
      } else {
        return throwError(() => error);
      }
    })
  );
};

function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

function handleTokenRefresh(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(false);

    return authService.refreshToken().pipe(
      switchMap((success: boolean) => {
        isRefreshing = false;
        if (!success) {
          refreshTokenSubject.next(false);
          return throwError(() => new Error('Session expired. Please login again.'));
        }

        refreshTokenSubject.next(true);
        return next(req);
      }),
      catchError((error) => {
        isRefreshing = false;
        return throwError(() => new Error('Token refresh failed. Please login again.'));
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(result => result),
      take(1),
      switchMap(() => next(req))
    );
  }
}
    


