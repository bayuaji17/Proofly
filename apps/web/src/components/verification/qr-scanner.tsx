import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X, AlertCircle } from 'lucide-react'

interface QrScannerProps {
  onScan: (serialNumber: string) => void
  disabled?: boolean
}

/**
 * Extract serial number from a Proofly QR URL or raw text.
 * Accepts: http://localhost:3000/verify?sn=XXXX-XXXX-XXXX
 *          https://proofly.id/verify?sn=XXXX-XXXX-XXXX
 *          XXXX-XXXX-XXXX (raw serial)
 */
function extractSerialNumber(text: string): string | null {
  try {
    const url = new URL(text)
    const sn = url.searchParams.get('sn')
    if (sn) return sn
  } catch {
    // Not a URL — treat as raw serial
  }

  // Raw serial format: XXXX-XXXX-XXXX or XXXXXXXXXXXX
  const cleaned = text.trim().toUpperCase().replace(/[\s-]/g, '')
  if (/^[A-Z0-9]{12}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`
  }

  return null
}

export function QrScanner({ onScan, disabled = false }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const startScanner = async () => {
    if (disabled) return
    setError(null)

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          const serial = extractSerialNumber(decodedText)
          if (serial) {
            stopScanner()
            onScan(serial)
          } else {
            setError('QR code tidak valid. Pastikan Anda memindai QR Proofly.')
          }
        },
        () => {
          // Ignore scan failure (frame without QR)
        },
      )

      setIsScanning(true)
    } catch (err: any) {
      if (err?.message?.includes('Permission')) {
        setError('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.')
      } else if (err?.message?.includes('NotFoundError') || err?.message?.includes('device')) {
        setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.')
      } else {
        setError('Gagal membuka kamera. Silakan coba lagi.')
      }
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch {
        // Ignore stop errors
      }
    }
    scannerRef.current = null
    setIsScanning(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Scanner viewport */}
      <div
        ref={containerRef}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-neutral-900"
      >
        <div
          id="qr-reader"
          className={`w-full ${isScanning ? 'min-h-[300px]' : 'h-0'}`}
        />

        {!isScanning && (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10">
              <Camera className="size-8 text-white/70" />
            </div>
            <p className="text-sm text-white/60 text-center">
              Arahkan kamera ke QR code pada produk
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error w-full max-w-sm">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls */}
      {isScanning ? (
        <button
          type="button"
          onClick={stopScanner}
          className="btn btn-ghost btn-sm gap-2"
        >
          <X className="size-4" />
          Tutup Kamera
        </button>
      ) : (
        <button
          type="button"
          onClick={startScanner}
          disabled={disabled}
          className="btn btn-primary gap-2"
        >
          <Camera className="size-4" />
          Buka Kamera
        </button>
      )}
    </div>
  )
}
