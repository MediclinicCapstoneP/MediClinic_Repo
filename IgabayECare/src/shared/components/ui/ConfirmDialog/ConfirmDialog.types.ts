export interface ConfirmDialogProps {
  modelValue: boolean // Vue v-model for isOpen
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  loading?: boolean
  closable?: boolean
}

export interface ConfirmDialogEmits {
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
  close: []
}

export interface ConfirmDialogSlots {
  title(): any
  content(): any
  actions(): any
}
