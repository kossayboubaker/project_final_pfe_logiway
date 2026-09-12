import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../auth.service';
import { CompanyService } from '../services/company';

export const companyGuard: CanActivateChildFn = (childRoute: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const companyService = inject(CompanyService);

    return authService.ensureSession().pipe(
        switchMap(user => {
            if (!user) {
                return of(router.createUrlTree(['/auth/signin']));
            }

            if (user.role !== 'MANAGER') {
                return of(true);
            }

            return companyService.getMyCompany().pipe(
                map(company => {
                    const requestedPath = childRoute.routeConfig?.path || '';
                    const rawStatus = company?.status || authService.getCompanyStatus();
                    const status = normalizeCompanyStatus(rawStatus);

                    const allowedWhenLocked = new Set(['company-profile', 'company-waiting', 'profile']);

                    if (status === 'ACTIF') {
                        return true;
                    }

                    if (allowedWhenLocked.has(requestedPath)) {
                        return true;
                    }

                    return router.createUrlTree(['/dashboard/company-waiting']);
                })
            );
        })
    );
};

function normalizeCompanyStatus(value: unknown): 'ACTIF' | 'EN_ATTENTE' | 'INACTIF' | 'SUSPENDU' | 'NONE' {
    if (!value) {
        return 'NONE';
    }

    const normalized = String(value).trim().toUpperCase().replace(/\s+/g, '_');
    if (normalized === 'ACTIF') return 'ACTIF';
    if (normalized === 'EN_ATTENTE') return 'EN_ATTENTE';
    if (normalized === 'INACTIF') return 'INACTIF';
    if (normalized === 'SUSPENDU') return 'SUSPENDU';
    return 'NONE';
}
