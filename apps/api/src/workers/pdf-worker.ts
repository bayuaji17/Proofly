import * as jobQueries from '../db/queries/jobs.js'
import * as batchQueries from '../db/queries/batches.js'
import * as pdfService from '../services/pdf.service.js'
import * as storageService from '../services/storage.service.js'

const WORKER_INTERVAL_MS = 5000

/**
 * Background worker that polls `job_queue` for pending PDF generation jobs.
 * Runs in the same process as the API server.
 */
export function startPdfWorker(intervalMs = WORKER_INTERVAL_MS): NodeJS.Timeout {
  console.log(`📄 PDF Worker started (polling every ${intervalMs / 1000}s)`)

  const timer = setInterval(async () => {
    try {
      const job = await jobQueries.claimNextJob('generate_pdf')
      if (!job) return // No pending jobs

      const batchId = job.payload.batch_id as string
      console.log(`📄 Processing PDF job ${job.id} for batch ${batchId} (attempt ${job.attempts})`)

      try {
        // 1. Build PDF in memory
        const pdfBuffer = await pdfService.generatePdf(batchId)

        // 2. Upload to R2
        const key = `pdfs/${batchId}/qrcodes.pdf`
        await storageService.uploadBuffer(key, pdfBuffer, 'application/pdf')

        // 3. Get public URL and update batch
        const publicUrl = storageService.getPublicUrl(key)
        await batchQueries.updatePdfStatus(batchId, 'completed', publicUrl)

        // 4. Mark job as completed
        await jobQueries.completeJob(job.id)

        console.log(`✅ PDF generated and uploaded for batch ${batchId} → ${publicUrl}`)
      } catch (err: any) {
        console.error(`❌ PDF generation failed for batch ${batchId}:`, err.message)

        // Mark job as failed (will retry if attempts < max_attempts)
        const updatedJob = await jobQueries.failJob(job.id, err.message)

        // If all retries exhausted, mark batch as failed
        if (updatedJob.status === 'failed') {
          await batchQueries.updatePdfStatus(batchId, 'failed')
          console.error(`⛔ All retries exhausted for batch ${batchId}. Marked as failed.`)
        }
      }
    } catch (err: any) {
      // Catch errors from claimNextJob itself (e.g. DB connection issues)
      console.error('❌ PDF Worker polling error:', err.message)
    }
  }, intervalMs)

  return timer
}
