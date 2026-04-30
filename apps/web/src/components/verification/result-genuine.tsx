import { CheckCircle, ArrowLeft, Clock, MapPin } from 'lucide-react'
import type { VerifyResult } from '#/lib/queries/verify'

interface ResultGenuineProps {
  data: VerifyResult
}

export function ResultGenuine({ data }: ResultGenuineProps) {
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
        <div className="flex size-20 items-center justify-center rounded-full bg-success/10 ring-4 ring-success/20">
          <CheckCircle className="size-10 text-success" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-heading font-bold text-success">Produk Asli</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Serial number ini terdaftar dan terverifikasi.
          </p>
        </div>
      </div>

      {/* Scan Counter */}
      {data.scan_number != null && data.max_scan != null && (
        <div className="w-full rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-center">
          <p className="text-sm font-medium text-success">
            Scan ke-{data.scan_number} dari maksimal {data.max_scan}
          </p>
        </div>
      )}

      {/* Product Info */}
      {data.product && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            Detail Produk
          </h3>
          <div className="flex items-start gap-4">
            {data.product.photo_url && (
              <img
                src={data.product.photo_url}
                alt={data.product.name}
                className="size-16 rounded-xl object-cover border border-slate-100"
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

      {/* Previous Scans */}
      {data.previous_scans && data.previous_scans.length > 1 && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            Riwayat Scan
          </h3>
          <div className="space-y-2.5">
            {data.previous_scans.slice(0, 5).map((scan, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  {scan.city ? (
                    <MapPin className="size-3.5 text-neutral-400" />
                  ) : (
                    <Clock className="size-3.5 text-neutral-400" />
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
