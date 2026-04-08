import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  Package,
  Layers,
  QrCode,
} from 'lucide-react'

import { PageHeader } from '#/components/layout/page-header'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { PageSkeleton } from '#/components/ui/skeleton'
import { Dialog } from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { toast } from '#/components/ui/toast'
import { ApiError } from '#/lib/api'
import {
  productQueryOptions,
  deleteProductMutation,
  archiveProductMutation,
} from '#/lib/queries/products'

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/admin/products/$productId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      productQueryOptions(params.productId),
    )
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

  const [deleteOpen, setDeleteOpen] = useState(false)

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
