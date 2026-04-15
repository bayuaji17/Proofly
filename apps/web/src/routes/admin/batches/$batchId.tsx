import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Edit,
  Lock,
  Unlock,
  QrCode,
  ScanLine,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

import { PageHeader } from '#/components/layout/page-header'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { PageSkeleton } from '#/components/ui/skeleton'
import { toast } from '#/components/ui/toast'
import { batchQueryOptions } from '#/lib/queries/batches'
import { qrCodesQueryOptions, retryPdfGeneration } from '#/lib/queries/qrcodes'
import { GenerateQrDialog } from '#/components/forms/generate-qr-dialog'

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

interface SearchParams {
  page?: number
}

export const Route = createFileRoute('/admin/batches/$batchId')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      page: Number(search.page ?? 1) || 1,
    }
  },
  loaderDeps: ({ search: { page } }) => ({ page }),
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
  const search = Route.useSearch()
  const page = search.page ?? 1
  const navigate = useNavigate({ from: Route.fullPath })
  const queryClient = useQueryClient()

  // Data Fetching — auto-poll when PDF is processing
  const { data: batchRes, refetch: refetchBatch } = useSuspenseQuery({
    ...batchQueryOptions(batchId),
    refetchInterval: (query) => {
      const batch = query.state.data?.data
      return batch?.pdf_status === 'processing' ? 3000 : false
    },
  })
  const batch = batchRes.data

  const { data: qrcodesRes, isLoading: qrLoading } = useQuery(qrCodesQueryOptions(batchId, page))

  // State
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const handleDownloadPdf = () => {
    if (batch.pdf_url) {
      window.open(batch.pdf_url, '_blank')
    }
  }

  const handleRetryPdf = async () => {
    try {
      setIsRetrying(true)
      await retryPdfGeneration(batchId)
      toast.success('PDF generation telah di-queue ulang')
      refetchBatch()
    } catch (e: any) {
      toast.error(e.message || 'Gagal melakukan retry')
    } finally {
      setIsRetrying(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage }, replace: true })
  }

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
        {!batch.is_locked ? (
          <>
            <Link
              to="/admin/batches/$batchId/edit"
              params={{ batchId }}
              className="btn btn-ghost btn-sm gap-1"
            >
              <Edit className="size-4" />
              Edit
            </Link>
            <button
              onClick={() => setIsGenerateDialogOpen(true)}
              className="btn btn-primary btn-sm gap-1"
            >
              <QrCode className="size-4" />
              Generate QR
            </button>
          </>
        ) : batch.pdf_status === 'processing' ? (
          <button className="btn btn-sm gap-1" disabled>
            <Loader2 className="size-4 animate-spin" />
            Memproses PDF...
          </button>
        ) : batch.pdf_status === 'failed' ? (
          <button
            onClick={handleRetryPdf}
            disabled={isRetrying}
            className="btn btn-error btn-sm gap-1"
          >
            {isRetrying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {isRetrying ? 'Retrying...' : 'Retry Generate PDF'}
          </button>
        ) : batch.pdf_status === 'completed' && batch.pdf_url ? (
          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary btn-sm gap-1"
          >
            <Download className="size-4" />
            Download PDF
          </button>
        ) : null}
      </PageHeader>

      {/* PDF Status Banner */}
      {batch.is_locked && batch.pdf_status === 'processing' && (
        <div className="flex items-center gap-3 rounded-xl border border-info/30 bg-info/5 px-5 py-3 mb-6">
          <Loader2 className="size-5 animate-spin text-info" />
          <div>
            <p className="text-sm font-medium text-info">PDF sedang di-generate...</p>
            <p className="text-xs text-base-content/60">
              Proses ini membutuhkan waktu tergantung jumlah QR code. Halaman ini akan otomatis memperbarui status.
            </p>
          </div>
        </div>
      )}

      {batch.is_locked && batch.pdf_status === 'failed' && (
        <div className="flex items-center gap-3 rounded-xl border border-error/30 bg-error/5 px-5 py-3 mb-6">
          <AlertCircle className="size-5 text-error" />
          <div>
            <p className="text-sm font-medium text-error">PDF generation gagal</p>
            <p className="text-xs text-base-content/60">
              Terjadi kesalahan saat membuild PDF. Klik tombol "Retry Generate PDF" untuk mencoba kembali.
            </p>
          </div>
        </div>
      )}

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

      {/* QR Codes Table */}
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
              {!batch.is_locked && (qrcodesRes?.total === 0 || !qrcodesRes) ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <QrCode className="size-10 text-base-content/20" />
                      <p className="text-sm text-base-content/50">
                        Belum ada QR code yang di-generate.
                      </p>
                      <button
                        onClick={() => setIsGenerateDialogOpen(true)}
                        className="btn btn-outline btn-sm mt-2"
                      >
                        Generate Sekarang
                      </button>
                    </div>
                  </td>
                </tr>
              ) : qrLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-base-200/50 last:border-0 hover:bg-base-200/20 transition-colors">
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-base-200 rounded animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-6 w-20 bg-base-200 rounded-full mx-auto animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-12 bg-base-200 rounded mx-auto animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-base-200 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : qrcodesRes?.data.length ? (
                qrcodesRes.data.map((qr) => (
                  <tr key={qr.id} className="border-b border-base-200/50 last:border-0 hover:bg-base-200/20 transition-colors">
                    <td className="px-5 py-4 font-mono text-sm">{qr.serial_number}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        qr.status === 'genuine' ? 'bg-success/15 text-success' :
                        qr.status === 'counterfeit' ? 'bg-error/15 text-error' :
                        'bg-base-200 text-base-content/70'
                      }`}>
                        {qr.status.charAt(0).toUpperCase() + qr.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-sm">{qr.scan_count}</td>
                    <td className="px-5 py-4 text-sm text-base-content/70">
                      {formatDate(qr.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-base-content/50">
                    Tidak ada data QR code.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {qrcodesRes && qrcodesRes.total > qrcodesRes.page_size && (
             <div className="flex items-center justify-between border-t border-base-200 px-5 py-3">
               <div className="text-sm text-base-content/60">
                 Menampilkan <span className="font-medium text-base-content">{(page - 1) * qrcodesRes.page_size + 1}</span> hingga <span className="font-medium text-base-content">{Math.min(page * qrcodesRes.page_size, qrcodesRes.total)}</span> dari <span className="font-medium text-base-content">{qrcodesRes.total}</span> hasil
               </div>
               <div className="join">
                 <button
                   className="join-item btn btn-sm"
                   disabled={page === 1}
                   onClick={() => handlePageChange(page - 1)}
                 >
                   «
                 </button>
                 <button className="join-item btn btn-sm">
                   Page {page}
                 </button>
                 <button
                   className="join-item btn btn-sm"
                   disabled={page * qrcodesRes.page_size >= qrcodesRes.total}
                   onClick={() => handlePageChange(page + 1)}
                 >
                   »
                 </button>
               </div>
             </div>
          )}
        </div>
      </div>

      <GenerateQrDialog
        isOpen={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        batchId={batchId}
        quantity={batch.quantity}
        onSuccess={() => {
          refetchBatch()
          queryClient.invalidateQueries({ queryKey: ['batches', batchId, 'qrcodes'] })
          if (page !== 1) {
             handlePageChange(1)
          }
        }}
      />
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
