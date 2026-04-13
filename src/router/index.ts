import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

type UserRole = 'ADMIN' | 'BUSINESS_OWNER' | 'EMPLOYEE'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresAuth?: boolean
    /** Bu route'a erişebilecek roller. Tanımsızsa tüm auth'lu kullanıcılar erişebilir. */
    roles?: UserRole[]
  }
}

// Environment variables
const LANDING_URL = import.meta.env.VITE_LANDING_URL || 'https://randevum.pro'
const APP_URL = import.meta.env.VITE_APP_BASE_URL || 'https://app.randevum.pro'
const IS_DEV = import.meta.env.DEV

// Helper function: subdomain'e yönlendir
function redirectToSubdomain(path: string, subdomain: 'landing' | 'app') {
  if (IS_DEV) return // Development'ta redirect yok
  
  const targetUrl = subdomain === 'landing' ? LANDING_URL : APP_URL
  window.location.href = `${targetUrl}${path}`
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Landing', component: () => import('@/views/LandingView.vue'), meta: { public: true } },
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },
  { path: '/register-employee', name: 'RegisterEmployee', component: () => import('@/views/RegisterEmployeeView.vue'), meta: { public: true } },
  {
    path: '/auth/pending-verification',
    name: 'EmailVerificationPending',
    component: () => import('@/views/EmailVerificationPendingView.vue'),
    meta: { public: true },
  },
  {
    path: '/auth/verify-email',
    name: 'EmailVerify',
    component: () => import('@/views/EmailVerifiedView.vue'),
    meta: { public: true },
  },
  {
    path: '/auth/verified',
    name: 'EmailVerifiedStatic',
    component: () => import('@/views/EmailVerifiedView.vue'),
    meta: { public: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { public: true },
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/legal/PrivacyView.vue'),
    meta: { public: true },
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('@/views/legal/TermsView.vue'),
    meta: { public: true },
  },
  {
    path: '/kvkk',
    name: 'Kvkk',
    component: () => import('@/views/legal/KvkkView.vue'),
    meta: { public: true },
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
      },
      { path: 'calendar', redirect: '/admin/appointments' },
      {
        path: 'settings',
        component: () => import('@/views/admin/SettingsLayout.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
        children: [
          {
            path: '',
            name: 'AdminSettings',
            component: () => import('@/views/admin/BusinessView.vue'),
            meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
          },
          {
            path: 'notifications',
            name: 'AdminNotifications',
            component: () => import('@/views/admin/settings/NotificationsView.vue'),
            meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
          },
          {
            path: 'message-templates',
            name: 'AdminMessageTemplates',
            component: () => import('@/views/admin/settings/MessageTemplatesView.vue'),
            meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
          },
          {
            path: 'plan',
            name: 'AdminPlan',
            component: () => import('@/views/admin/PlanSettingsView.vue'),
            meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
          },
          {
            path: 'security',
            name: 'AdminSecurity',
            component: () => import('@/views/admin/settings/SecurityView.vue'),
            meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
          },
        ],
      },
      { path: 'business', redirect: '/admin/settings' },
      {
        path: 'onboarding',
        name: 'AdminOnboarding',
        component: () => import('@/views/admin/BusinessOnboardingView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
      },
      {
        path: 'services',
        name: 'AdminServices',
        component: () => import('@/views/admin/ServicesView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
      },
      {
        path: 'packages',
        name: 'AdminPackages',
        component: () => import('@/views/admin/PackagesView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
      },
      {
        path: 'packages/:id',
        name: 'AdminPackageDetail',
        component: () => import('@/views/admin/PackageDetailView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
      },
      {
        path: 'customers',
        name: 'AdminCustomers',
        component: () => import('@/views/admin/CustomersView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
      },
      {
        path: 'employees',
        name: 'AdminEmployees',
        component: () => import('@/views/admin/EmployeesView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER'] },
      },
      {
        path: 'appointments',
        name: 'AdminAppointments',
        component: () => import('@/views/admin/AppointmentsView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER', 'EMPLOYEE'] },
      },
    ],
  },
  {
    path: '/staff',
    component: () => import('@/views/staff/StaffLayout.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER', 'EMPLOYEE'] },
    children: [
      {
        path: '',
        name: 'StaffDashboard',
        component: () => import('@/views/staff/StaffAppointmentsView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'BUSINESS_OWNER', 'EMPLOYEE'] },
      },
    ],
  },
  { path: '/b/:slug', name: 'PublicBook', component: () => import('@/views/public/BookAppointmentView.vue'), meta: { public: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  // Subdomain kontrolü (sadece production'da)
  if (!IS_DEV) {
    const currentHost = window.location.hostname
    const isOnAppDomain = currentHost.includes('app.')
    const isOnLandingDomain = !isOnAppDomain

    // Landing domain'deyken admin/staff route'larına erişim
    if (isOnLandingDomain && (to.path.startsWith('/admin') || to.path.startsWith('/staff') || to.name === 'Login' || to.name === 'Register' || to.name === 'RegisterEmployee')) {
      redirectToSubdomain(to.fullPath, 'app')
      return next(false)
    }

    if (isOnAppDomain && (to.name === 'Landing' || to.path.startsWith('/b/'))) {
      redirectToSubdomain(to.fullPath, 'landing')
      return next(false)
    }
  }

  // 1. Auth gerektiren route — giriş yapılmamışsa login'e yönlendir
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  // 2. Giriş yapılmış kullanıcı public sayfalara gitmeye çalışıyorsa yönlendir
  const isPublicOnlyRoute =
    to.name === 'Login' ||
    to.name === 'Register' ||
    to.name === 'EmailVerificationPending' ||
    to.name === 'Landing'

  if (auth.isAuthenticated && isPublicOnlyRoute) {
    return auth.isEmployee
      ? next({ name: 'StaffDashboard' })
      : next({ name: 'AdminDashboard' })
  }

  // 3. Role bazlı erişim kontrolü
  const requiredRoles = to.meta.roles
  if (requiredRoles && auth.user) {
    const userRole = auth.user.role as UserRole
    if (!requiredRoles.includes(userRole)) {
      // Yetkisiz — uygun dashboard'a yönlendir
      return auth.isEmployee
        ? next({ name: 'StaffDashboard' })
        : next({ name: 'AdminDashboard' })
    }
  }

  // 4. Çalışanlar /admin'e giremez (ekstra güvenlik)
  if (auth.isAuthenticated && auth.isEmployee && to.path.startsWith('/admin')) {
    return next({ name: 'StaffDashboard' })
  }

  // 5. Admin/owner /staff'e giremez
  if (auth.isAuthenticated && !auth.isEmployee && to.path.startsWith('/staff')) {
    return next({ name: 'AdminDashboard' })
  }

  next()
})

export default router
