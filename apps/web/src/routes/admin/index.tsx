import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '#/components/layout/page-header'

export const Route = createFileRoute('/admin/')({
  head: () => ({
    meta: [{ title: 'Dashboard — Proofly Admin' }],
  }),
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan data dan aktivitas terbaru."
      />

      {/* Placeholder stats */}
      <div className="stats stats-vertical w-full shadow sm:stats-horizontal">
        <div className="stat">
          <div className="stat-title">Total Produk</div>
          <div className="stat-value text-primary">0</div>
          <div className="stat-desc">Produk aktif</div>
        </div>

        <div className="stat">
          <div className="stat-title">Total Batch</div>
          <div className="stat-value">0</div>
          <div className="stat-desc">Batch terdaftar</div>
        </div>

        <div className="stat">
          <div className="stat-title">Total QR Code</div>
          <div className="stat-value">0</div>
          <div className="stat-desc">QR code aktif</div>
        </div>

        <div className="stat">
          <div className="stat-title">Total Scan</div>
          <div className="stat-value">0</div>
          <div className="stat-desc">Verifikasi dilakukan</div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-base-200 p-8 text-center text-base-content/40">
        <p>Analytics data akan ditampilkan di sini.</p>
      </div>
    </>
  )
}
