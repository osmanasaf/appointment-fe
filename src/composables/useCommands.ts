import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from './useTheme'
import { useAuthStore } from '@/stores/auth'
import {
  Home,
  Calendar,
  Users,
  UserCog,
  Package,
  Briefcase,
  Settings,
  CalendarCheck2,
  UserPlus,
  Palette,
  LogOut,
  type LucideIcon,
} from 'lucide-vue-next'

export type CommandSection = 'navigation' | 'actions' | 'recent' | 'help'

export interface CommandItem {
  id: string
  section: CommandSection
  icon?: Component | LucideIcon
  label: string
  description?: string
  shortcut?: string[]
  keywords?: string[]
  action: () => void | Promise<void>
}

export function useCommands(): CommandItem[] {
  const router = useRouter()
  const { t } = useI18n()
  const theme = useTheme()
  const auth = useAuthStore()

  const commands: CommandItem[] = []

  // === NAVIGATION Section ===
  commands.push({
    id: 'nav-dashboard',
    section: 'navigation',
    icon: Home,
    label: t('commandPalette.commands.gotoDashboard'),
    description: t('nav.dashboard'),
    keywords: ['dashboard', 'ana sayfa', 'home'],
    action: () => router.push({ name: 'AdminDashboard' }),
  })

  commands.push({
    id: 'nav-calendar',
    section: 'navigation',
    icon: Calendar,
    label: t('commandPalette.commands.gotoCalendar'),
    description: t('nav.calendar'),
    keywords: ['calendar', 'takvim'],
    action: () => router.push({ name: 'AdminCalendar' }),
  })

  commands.push({
    id: 'nav-appointments',
    section: 'navigation',
    icon: CalendarCheck2,
    label: t('commandPalette.commands.gotoAppointments'),
    description: t('nav.appointments'),
    keywords: ['appointments', 'randevular'],
    action: () => router.push({ name: 'AdminAppointments' }),
  })

  commands.push({
    id: 'nav-customers',
    section: 'navigation',
    icon: Users,
    label: t('commandPalette.commands.gotoCustomers'),
    description: t('nav.customers'),
    keywords: ['customers', 'müşteriler'],
    action: () => router.push({ name: 'AdminCustomers' }),
  })

  commands.push({
    id: 'nav-employees',
    section: 'navigation',
    icon: UserCog,
    label: t('commandPalette.commands.gotoEmployees'),
    description: t('nav.employees'),
    keywords: ['employees', 'çalışanlar', 'team', 'ekip'],
    action: () => router.push({ name: 'AdminEmployees' }),
  })

  commands.push({
    id: 'nav-services',
    section: 'navigation',
    icon: Briefcase,
    label: t('commandPalette.commands.gotoServices'),
    description: t('nav.services'),
    keywords: ['services', 'hizmetler'],
    action: () => router.push({ name: 'AdminServices' }),
  })

  commands.push({
    id: 'nav-packages',
    section: 'navigation',
    icon: Package,
    label: t('commandPalette.commands.gotoPackages'),
    description: t('nav.packages'),
    keywords: ['packages', 'paketler'],
    action: () => router.push({ name: 'AdminPackages' }),
  })

  commands.push({
    id: 'nav-settings',
    section: 'navigation',
    icon: Settings,
    label: t('commandPalette.commands.gotoSettings'),
    description: t('nav.settings'),
    keywords: ['settings', 'ayarlar'],
    action: () => router.push({ name: 'AdminSettings' }),
  })

  // === ACTIONS Section ===
  commands.push({
    id: 'action-new-appointment',
    section: 'actions',
    icon: CalendarCheck2,
    label: t('commandPalette.actions.newAppointment'),
    description: t('commandPalette.actionsDesc.newAppointment'),
    keywords: ['new', 'yeni', 'randevu', 'appointment', 'create'],
    action: () => router.push({ name: 'AdminAppointments' }),
  })

  commands.push({
    id: 'action-new-customer',
    section: 'actions',
    icon: UserPlus,
    label: t('commandPalette.actions.newCustomer'),
    description: t('commandPalette.actionsDesc.newCustomer'),
    keywords: ['new', 'yeni', 'müşteri', 'customer', 'add'],
    action: () => router.push({ name: 'AdminCustomers' }),
  })

  commands.push({
    id: 'action-toggle-theme',
    section: 'actions',
    icon: Palette,
    label: t('commandPalette.actions.toggleTheme'),
    description: t('commandPalette.actionsDesc.toggleTheme'),
    keywords: ['theme', 'tema', 'dark', 'light', 'koyu', 'açık'],
    action: () => theme.toggle(),
  })

  commands.push({
    id: 'action-logout',
    section: 'actions',
    icon: LogOut,
    label: t('commandPalette.actions.logout'),
    description: t('commandPalette.actionsDesc.logout'),
    keywords: ['logout', 'çıkış', 'sign out'],
    action: async () => {
      await auth.logout()
      await router.replace({ name: 'Login' })
    },
  })

  // === HELP Section ===
  commands.push({
    id: 'help-shortcuts',
    section: 'help',
    label: t('commandPalette.help.shortcuts'),
    description: t('commandPalette.helpDesc.shortcuts'),
    keywords: ['shortcuts', 'kısayollar', 'keyboard', 'klavye'],
    action: () => {
      // Şimdilik no-op; gelecekte shortcuts modal açılabilir
    },
  })

  return commands
}
