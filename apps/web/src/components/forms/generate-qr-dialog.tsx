import { useState, useEffect, useRef } from 'react'
import { QrCode, Loader2, AlertTriangle } from 'lucide-react'
import { generateQrCodes } from '#/lib/queries/qrcodes'
import { toast } from '#/components/ui/toast'

interface GenerateQrDialogProps {
  isOpen: boolean
  onClose: () => void
  batchId: string
  quantity: number
  onSuccess: () => void
}

export function GenerateQrDialog({
  isOpen,
  onClose,
  batchId,
  quantity,
  onSuccess,
}: GenerateQrDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [labelDesign, setLabelDesign] = useState<'plain'>('plain')
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      await generateQrCodes(batchId, labelDesign)
      toast.success('Berhasil men-generate QR codes')
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Gagal men-generate QR codes')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
          disabled={isGenerating}
        >
          ✕
        </button>

        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <QrCode className="size-6 text-primary" />
        </div>
        
        <h3 className="mt-4 text-center text-lg font-semibold font-heading leading-6">
          Generate QR Code
        </h3>
        
        <div className="mt-2 text-center text-sm text-base-content/70">
          <p>
            Anda akan men-generate {quantity.toLocaleString('id-ID')} QR code unik untuk batch ini.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-warning/20 bg-warning/5 p-4 flex items-start gap-3 text-sm text-warning-content/80">
          <AlertTriangle className="size-5 shrink-0 text-warning" />
          <p>
            <strong>Peringatan:</strong> Proses ini tidak dapat dibatalkan.
            Batch akan terkunci (locked) dan Anda tidak dapat lagi mengedit detail batch atau menghapusnya.
          </p>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">Desain Label</label>
          <select
            className="select select-bordered w-full bg-base-200/50"
            value={labelDesign}
            onChange={(e) => setLabelDesign(e.target.value as 'plain')}
            disabled={isGenerating}
          >
            <option value="plain">Polos (Tanpa Branding)</option>
          </select>
        </div>

        <div className="modal-action mt-8 flex justify-end gap-3">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isGenerating}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Sekarang'
            )}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button disabled={isGenerating}>close</button>
      </form>
    </dialog>
  )
}
