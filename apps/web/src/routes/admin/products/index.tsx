import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Plus, Search, Package } from 'lucide-react'
import { useState, useEffect } from 'react'

import { PageHeader } from '#/components/layout/page-header'
import { PageSkeleton } from '#/components/ui/skeleton'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { Pagination } from '#/components/ui/pagination'
import { productsQueryOptions } from '#/lib/queries/products'
import type { Product } from '#/types/models'

/* ------------------------------------------------------------------ */
/*  Search Params                                                      */
/* ------------------------------------------------------------------ */

const productSearchSchema = z.object({
  is_active: z.string().optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
  page_size: z.number().optional().default(20),
})

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/admin/products/')({
  validateSearch: productSearchSchema,

  loaderDeps: ({ search }) => search,

  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(productsQueryOptions(deps))
  },

  head: () => ({
    meta: [{ title: 'Produk — Proofly Admin' }],
  }),

  component: ProductListPage,
  pendingComponent: () => <PageSkeleton />,
})

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function ProductListPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const { data } = useSuspenseQuery(productsQueryOptions(search))

  const [searchInput, setSearchInput] = useState(search.search ?? '')

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        to: '.',
        search: (prev) => ({
          ...prev,
          search: searchInput || undefined,
          page: 1,
        }),
        replace: true,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, navigate])

  const activeFilter = search.is_active

  function setFilter(filter: string | undefined) {
    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        is_active: filter,
        page: 1,
      }),
      replace: true,
    })
  }

  const totalPages = Math.ceil(data.total / (search.page_size ?? 5))

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Produk' },
        ]}
      />
      <PageHeader title="Produk" description="Kelola semua produk Anda.">
        <Link to="/admin/products/new" className="btn btn-primary btn-sm gap-1">
          <Plus className="size-4" />
          Tambah Produk
        </Link>
      </PageHeader>

      {/* Filters + Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div role="tablist" className="tabs tabs-box tabs-sm font-heading">
          <button
            role="tab"
            className={`tab ${activeFilter === undefined ? 'tab-active' : ''}`}
            onClick={() => setFilter(undefined)}
          >
            Semua
          </button>
          <button
            role="tab"
            className={`tab ${activeFilter === 'true' ? 'tab-active' : ''}`}
            onClick={() => setFilter('true')}
          >
            Aktif
          </button>
          <button
            role="tab"
            className={`tab ${activeFilter === 'false' ? 'tab-active' : ''}`}
            onClick={() => setFilter('false')}
          >
            Arsip
          </button>
        </div>

        {/* Search & Page Size */}
        <div className="flex w-full sm:w-auto items-center gap-2">
          <label className="input input-bordered input-sm flex grow sm:w-64 items-center gap-2">
            <Search className="size-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="grow"
            />
          </label>
          <select
            className="select select-bordered select-sm font-sans"
            value={search.page_size ?? 20}
            onChange={(e) => {
              navigate({
                to: '.',
                search: (prev) => ({
                  ...prev,
                  page_size: Number(e.target.value),
                  page: 1,
                }),
                replace: true,
              })
            }}
          >
            <option value={10}>10 Baris</option>
            <option value={20}>20 Baris</option>
            <option value={50}>50 Baris</option>
            <option value={100}>100 Baris</option>
          </select>
        </div>
      </div>

      {/* Product List Area */}
      {data.data.length === 0 ? (
        <EmptyState hasFilters={!!search.search || !!search.is_active} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-200 bg-base-100 shadow-sm">
          <table className="table w-full">
            <thead className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase tracking-wider text-base-content/60 font-heading">
              <tr>
                <th className="px-5 py-4">Produk</th>
                <th className="px-5 py-4">Kategori</th>
                <th className="px-5 py-4 text-center">Batch</th>
                <th className="px-5 py-4 text-center">QR Code</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200/50 font-sans">
              {data.data.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination - Selalu di-render tanpa conditional block */}
      <Pagination
        currentPage={search.page ?? 1}
        totalPages={totalPages}
        totalItems={data.total}
        currentCount={data.data.length}
        itemName="produk"
        onPageChange={(p) =>
          navigate({
            to: '.',
            search: (prev) => ({ ...prev, page: p }),
            replace: true,
          })
        }
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ProductRow({ product }: { product: Product }) {
  return (
    <tr className="group border-b-0 transition-colors duration-200 hover:bg-primary/5">
      <td className="px-5 py-3">
        <Link
          to="/admin/products/$productId"
          params={{ productId: product.id }}
          className="flex items-center gap-4"
        >
          {product.photo_url ? (
            <img
              src={product.photo_url}
              alt={product.name}
              className="size-11 rounded-lg object-cover border border-base-200 shadow-sm transition-colors group-hover:border-primary/20"
            />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-lg border border-base-200 bg-base-100 shadow-sm transition-colors group-hover:border-primary/20">
              <Package className="size-5 text-base-content/30" />
            </div>
          )}
          <span className="text-sm font-semibold text-base-content transition-colors group-hover:text-primary">
            {product.name}
          </span>
        </Link>
      </td>
      <td className="px-5 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-base-content/50">
          {product.category}
        </span>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="text-sm font-medium text-base-content/80">
          {product.batch_count ?? 0}
        </span>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="text-sm font-medium text-base-content/80">
          {product.qr_code_count ?? 0}
        </span>
      </td>
      <td className="px-5 py-3">
        {product.is_active ? (
          <div className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
            Aktif
          </div>
        ) : (
          <div className="inline-flex items-center rounded-full bg-base-300/50 px-2.5 py-1 text-xs font-medium text-base-content/70">
            Arsip
          </div>
        )}
      </td>
    </tr>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-base-300 py-16">
      <Package className="size-12 text-base-content/20 mb-4" />
      <h3 className="text-lg font-semibold text-base-content/60">
        {hasFilters ? 'Tidak ada produk ditemukan' : 'Belum ada produk'}
      </h3>
      <p className="mt-1 text-sm text-base-content/40">
        {hasFilters
          ? 'Coba ubah filter atau kata kunci pencarian.'
          : 'Mulai dengan menambahkan produk pertama Anda.'}
      </p>
      {!hasFilters && (
        <Link to="/admin/products/new" className="btn btn-primary btn-sm mt-4 gap-1">
          <Plus className="size-4" />
          Tambah Produk
        </Link>
      )}
    </div>
  )
}
