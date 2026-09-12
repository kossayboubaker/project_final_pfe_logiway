import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { map } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const expectedRoles = (route.data?.['roles'] as string[]) || [];

    return authService.ensureSession().pipe(
        map(user => {
            if (!user) {
                return router.createUrlTree(['/auth/signin']);
            }

            if (expectedRoles.length === 0 || expectedRoles.includes(user.role)) {
                return true;
            }

            if (user.role === 'SUPERADMIN') return router.createUrlTree(['/dashboard/superadmin']);
            if (user.role === 'MANAGER') return router.createUrlTree(['/dashboard/manager']);
            return router.createUrlTree(['/dashboard/driver']);
        })
    );
};
