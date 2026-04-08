import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { PageHeader } from '#/components/layout/page-header'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { ProductForm } from '#/components/forms/product-form'
import type { ProductFormValues } from '#/components/forms/product-form'
import { createProductMutation } from '#/lib/queries/products'
import { uploadProductPhoto } from '#/lib/upload'
import { toast } from '#/components/ui/toast'
import { ApiError } from '#/lib/api'

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/admin/products/new')({
  head: () => ({
    meta: [{ title: 'Tambah Produk — Proofly Admin' }],
  }),

  component: CreateProductPage,
})

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function CreateProductPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(values: ProductFormValues, photoFile: File | null) {
    setIsSubmitting(true)

    try {
      let photoUrl: string | undefined

      // Upload photo to R2 if present
      if (photoFile) {
        photoUrl = await uploadProductPhoto(photoFile)
      }

      // Create product
      const result = await createProductMutation({
        ...values,
        photo_url: photoUrl,
      })

      // Invalidate cache + navigate
      await queryClient.invalidateQueries({ queryKey: ['products'] })

      toast.success('Produk berhasil ditambahkan')
      navigate({
        to: '/admin/products/$productId',
        params: { productId: result.data.id },
      })
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Gagal menambahkan produk. Silakan coba lagi.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Produk', href: '/admin/products' },
          { label: 'Tambah Produk' },
        ]}
      />
      <PageHeader
        title="Tambah Produk"
        description="Buat produk baru untuk mulai membuat batch dan QR code."
      />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-base-200 bg-base-100 p-6">
          <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </div>
    </>
  )
}
