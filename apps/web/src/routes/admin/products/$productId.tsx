import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  Package,
  Layers,
  QrCode,
  Plus,
  Lock,
  Unlock,
} from 'lucide-react'

import { PageHeader } from '#/components/layout/page-header'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { PageSkeleton } from '#/components/ui/skeleton'
import { Dialog } from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { toast } from '#/components/ui/toast'
import { ApiError } from '#/lib/api'
import { BatchForm } from '#/components/forms/batch-form'
import type { BatchFormValues } from '#/components/forms/batch-form'
import type { Batch } from '#/types/models'
import {
  productQueryOptions,
  deleteProductMutation,
  archiveProductMutation,
} from '#/lib/queries/products'
import {
  batchesQueryOptions,
  createBatchMutation,
  deleteBatchMutation,
} from '#/lib/queries/batches'

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/admin/products/$productId')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        productQueryOptions(params.productId),
      ),
      context.queryClient.ensureQueryData(
        batchesQueryOptions(params.productId),
      ),
    ])
  },

  head: () => ({
    meta: [{ title: 'Detail Produk — Proofly Admin' }],
  }),

  component: ProductDetailPage,
  pendingComponent: () => <PageSkeleton />,
})

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function ProductDetailPage() {
  const { productId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useSuspenseQuery(productQueryOptions(productId))
  const product = data.data

  const batchesQuery = useQuery(batchesQueryOptions(productId))
  const batches = batchesQuery.data?.data ?? []

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [createBatchOpen, setCreateBatchOpen] = useState(false)
  const [isCreatingBatch, setIsCreatingBatch] = useState(false)
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null)
  const [deleteBatchNumber, setDeleteBatchNumber] = useState('')

  // ── Archive mutation ──
  const archiveMut = useMutation({
    mutationFn: () => archiveProductMutation(productId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', productId] })
      toast.success(
        res.data.is_active
          ? 'Produk berhasil direstore'
          : 'Produk berhasil diarsipkan',
      )
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Gagal mengarsipkan produk')
    },
  })

  // ── Delete mutation ──
  const deleteMut = useMutation({
    mutationFn: () => deleteProductMutation(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produk berhasil dihapus')
      navigate({ to: '/admin/products' })
    },
    onError: (err) => {
      setDeleteOpen(false)
      if (err instanceof ApiError && err.status === 409) {
        toast.error(
          'Produk tidak dapat dihapus karena memiliki batch terkunci. Gunakan fitur arsip.',
        )
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Gagal menghapus produk')
      }
    },
  })

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Produk', href: '/admin/products' },
          { label: product.name },
        ]}
      />
      <PageHeader title={product.name}>
        <Link
          to="/admin/products/$productId/edit"
          params={{ productId }}
          className="btn btn-ghost btn-sm gap-1"
        >
          <Edit className="size-4" />
          Edit
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => archiveMut.mutate()}
          isLoading={archiveMut.isPending}
        >
          {product.is_active ? (
            <>
              <Archive className="size-4" />
              Arsipkan
            </>
          ) : (
            <>
              <ArchiveRestore className="size-4" />
              Restore
            </>
          )}
        </Button>

        <Button
          variant="error"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
          Hapus
        </Button>
      </PageHeader>

      {/* Product Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Photo + Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Photo */}
                {product.photo_url ? (
                  <img
                    src={product.photo_url}
                    alt={product.name}
                    className="h-48 w-full rounded-lg object-cover sm:h-40 sm:w-40 shrink-0"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center rounded-lg bg-base-200 sm:h-40 sm:w-40 shrink-0">
                    <Package className="size-12 text-base-content/20" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge badge-sm ${product.is_active ? 'badge-success' : 'badge-neutral'}`}
                    >
                      {product.is_active ? 'Aktif' : 'Arsip'}
                    </span>
                    <span className="text-sm text-base-content/50">
                      {product.category}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-base-content/70">
                    {product.description}
                  </p>

                  <p className="text-xs text-base-content/40">
                    Dibuat: {new Date(product.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="space-y-4">
          <StatCard
            icon={<Layers className="size-5 text-primary" />}
            label="Total Batch"
            value={product.batch_count ?? 0}
          />
          <StatCard
            icon={<QrCode className="size-5 text-primary" />}
            label="Total QR Code"
            value={product.qr_code_count ?? 0}
          />
        </div>
      </div>

      {/* Batch List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-heading">Daftar Batch</h2>
          <button
            className="btn btn-primary btn-sm gap-1"
            onClick={() => setCreateBatchOpen(true)}
          >
            <Plus className="size-4" />
            Tambah Batch
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-base-200 bg-base-100 shadow-sm">
          <table className="table w-full">
            <thead className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase tracking-wider text-base-content/60 font-heading">
              <tr>
                <th className="px-5 py-4">Batch Number</th>
                <th className="px-5 py-4 text-center">Quantity</th>
                <th className="px-5 py-4">Tgl. Produksi</th>
                <th className="px-5 py-4">Tgl. Kadaluarsa</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Total Scan</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="font-sans divide-y divide-base-200/50">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Layers className="size-10 text-base-content/20" />
                      <p className="text-sm text-base-content/50">
                        Belum ada batch untuk produk ini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <BatchRow
                    key={batch.id}
                    batch={batch}
                    onDelete={(id, number) => {
                      setDeleteBatchId(id)
                      setDeleteBatchNumber(number)
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Batch Modal */}
      <dialog
        className="modal"
        open={createBatchOpen}
        onClick={(e) => { if (e.target === e.currentTarget) setCreateBatchOpen(false) }}
      >
        <div className="modal-box">
          <h3 className="text-lg font-bold font-heading mb-4">Tambah Batch Baru</h3>
          <BatchForm
            onSubmit={async (values: BatchFormValues) => {
              setIsCreatingBatch(true)
              try {
                await createBatchMutation(productId, values)
                await queryClient.invalidateQueries({ queryKey: ['batches', productId] })
                await queryClient.invalidateQueries({ queryKey: ['products'] })
                toast.success('Batch berhasil ditambahkan')
                setCreateBatchOpen(false)
              } catch (err) {
                if (err instanceof ApiError && err.status === 409) {
                  toast.error('Batch number sudah digunakan untuk produk ini')
                } else {
                  toast.error(err instanceof ApiError ? err.message : 'Gagal menambahkan batch')
                }
              } finally {
                setIsCreatingBatch(false)
              }
            }}
            isSubmitting={isCreatingBatch}
          />
          <div className="modal-action mt-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setCreateBatchOpen(false)}>Batal</button>
          </div>
        </div>
      </dialog>

      {/* Delete Batch Dialog */}
      <Dialog
        open={deleteBatchId !== null}
        onClose={() => setDeleteBatchId(null)}
        onConfirm={async () => {
          if (!deleteBatchId) return
          try {
            await deleteBatchMutation(deleteBatchId)
            await queryClient.invalidateQueries({ queryKey: ['batches', productId] })
            await queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Batch berhasil dihapus')
          } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
              toast.error('Batch sudah terkunci dan tidak dapat dihapus')
            } else {
              toast.error(err instanceof ApiError ? err.message : 'Gagal menghapus batch')
            }
          } finally {
            setDeleteBatchId(null)
          }
        }}
        title="Hapus Batch"
        description={`Apakah Anda yakin ingin menghapus batch "${deleteBatchNumber}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        variant="danger"
      />

      {/* Delete Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMut.mutate()}
        title="Hapus Produk"
        description={`Apakah Anda yakin ingin menghapus "${product.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        variant="danger"
        isLoading={deleteMut.isPending}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

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

function BatchRow({
  batch,
  onDelete,
}: {
  batch: Batch
  onDelete: (id: string, batchNumber: string) => void
}) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <tr className="group border-b-0 transition-colors duration-200 hover:bg-primary/5">
      <td className="px-5 py-3">
        <Link
          to="/admin/batches/$batchId"
          params={{ batchId: batch.id }}
          className="text-sm font-semibold text-base-content transition-colors group-hover:text-primary"
        >
          {batch.batch_number}
        </Link>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="text-sm font-medium text-base-content/80">
          {batch.quantity.toLocaleString('id-ID')}
        </span>
      </td>
      <td className="px-5 py-3">
        <span className="text-sm text-base-content/70">
          {formatDate(batch.production_date)}
        </span>
      </td>
      <td className="px-5 py-3">
        <span className="text-sm text-base-content/70">
          {formatDate(batch.expiry_date)}
        </span>
      </td>
      <td className="px-5 py-3 text-center">
        {batch.is_locked ? (
          <div className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
            <Lock className="size-3" />
            Locked
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
            <Unlock className="size-3" />
            Unlocked
          </div>
        )}
      </td>
      <td className="px-5 py-3 text-center">
        <span className="text-sm font-medium text-base-content/80">
          {batch.total_scans ?? 0}
        </span>
      </td>
      <td className="px-5 py-3">
        <button
          className="btn btn-ghost btn-xs text-error"
          disabled={batch.is_locked}
          title={batch.is_locked ? 'Batch terkunci, tidak dapat dihapus' : 'Hapus batch'}
          onClick={() => onDelete(batch.id, batch.batch_number)}
        >
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  )
}
