import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { PageHeader } from '#/components/layout/page-header'
import { Breadcrumbs } from '#/components/ui/breadcrumbs'
import { PageSkeleton } from '#/components/ui/skeleton'
import { BatchForm } from '#/components/forms/batch-form'
import type { BatchFormValues } from '#/components/forms/batch-form'
import { batchQueryOptions, updateBatchMutation } from '#/lib/queries/batches'
import { toast } from '#/components/ui/toast'
import { ApiError } from '#/lib/api'

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/admin/batches/$batchId_/edit')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      batchQueryOptions(params.batchId),
    )
  },

  head: () => ({
    meta: [{ title: 'Edit Batch — Proofly Admin' }],
  }),

  component: EditBatchPage,
  pendingComponent: () => <PageSkeleton />,
})

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function EditBatchPage() {
  const { batchId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useSuspenseQuery(batchQueryOptions(batchId))
  const batch = data.data
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(values: BatchFormValues) {
    setIsSubmitting(true)

    try {
      // Build update payload (only send changed fields)
      const payload: Record<string, string | number> = {}

      if (values.batch_number !== batch.batch_number)
        payload.batch_number = values.batch_number
      if (values.quantity !== batch.quantity)
        payload.quantity = values.quantity
      if (values.production_date !== batch.production_date)
        payload.production_date = values.production_date
      if (values.expiry_date !== batch.expiry_date)
        payload.expiry_date = values.expiry_date

      // Only call API if something changed
      if (Object.keys(payload).length > 0) {
        await updateBatchMutation(batchId, payload)
      }

      // Invalidate cache + navigate
      await queryClient.invalidateQueries({ queryKey: ['batches'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })

      toast.success('Batch berhasil diperbarui')
      navigate({
        to: '/admin/batches/$batchId',
        params: { batchId },
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Batch sudah terkunci dan tidak dapat diubah')
      } else {
        toast.error(
          err instanceof ApiError ? err.message : 'Gagal memperbarui batch',
        )
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
          {
            label: batch.product_name ?? 'Produk',
            href: `/admin/products/${batch.product_id}`,
          },
          {
            label: batch.batch_number,
            href: `/admin/batches/${batchId}`,
          },
          { label: 'Edit' },
        ]}
      />
      <PageHeader
        title="Edit Batch"
        description={`Memperbarui data batch "${batch.batch_number}".`}
      />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-base-200 bg-base-100 p-6">
          <BatchForm
            defaultValues={{
              batch_number: batch.batch_number,
              quantity: batch.quantity,
              production_date: batch.production_date,
              expiry_date: batch.expiry_date,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isLocked={batch.is_locked}
          />
        </div>
      </div>
    </>
  )
}
