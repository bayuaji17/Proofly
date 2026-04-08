import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useState, useRef } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { validateImageFile } from '#/lib/upload'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProductFormValues {
  name: string
  category: string
  description: string
}

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues> & { photo_url?: string | null }
  onSubmit: (values: ProductFormValues, photoFile: File | null) => Promise<void>
  isSubmitting?: boolean
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: ProductFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    defaultValues?.photo_url ?? null,
  )
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? '',
      category: defaultValues?.category ?? '',
      description: defaultValues?.description ?? '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value, photoFile)
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const error = validateImageFile(file)
    if (error) {
      setPhotoError(error)
      return
    }

    setPhotoError(null)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-6"
    >
      {/* Name */}
      <form.Field
        name="name"
        validators={{
          onChangeListenTo: ['name'],
          onChange: z
            .string()
            .min(3, 'Nama produk minimal 3 karakter')
            .max(255, 'Nama produk maksimal 255 karakter'),
        }}
        children={(field) => (
          <div className="form-control w-full">
            <label htmlFor={field.name} className="label">
              <span className="label-text font-medium">Nama Produk</span>
            </label>
            <input
              id={field.name}
              type="text"
              placeholder="Contoh: Minyak Goreng Premium"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={isSubmitting}
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

      {/* Category */}
      <form.Field
        name="category"
        validators={{
          onChangeListenTo: ['category'],
          onChange: z
            .string()
            .min(1, 'Kategori wajib diisi')
            .max(255, 'Kategori maksimal 255 karakter'),
        }}
        children={(field) => (
          <div className="form-control w-full">
            <label htmlFor={field.name} className="label">
              <span className="label-text font-medium">Kategori</span>
            </label>
            <input
              id={field.name}
              type="text"
              placeholder="Contoh: Makanan, Elektronik, Kosmetik"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={isSubmitting}
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

      {/* Description */}
      <form.Field
        name="description"
        validators={{
          onChangeListenTo: ['description'],
          onChange: z.string().min(10, 'Deskripsi minimal 10 karakter'),
        }}
        children={(field) => (
          <div className="form-control w-full">
            <label htmlFor={field.name} className="label">
              <span className="label-text font-medium">Deskripsi</span>
            </label>
            <textarea
              id={field.name}
              placeholder="Jelaskan detail produk..."
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={isSubmitting}
              rows={4}
              className="textarea textarea-bordered w-full"
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

      {/* Photo Upload */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-medium">Foto Produk</span>
          <span className="label-text-alt text-base-content/50">
            JPG, PNG, atau WebP (maks. 5MB)
          </span>
        </label>

        {photoPreview ? (
          <div className="relative w-full max-w-xs">
            <img
              src={photoPreview}
              alt="Preview"
              className="h-48 w-full rounded-lg border border-base-300 object-cover"
            />
            <button
              type="button"
              onClick={removePhoto}
              disabled={isSubmitting}
              className="btn btn-circle btn-error btn-xs absolute right-2 top-2"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="flex h-48 w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-base-300 bg-base-200/50 transition-colors hover:border-primary hover:bg-primary/5"
          >
            <ImagePlus className="size-8 text-base-content/40" />
            <span className="text-sm text-base-content/60">Pilih foto produk</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {photoError && <p className="mt-1 text-xs text-error">{photoError}</p>}
      </div>

      {/* Submit */}
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
                'Tambah Produk'
              )}
            </button>
          )}
        />
      </div>
    </form>
  )
}
