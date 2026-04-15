import { randomBytes } from 'crypto'
import { SERIAL_NUMBER_CHARSET } from '../constants.js'

/**
 * Generate a single serial number in format XXXX-XXXX-XXXX
 * Uses crypto.randomBytes() for cryptographically secure randomness
 */
export function generateSerialNumber(): string {
  const bytes = randomBytes(12)
  const chars: string[] = []

  for (let i = 0; i < 12; i++) {
    chars.push(SERIAL_NUMBER_CHARSET[bytes[i] % SERIAL_NUMBER_CHARSET.length])
  }

  return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}`
}

/**
 * Generate multiple unique serial numbers with internal deduplication
 */
export function generateBulkSerialNumbers(count: number): string[] {
  const serials = new Set<string>()

  while (serials.size < count) {
    serials.add(generateSerialNumber())
  }

  return Array.from(serials)
}
