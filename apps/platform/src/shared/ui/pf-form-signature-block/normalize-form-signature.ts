import { formatPaddedKoreanSeoulDate } from '../../lib/format-display-date.ts'
import type { ElectronicSignatureResult } from '../pf-electronic-signature-modal'
import type { FormSignatureValue } from './types'

export function normalizeFormSignatureValue(
  value?: string | FormSignatureValue | null
): FormSignatureValue | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    return { dataUrl: value, signedAt: new Date().toISOString() }
  }
  return value.dataUrl ? value : null
}

export function createFormSignatureValue(result: ElectronicSignatureResult): FormSignatureValue {
  return {
    dataUrl: result.dataUrl,
    signedAt: new Date().toISOString(),
    displayName: result.displayName,
    fontStyleCode: result.fontStyleCode,
    mode: result.mode,
  }
}

export function formatFormSignatureDate(value: FormSignatureValue, fallback = new Date()): string {
  const parsed = new Date(value.signedAt)
  const date = Number.isNaN(parsed.getTime()) ? fallback : parsed
  return formatPaddedKoreanSeoulDate(date)
}
