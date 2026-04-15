import * as qrcodeQueries from '../db/queries/qrcodes.js'
import * as scanLogQueries from '../db/queries/scan-logs.js'
import * as notificationQueries from '../db/queries/notifications.js'
import { MAX_SCAN_LIMIT } from '../constants.js'

/**
 * Normalize serial number: uppercase, strip dashes and spaces
 */
function normalizeSerialNumber(sn: string): string {
  return sn.toUpperCase().replace(/[-\s]/g, '')
}

/**
 * Format normalized serial back to XXXX-XXXX-XXXX display format
 */
function formatSerial(sn: string): string {
  if (sn.length === 12) {
    return `${sn.slice(0, 4)}-${sn.slice(4, 8)}-${sn.slice(8, 12)}`
  }
  return sn
}

export async function verifySerialNumber(input: {
  serial_number: string
  latitude?: number
  longitude?: number
  accuracy?: number
  user_agent?: string
  ip_address?: string
}) {
  // 1. Normalize serial number
  const normalized = normalizeSerialNumber(input.serial_number)
  const formatted = formatSerial(normalized)

  // 2. Lookup in database
  const qrRecord = await qrcodeQueries.findBySerialNumber(formatted)

  if (!qrRecord) {
    return { status: 'not_found' as const }
  }

  // 3. Determine new status based on scan count
  const currentScanCount = qrRecord.scan_count
  const isCounterfeit = currentScanCount >= MAX_SCAN_LIMIT
  const newStatus = isCounterfeit ? 'counterfeit' : 'genuine'

  // 4. Increment scan count + update status
  const updated = await qrcodeQueries.incrementScanCount(qrRecord.id, newStatus)

  // 5. Insert scan log
  await scanLogQueries.create({
    qr_code_id: qrRecord.id,
    latitude: input.latitude,
    longitude: input.longitude,
    user_agent: input.user_agent,
    ip_address: input.ip_address
  })

  // 6. Get previous scans
  const previousScans = await scanLogQueries.findByQrCodeId(qrRecord.id)

  // 7. If counterfeit, create notification for admin
  if (isCounterfeit) {
    try {
      await notificationQueries.create({
        admin_id: qrRecord.admin_id,
        type: 'suspicious_scan',
        title: 'Potensi Pemalsuan Terdeteksi',
        message: `Serial number ${formatted} telah di-scan ${updated.scan_count} kali (melebihi batas ${MAX_SCAN_LIMIT}). Produk: ${qrRecord.product_name}.`,
        reference_id: qrRecord.id
      })
    } catch {
      // Non-critical: don't fail verification if notification fails
    }
  }

  // 8. Build response
  const response: any = {
    status: newStatus,
    scan_number: updated.scan_count,
    max_scan: MAX_SCAN_LIMIT,
    product: {
      name: qrRecord.product_name,
      category: qrRecord.product_category,
      photo_url: qrRecord.product_photo_url
    },
    batch: {
      batch_number: qrRecord.batch_number,
      production_date: qrRecord.production_date,
      expiry_date: qrRecord.expiry_date
    },
    previous_scans: previousScans.map((s) => ({
      scanned_at: s.scanned_at,
      ip_address: s.ip_address,
      city: s.city,
      country: s.country
    }))
  }

  if (isCounterfeit) {
    response.message = `Produk ini telah di-scan melebihi batas wajar (${MAX_SCAN_LIMIT}x). Kemungkinan produk palsu.`
  }

  return response
}
