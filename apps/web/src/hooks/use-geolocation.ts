import { useState, useCallback } from 'react'

interface Coordinates {
  latitude: number
  longitude: number
}

type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

interface UseGeolocationReturn {
  coordinates: Coordinates | null
  status: GeoStatus
  error: string | null
  requestPermission: () => void
}

export function useGeolocation(): UseGeolocationReturn {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const requestPermission = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setError('Browser Anda tidak mendukung Geolocation.')
      return
    }

    setStatus('requesting')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setStatus('granted')
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setStatus('denied')
            setError('Akses lokasi ditolak. Izinkan lokasi di pengaturan browser Anda untuk melakukan verifikasi.')
            break
          case err.POSITION_UNAVAILABLE:
            setStatus('error')
            setError('Informasi lokasi tidak tersedia.')
            break
          case err.TIMEOUT:
            setStatus('error')
            setError('Permintaan lokasi timeout. Silakan coba lagi.')
            break
          default:
            setStatus('error')
            setError('Gagal mendapatkan lokasi.')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 60_000, // Cache location for 1 minute
      },
    )
  }, [])

  return { coordinates, status, error, requestPermission }
}
