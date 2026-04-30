import { AlertTriangle, ArrowLeft, Clock, MapPin, ShieldAlert } from 'lucide-react'
import type { VerifyResult } from '#/lib/queries/verify'

interface ResultCounterfeitProps {
  data: VerifyResult
}

export function ResultCounterfeit({ data }: ResultCounterfeitProps) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Status Badge */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-20 items-center justify-center rounded-full bg-error/10 ring-4 ring-error/20 animate-pulse">
          <ShieldAlert className="size-10 text-error" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-heading font-bold text-error">Produk Palsu</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Serial number ini terdeteksi mencurigakan.
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="w-full rounded-xl border border-error/30 bg-error/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-error mt-0.5" />
          <div>
            <p className="text-sm font-medium text-error">
              {data.message || `Produk ini telah di-scan melebihi batas wajar. Kemungkinan besar produk palsu.`}
            </p>
            {data.scan_number != null && data.max_scan != null && (
              <p className="text-xs text-error/70 mt-1">
                Sudah di-scan {data.scan_number} kali (batas normal: {data.max_scan}x)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Product Info (for reference) */}
      {data.product && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            Produk Terkait
          </h3>
          <div className="flex items-start gap-4">
            {data.product.photo_url && (
              <img
                src={data.product.photo_url}
                alt={data.product.name}
                className="size-16 rounded-xl object-cover border border-slate-100 opacity-60"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-900 truncate">{data.product.name}</p>
              <p className="text-sm text-neutral-500">{data.product.category}</p>
            </div>
          </div>
        </div>
      )}

      {/* Batch Info */}
      {data.batch && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            Info Batch
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-400">Batch</span>
              <p className="font-medium font-mono text-neutral-900">{data.batch.batch_number}</p>
            </div>
            <div>
              <span className="text-neutral-400">Produksi</span>
              <p className="font-medium text-neutral-900">{formatDate(data.batch.production_date)}</p>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-400">Kadaluarsa</span>
              <p className="font-medium text-neutral-900">{formatDate(data.batch.expiry_date)}</p>
            </div>
          </div>
        </div>
      )}

      {/* All Previous Scans */}
      {data.previous_scans && data.previous_scans.length > 0 && (
        <div className="w-full rounded-2xl border border-error/10 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-error/60 mb-3">
            Semua Riwayat Scan ({data.previous_scans.length})
          </h3>
          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {data.previous_scans.map((scan, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-error/5">
                  {scan.city ? (
                    <MapPin className="size-3.5 text-error/50" />
                  ) : (
                    <Clock className="size-3.5 text-error/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-700 truncate">
                    {[scan.city, scan.country].filter(Boolean).join(', ') || 'Lokasi tidak tersedia'}
                  </p>
                  <p className="text-xs text-neutral-400">{formatDateTime(scan.scanned_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      <a
        href="/"
        className="btn btn-ghost gap-2 mt-2"
      >
        <ArrowLeft className="size-4" />
        Verifikasi Lagi
      </a>
    </div>
  )
}
