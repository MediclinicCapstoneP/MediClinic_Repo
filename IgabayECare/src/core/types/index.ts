// Core types - main export file
export * from './common.types'
export * from './user.types'
export * from './api.types'

// Re-export existing appointment types for backward compatibility
export * from '../../types/appointments'

// Legacy types - will be migrated gradually
export * from '../../types/index'
