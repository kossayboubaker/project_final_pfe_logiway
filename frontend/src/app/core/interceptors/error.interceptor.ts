import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const isAuthRoute = req.url.includes('/api/auth/login')
        || req.url.includes('/api/auth/logout')
        || req.url.includes('/api/auth/refresh')
        || req.url.includes('/api/auth/me')
        || req.url.includes('/api/auth/forgot-password')
        || req.url.includes('/api/auth/reset-password')
        || req.url.includes('/api/auth/rejection-reason');

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !isAuthRoute) {
                // Avoid hard logout on transient 401; token interceptor handles refresh/retry.
                if (authService.getUser()) {
                    router.navigate(['/auth/signin']);
                }
            }

            if (error.status === 403 && !isAuthRoute) {
                const user = authService.getUser();
                if (user?.role === 'SUPERADMIN') router.navigate(['/dashboard/superadmin']);
                else if (user?.role === 'MANAGER') router.navigate(['/dashboard/manager']);
                else router.navigate(['/dashboard/driver']);
            }

            return throwError(() => error);
        })
    );
};
