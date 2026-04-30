import { HelpCircle, ArrowLeft } from 'lucide-react'

export function ResultNotFound() {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Status Badge */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-20 items-center justify-center rounded-full bg-warning/10 ring-4 ring-warning/20">
          <HelpCircle className="size-10 text-warning" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-heading font-bold text-neutral-800">Tidak Ditemukan</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Serial number tidak terdaftar di sistem Proofly.
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="w-full rounded-xl border border-warning/20 bg-warning/5 px-5 py-4">
        <p className="text-sm text-neutral-600 leading-relaxed">
          Serial number yang Anda masukkan tidak ditemukan dalam database kami. Pastikan Anda memasukkan serial number dengan benar, atau produk ini mungkin tidak terdaftar di sistem Proofly.
        </p>
      </div>

      {/* Tips */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Tips
        </h3>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Pastikan serial number diketik dengan benar (12 karakter alfanumerik)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Gunakan fitur scan QR code untuk hasil yang lebih akurat
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Jika masalah berlanjut, hubungi produsen produk
          </li>
        </ul>
      </div>

      {/* Back Button */}
      <a
        href="/"
        className="btn btn-primary gap-2 mt-2"
      >
        <ArrowLeft className="size-4" />
        Coba Lagi
      </a>
    </div>
  )
}
