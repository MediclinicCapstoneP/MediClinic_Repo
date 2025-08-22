import type { ComponentSize, ComponentVariant } from '../../../core/types'

export interface ButtonProps {
  variant?: ComponentVariant | 'medical' | 'accent' | 'gradient'
  size?: ComponentSize
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  icon?: any
  iconPosition?: 'left' | 'right'
}

export interface ButtonSlots {
  default(): any
  icon(): any
}

export interface ButtonEmits {
  click: [event: MouseEvent]
}
