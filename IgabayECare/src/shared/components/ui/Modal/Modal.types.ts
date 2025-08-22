import type { ComponentSize } from '../../../core/types'

export interface ModalProps {
  modelValue: boolean // Vue v-model for isOpen
  title?: string
  size?: ComponentSize
  closable?: boolean
  maskClosable?: boolean
  centered?: boolean
  destroyOnClose?: boolean
}

export interface ModalEmits {
  'update:modelValue': [value: boolean]
  close: []
  open: []
  afterClose: []
  afterOpen: []
}

export interface ModalSlots {
  default(): any
  header(): any
  footer(): any
}
