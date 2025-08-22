export interface Location {
  lat: number
  lng: number
}

export interface Clinic {
  id: number
  name: string
  lat: number
  lng: number
}

export interface ClinicMapProps {
  // Original props (keep for backward compatibility)
  userLocation?: Location | null
  nearestClinicFound?: Clinic | null
  showRouting?: boolean
  // New props for modal/location picker usage
  open?: boolean
  selectedLocation?: Location | null
}

export interface ClinicMapEmits {
  close: []
  locationSelect: [location: Location]
}
