export interface LatLng {
  lat: number
  lng: number
}

export interface ClinicLocationModalProps {
  open: boolean
  selectedLocation: LatLng | null
}

export interface ClinicLocationModalEmits {
  close: []
  locationSelect: [location: LatLng]
}
