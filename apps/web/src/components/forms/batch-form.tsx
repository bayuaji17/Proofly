import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Loader2, Lock } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BatchFormValues {
  batch_number: string
  quantity: number
  production_date: string
  expiry_date: string
}

interface BatchFormProps {
  defaultValues?: Partial<BatchFormValues>
  onSubmit: (values: BatchFormValues) => Promise<void>
  isSubmitting?: boolean
  isLocked?: boolean
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BatchForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  isLocked = false,
}: BatchFormProps) {
  const form = useForm({
    defaultValues: {
      batch_number: defaultValues?.batch_number ?? '',
      quantity: defaultValues?.quantity ?? 1,
      production_date: defaultValues?.production_date ?? '',
      expiry_date: defaultValues?.expiry_date ?? '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  const disabled = isSubmitting || isLocked

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-5"
    >
      {/* Locked Banner */}
      {isLocked && (
        <div className="flex items-center gap-3 rounded-lg bg-warning/10 border border-warning/20 px-4 py-3 text-sm text-warning">
          <Lock className="size-4 shrink-0" />
          Batch sudah terkunci dan tidak dapat diubah.
        </div>
      )}

      {/* Batch Number */}
      <form.Field
        name="batch_number"
        validators={{
          onChangeListenTo: ['batch_number'],
          onChange: z
            .string()
            .min(1, 'Batch number wajib diisi')
            .max(255, 'Batch number maksimal 255 karakter'),
        }}
        children={(field) => (
          <div className="form-control w-full">
            <label htmlFor={field.name} className="label">
              <span className="label-text font-medium">Batch Number</span>
            </label>
            <input
              id={field.name}
              type="text"
              placeholder="Contoh: BATCH-2026-001"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={disabled}
              className="input input-bordered w-full"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-error">
                {field.state.meta.errors
                  .map((err) => (typeof err === 'string' ? err : err?.message ?? ''))
                  .join(', ')}
              </p>
            )}
          </div>
        )}
      />

      {/* Quantity */}
      <form.Field
        name="quantity"
        validators={{
          onChangeListenTo: ['quantity'],
          onChange: z
            .number()
            .int('Quantity harus bilangan bulat')
            .min(1, 'Quantity minimal 1')
            .max(100000, 'Quantity maksimal 100.000'),
        }}
        children={(field) => (
          <div className="form-control w-full">
            <label htmlFor={field.name} className="label">
              <span className="label-text font-medium">Quantity</span>
            </label>
            <input
              id={field.name}
              type="number"
              min={1}
              max={100000}
              placeholder="Jumlah unit"
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
              onBlur={field.handleBlur}
              disabled={disabled}
              className="input input-bordered w-full"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-error">
                {field.state.meta.errors
                  .map((err) => (typeof err === 'string' ? err : err?.message ?? ''))
                  .join(', ')}
              </p>
            )}
          </div>
        )}
      />

      {/* Production Date */}
      <form.Field
        name="production_date"
        validators={{
          onChangeListenTo: ['production_date'],
          onChange: z.string().min(1, 'Tanggal produksi wajib diisi'),
        }}
        children={(field) => (
          <div className="form-control w-full">
            <label htmlFor={field.name} className="label">
              <span className="label-text font-medium">Tanggal Produksi</span>
            </label>
            <input
              id={field.name}
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={disabled}
              className="input input-bordered w-full"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-error">
                {field.state.meta.errors
                  .map((err) => (typeof err === 'string' ? err : err?.message ?? ''))
                  .join(', ')}
              </p>
            )}
          </div>
        )}
      />

      {/* Expiry Date */}
      <form.Field
        name="expiry_date"
        validators={{
          onChangeListenTo: ['expiry_date'],
          onChange: z.string().min(1, 'Tanggal kadaluarsa wajib diisi'),
        }}
        children={(field) => (
          <div className="form-control w-full">
            <label htmlFor={field.name} className="label">
              <span className="label-text font-medium">Tanggal Kadaluarsa</span>
            </label>
            <input
              id={field.name}
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={disabled}
              className="input input-bordered w-full"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-error">
                {field.state.meta.errors
                  .map((err) => (typeof err === 'string' ? err : err?.message ?? ''))
                  .join(', ')}
              </p>
            )}
          </div>
        )}
      />

      {/* Submit */}
      {!isLocked && (
        <div className="flex gap-3 pt-2">
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isValid: state.isValid,
            })}
            children={({ canSubmit, isValid }) => (
              <button
                type="submit"
                disabled={isSubmitting || !canSubmit || !isValid}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : defaultValues ? (
                  'Simpan Perubahan'
                ) : (
                  'Tambah Batch'
                )}
              </button>
            )}
          />
        </div>
      )}
    </form>
  )
}
