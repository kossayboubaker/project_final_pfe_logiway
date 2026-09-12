import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { companyGuard } from './core/guards/company.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'auth/signin',
        pathMatch: 'full'
    },
    {
        path: 'signin',
        redirectTo: 'auth/signin',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        children: [
            { path: 'signin', loadComponent: () => import('./features/auth/signin/signin.component').then(m => m.SignInComponent) },
            { path: '', redirectTo: 'signin', pathMatch: 'full' },
            { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
            { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
            { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
            { path: 'create-company', loadComponent: () => import('./features/auth/create-company/create-company.component').then(m => m.CreateCompanyComponent) }
        ]
    },
    {
        path: 'dashboard',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        canActivateChild: [companyGuard],
        children: [
            {
                path: '',
                redirectTo: 'superadmin',
                pathMatch: 'full'
            },
            {
                path: 'superadmin',
                canActivate: [roleGuard],
                data: { roles: ['SUPERADMIN'] },
                loadComponent: () => import('./features/dashboard/superadmin-dashboard/superadmin-dashboard.component').then(m => m.SuperAdminDashboardComponent)
            },
            {
                path: 'manager',
                canActivate: [roleGuard],
                data: { roles: ['MANAGER'] },
                loadComponent: () => import('./features/dashboard/manager-dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent)
            },
            {
                path: 'driver',
                canActivate: [roleGuard],
                data: { roles: ['DRIVER'] },
                loadComponent: () => import('./features/dashboard/driver-dashboard/driver-dashboard.component').then(m => m.DriverDashboardComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
            },
            {
                path: 'fleet',
                loadComponent: () => import('./features/fleet-management/fleet-management.component').then(m => m.FleetManagementComponent)
            },
            {
                path: 'trips',
                loadComponent: () => import('./features/trips/trips.component').then(m => m.TripsComponent)
            },
            {
                path: 'trajets-map',
                loadComponent: () => import('./features/trips-map/trips-map.component').then(m => m.TripsMapComponent)
            },
            {
                path: 'companies',
                canActivate: [roleGuard],
                data: { roles: ['SUPERADMIN'] },
                loadComponent: () => import('./features/company-management/company-management.component').then(m => m.CompanyManagementComponent)
            },
            {
                path: 'secteurs',
                loadComponent: () => import('./features/secteur-management/secteur-management.component').then(m => m.SecteurManagementComponent)
            },
            {
                path: 'affectations',
                loadComponent: () => import('./features/affectation-vehicule/affectation-vehicule.component').then(m => m.AffectationVehiculeComponent)
            },
            {
                path: 'messenger',
                loadComponent: () => import('./features/messenger/messenger.component').then(m => m.MessengerComponent)
            },
            {
                path: 'calendar',
                loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent)
            },
            {
                path: 'alerts',
                loadComponent: () => import('./features/alerts/alerts.component').then(m => m.AlertsComponent)
            },
            {
                path: 'reclamations',
                loadComponent: () => import('./features/reclamation/reclamation-list.component').then(m => m.ReclamationListComponent)
            },
            {
                path: 'leave',
                loadComponent: () => import('./features/leave-management/leave-management.component').then(m => m.LeaveManagementComponent)
            },
            {
                path: 'users',
                canActivate: [roleGuard],
                data: { roles: ['SUPERADMIN', 'MANAGER'] },
                loadComponent: () => import('./features/user-management/user-management.component').then(m => m.UserManagementComponent)
            },
            {
                path: 'company-profile',
                loadComponent: () => import('./features/company-profile/company-profile.component').then(m => m.CompanyProfileComponent)
            },
            {
                path: 'company-waiting',
                loadComponent: () => import('./features/company-waiting/company-waiting.component').then(m => m.CompanyWaitingComponent)
            },
            {
                path: 'map',

                loadComponent: () => import('./features/map/map.component').then(m => m.MapComponent)
            },
            {
                path: 'statistics',
                children: [
                    { path: 'users', loadComponent: () => import('./features/statistics/components/user-insight-chart/user-insight-chart.component').then(m => m.UserInsightChartComponent) },
                    { path: 'delivery', loadComponent: () => import('./features/statistics/components/delivery-chart/delivery-chart.component').then(m => m.DeliveryChartComponent) },
                    { path: 'fleet', loadComponent: () => import('./features/statistics/components/fleet-chart/fleet-chart.component').then(m => m.FleetChartComponent) },
                    { path: 'driver', loadComponent: () => import('./features/statistics/components/driver-chart/driver-chart.component').then(m => m.DriverChartComponent) },
                    { path: 'leave', loadComponent: () => import('./features/statistics/components/leave-chart/leave-chart.component').then(m => m.LeaveChartComponent) },
                    { path: 'history', loadComponent: () => import('./features/statistics/components/trip-history/trip-history.component').then(m => m.TripHistoryComponent) },
                    { path: 'notifications', loadComponent: () => import('./features/statistics/components/notification-chart/notification-chart.component').then(m => m.NotificationChartComponent) },
                    { 
                        path: 'rapports', 
                        canActivate: [roleGuard],
                        data: { roles: ['SUPERADMIN', 'MANAGER'] },
                        loadComponent: () => import('./features/analytics/generate-rapport/generate-rapport.component').then(m => m.GenerateRapportComponent) 
                    }
                ]
            },
            {
                path: 'analytics/pauses',
                canActivate: [roleGuard],
                data: { roles: ['SUPERADMIN', 'MANAGER'] },
                loadComponent: () => import('./features/pause-analytics/pause-analytics-dashboard.component').then(m => m.PauseAnalyticsDashboardComponent)
            },
            {
                path: 'rapports',
                loadComponent: () => import('./features/rapport-generator/rapport-generator.component').then(m => m.RapportGeneratorComponent)
            }
        ]
    }
    ,
    {
        path: 'profile',
        redirectTo: 'dashboard/profile',
        pathMatch: 'full'
    },
    {
        path: 'rapports',
        redirectTo: 'dashboard/rapports',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'auth/signin'
    }
];
