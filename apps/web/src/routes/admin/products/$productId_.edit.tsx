import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { PageHeader } from '#/components/layout/page-header'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { PageSkeleton } from '#/components/ui/skeleton'
import { ProductForm } from '#/components/forms/product-form'
import type { ProductFormValues } from '#/components/forms/product-form'
import { productQueryOptions, updateProductMutation } from '#/lib/queries/products'
import { uploadProductPhoto } from '#/lib/upload'
import { toast } from '#/components/ui/toast'
import { ApiError } from '#/lib/api'

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/admin/products/$productId_/edit')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      productQueryOptions(params.productId),
    )
  },

  head: () => ({
    meta: [{ title: 'Edit Produk — Proofly Admin' }],
  }),

  component: EditProductPage,
  pendingComponent: () => <PageSkeleton />,
})

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function EditProductPage() {
  const { productId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useSuspenseQuery(productQueryOptions(productId))
  const product = data.data
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(values: ProductFormValues, photoFile: File | null) {
    setIsSubmitting(true)

    try {
      let photoUrl: string | undefined

      // Upload new photo to R2 if changed
      if (photoFile) {
        photoUrl = await uploadProductPhoto(photoFile)
      }

      // Build update payload (only send changed fields)
      const payload: Record<string, string | undefined> = {}

      if (values.name !== product.name) payload.name = values.name
      if (values.category !== product.category) payload.category = values.category
      if (values.description !== product.description) payload.description = values.description
      if (photoUrl) payload.photo_url = photoUrl

      // Only call API if something changed
      if (Object.keys(payload).length > 0) {
        await updateProductMutation(productId, payload)
      }

      // Invalidate cache + navigate
      await queryClient.invalidateQueries({ queryKey: ['products'] })

      toast.success('Produk berhasil diperbarui')
      navigate({
        to: '/admin/products/$productId',
        params: { productId },
      })
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Gagal memperbarui produk. Silakan coba lagi.')
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
          { label: product.name, href: `/admin/products/${productId}` },
          { label: 'Edit' },
        ]}
      />
      <PageHeader
        title="Edit Produk"
        description={`Memperbarui data "${product.name}".`}
      />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-base-200 bg-base-100 p-6">
          <ProductForm
            defaultValues={{
              name: product.name,
              category: product.category,
              description: product.description,
              photo_url: product.photo_url,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </>
  )
}
