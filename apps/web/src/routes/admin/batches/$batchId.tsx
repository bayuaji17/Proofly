import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Edit,
  Trash2,
  Lock,
  Unlock,
  Layers,
  QrCode,
  ScanLine,
  Download,
} from 'lucide-react'

import { PageHeader } from '#/components/layout/page-header'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { PageSkeleton } from '#/components/ui/skeleton'
import { batchQueryOptions } from '#/lib/queries/batches'

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/admin/batches/$batchId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      batchQueryOptions(params.batchId),
    )
  },

  head: () => ({
    meta: [{ title: 'Detail Batch — Proofly Admin' }],
  }),

  component: BatchDetailPage,
  pendingComponent: () => <PageSkeleton />,
})

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function BatchDetailPage() {
  const { batchId } = Route.useParams()
  const { data } = useSuspenseQuery(batchQueryOptions(batchId))
  const batch = data.data

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Produk', href: '/admin/products' },
          {
            label: batch.product_name ?? 'Produk',
            href: `/admin/products/${batch.product_id}`,
          },
          { label: batch.batch_number },
        ]}
      />

      <PageHeader title={batch.batch_number}>
        {!batch.is_locked && (
          <Link
            to="/admin/batches/$batchId/edit"
            params={{ batchId }}
            className="btn btn-ghost btn-sm gap-1"
          >
            <Edit className="size-4" />
            Edit
          </Link>
        )}

        {/* Placeholder buttons for Sprint 4 */}
        <button className="btn btn-ghost btn-sm gap-1" disabled>
          <QrCode className="size-4" />
          Generate QR
        </button>
        <button className="btn btn-ghost btn-sm gap-1" disabled>
          <Download className="size-4" />
          Download PDF
        </button>
      </PageHeader>

      {/* Batch Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Details Card */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Batch Number" value={batch.batch_number} />
                <InfoItem
                  label="Quantity"
                  value={batch.quantity.toLocaleString('id-ID')}
                />
                <InfoItem
                  label="Tanggal Produksi"
                  value={formatDate(batch.production_date)}
                />
                <InfoItem
                  label="Tanggal Kadaluarsa"
                  value={formatDate(batch.expiry_date)}
                />
                <InfoItem
                  label="Status"
                  value={
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        batch.is_locked
                          ? 'bg-warning/15 text-warning'
                          : 'bg-success/15 text-success'
                      }`}
                    >
                      {batch.is_locked ? (
                        <Lock className="size-3" />
                      ) : (
                        <Unlock className="size-3" />
                      )}
                      {batch.is_locked ? 'Locked' : 'Unlocked'}
                    </span>
                  }
                />
                <InfoItem
                  label="Dibuat"
                  value={formatDate(batch.created_at)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="space-y-4">
          <StatCard
            icon={<QrCode className="size-5 text-primary" />}
            label="QR Code Generated"
            value={batch.qr_code_count ?? 0}
          />
          <StatCard
            icon={<ScanLine className="size-5 text-primary" />}
            label="Total Scan"
            value={batch.total_scans ?? 0}
          />
        </div>
      </div>

      {/* QR Codes Table (Placeholder — Sprint 4) */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold font-heading mb-4">
          Daftar QR Code
        </h2>

        <div className="overflow-x-auto rounded-xl border border-base-200 bg-base-100 shadow-sm">
          <table className="table w-full">
            <thead className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase tracking-wider text-base-content/60 font-heading">
              <tr>
                <th className="px-5 py-4">Serial Number</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Scan Count</th>
                <th className="px-5 py-4">Created At</th>
              </tr>
            </thead>
            <tbody className="font-sans">
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <QrCode className="size-10 text-base-content/20" />
                    <p className="text-sm text-base-content/50">
                      {batch.is_locked
                        ? 'Belum ada QR code yang di-generate.'
                        : 'Generate QR code untuk melihat daftar serial number.'}
                    </p>
                    <p className="text-xs text-base-content/40">
                      Fitur QR code akan tersedia di Sprint 4.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function InfoItem({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-base-content/50 mb-1">
        {label}
      </p>
      <div className="text-sm font-medium text-base-content">{value}</div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body flex-row items-center gap-4 p-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-base-content/50">{label}</p>
        </div>
      </div>
    </div>
  )
}
