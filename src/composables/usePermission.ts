import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export type UserRole = 'ADMIN' | 'BUSINESS_OWNER' | 'EMPLOYEE'

/**
 * Role bazlı yetki kontrolü için composable.
 *
 * Kullanım:
 *   const { canAccess, isOwnerOrAdmin, canManageEmployees } = usePermission()
 *   v-if="canManageEmployees"
 */
export function usePermission() {
  const auth = useAuthStore()

  /** Verilen rollerden herhangi birine sahipse true döner. */
  const canAccess = (roles: UserRole[]) =>
    computed(() => !!auth.user && roles.includes(auth.user.role as UserRole))

  // ── Önceden tanımlı kısayollar ───────────────────────────────────────────

  /** Admin veya işletme sahibi. */
  const isOwnerOrAdmin = computed(
    () => auth.isBusinessOwner || auth.isAdmin,
  )

  /** Sadece admin. */
  const isAdmin = computed(() => auth.isAdmin)

  /** Sadece çalışan. */
  const isEmployee = computed(() => auth.isEmployee)

  /** Müşteri listesi — herkes görebilir, silme/kara liste owner/admin. */
  const canViewCustomers = computed(() => isOwnerOrAdmin.value)

  /** Hizmet yönetimi — sadece owner/admin. */
  const canManageServices = computed(() => isOwnerOrAdmin.value)

  /** Çalışan yönetimi — sadece owner/admin. */
  const canManageEmployees = computed(() => isOwnerOrAdmin.value)

  /** Paket yönetimi — sadece owner/admin. */
  const canManagePackages = computed(() => isOwnerOrAdmin.value)

  /** Dashboard — sadece owner/admin. */
  const canViewDashboard = computed(() => isOwnerOrAdmin.value)

  /** Ayarlar — sadece owner/admin. */
  const canViewSettings = computed(() => isOwnerOrAdmin.value)

  /** Randevu oluşturma — herkes yapabilir. */
  const canCreateAppointment = computed(() => true)

  /** Randevu silme — sadece owner/admin. */
  const canDeleteAppointment = computed(() => isOwnerOrAdmin.value)

  return {
    canAccess,
    isOwnerOrAdmin,
    isAdmin,
    isEmployee,
    canViewCustomers,
    canManageServices,
    canManageEmployees,
    canManagePackages,
    canViewDashboard,
    canViewSettings,
    canCreateAppointment,
    canDeleteAppointment,
  }
}
