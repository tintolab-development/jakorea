import { isCrimeConsentTemplate } from '@jakorea/form-schema/consent'
import type { FormSignatureValue } from '@/shared/ui/pf-form-signature-block/types'

export type ConsentSignatureSlot = 'mid' | 'final'

export function hasConsentSignatureValue(
  signature: FormSignatureValue | string | undefined,
): boolean {
  if (signature == null) return false
  if (typeof signature === 'string') return signature.trim() !== ''
  return signature.dataUrl.trim() !== ''
}

export function isConsentSignaturesComplete(
  signatures: { mid?: FormSignatureValue | string; final?: FormSignatureValue | string } | undefined,
  slots: ConsentSignatureSlot[],
): boolean {
  return slots.every(slot => hasConsentSignatureValue(signatures?.[slot]))
}

export function resolveConsentSignatureSlots(templateId: string): ConsentSignatureSlot[] {
  if (isCrimeConsentTemplate(templateId)) return []
  if (templateId === 'agreement-third-party' || templateId === 'agreement-receipt-pre-consent') {
    return ['mid', 'final']
  }
  return ['final']
}

export function clearConsentSignatureSlotKeys<T extends { mid?: unknown; final?: unknown }>(
  signatures: T | undefined,
  slots: ConsentSignatureSlot[],
): T {
  const next = { ...(signatures ?? {}) } as T
  for (const slot of slots) {
    delete next[slot]
  }
  return next
}
