import type { NavigationItem, UserRole } from '../../../core/types'

export interface DashboardLayoutProps {
  navigationItems: NavigationItem[]
  activeTab: string
  user?: any // TODO: Replace with proper User type when available
  variant?: UserRole | 'patient' | 'clinic' | 'doctor'
  searchPlaceholder?: string
  showNavbar?: boolean
  showSidebar?: boolean
  sidebarCollapsible?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export interface DashboardLayoutEmits {
  'tab-change': [tabId: string]
  'sign-out': []
  search: [query: string]
  'sidebar-toggle': [collapsed: boolean]
}

export interface DashboardLayoutSlots {
  default(): any
  header(): any
  sidebar(): any
  footer(): any
}

export interface SidebarProps {
  navigationItems: NavigationItem[]
  activeTab: string
  user?: any
  variant?: UserRole | 'patient' | 'clinic' | 'doctor'
  collapsed?: boolean
  collapsible?: boolean
}

export interface SidebarEmits {
  'tab-change': [tabId: string]
  'toggle-collapse': [collapsed: boolean]
}

export interface NavbarProps {
  user?: any
  activeTab: string
  searchPlaceholder?: string
  showSearch?: boolean
  variant?: UserRole | 'patient' | 'clinic' | 'doctor'
}

export interface NavbarEmits {
  search: [query: string]
  'sign-out': []
  'profile-click': []
  'notifications-click': []
}
