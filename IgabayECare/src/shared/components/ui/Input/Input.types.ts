import type { ComponentSize } from '../../../core/types'

export interface InputProps {
  label?: string
  error?: string
  placeholder?: string
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'search'
    | 'date'
    | 'time'
    | 'datetime-local'
  size?: ComponentSize
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  icon?: any
  iconPosition?: 'left' | 'right'
  modelValue?: string | number
  maxLength?: number
  minLength?: number
  pattern?: string
  autocomplete?: string
  id?: string
  name?: string
}

export interface InputEmits {
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
  change: [event: Event]
  keydown: [event: KeyboardEvent]
  keyup: [event: KeyboardEvent]
}
