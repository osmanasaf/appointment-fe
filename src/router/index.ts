import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'AdminDashboard', component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'calendar', redirect: '/admin/appointments' },
        {
          path: 'settings',
          component: () => import('@/views/admin/SettingsLayout.vue'),
          children: [
            { path: '', name: 'AdminSettings', component: () => import('@/views/admin/BusinessView.vue') },
            { path: 'plan', name: 'AdminPlan', component: () => import('@/views/admin/PlanSettingsView.vue') },
          ],
        },
        { path: 'business', redirect: '/admin/settings' },
        { path: 'onboarding', name: 'AdminOnboarding', component: () => import('@/views/admin/BusinessOnboardingView.vue') },
        { path: 'services', name: 'AdminServices', component: () => import('@/views/admin/ServicesView.vue') },
        { path: 'packages', name: 'AdminPackages', component: () => import('@/views/admin/PackagesView.vue') },
        { path: 'packages/:id', name: 'AdminPackageDetail', component: () => import('@/views/admin/PackageDetailView.vue') },
        { path: 'customers', name: 'AdminCustomers', component: () => import('@/views/admin/CustomersView.vue') },
        { path: 'employees', name: 'AdminEmployees', component: () => import('@/views/admin/EmployeesView.vue') },
        { path: 'appointments', name: 'AdminAppointments', component: () => import('@/views/admin/AppointmentsView.vue') },
      ],
    },
    { path: '/b/:slug', name: 'PublicBook', component: () => import('@/views/public/BookAppointmentView.vue'), meta: { public: true } },
    { path: '/', redirect: '/admin' },
    { path: '/:pathMatch(.*)*', redirect: '/admin' },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if ((to.name === 'Login' || to.name === 'Register') && auth.isAuthenticated) {
    next({ name: 'AdminDashboard' })
  } else {
    next()
  }
})

export default router
