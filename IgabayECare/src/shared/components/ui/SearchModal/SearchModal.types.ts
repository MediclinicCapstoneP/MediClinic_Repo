export interface Doctor {
  id: string
  name: string
  specialties: string[]
  image?: string
  rating?: number
  experience?: string
  location?: string
}

export interface Clinic {
  id: string
  name: string
  location: string
  specialties: string[]
  image?: string
  rating?: number
}

export interface SearchModalProps {
  isOpen: boolean
  searchQuery: string
}

export interface SearchModalEmits {
  close: []
  search: [query: string]
  doctorSelect: [doctor: Doctor]
  clinicSelect: [clinic: Clinic]
}

export type SearchTab = 'all' | 'doctors' | 'clinics'
