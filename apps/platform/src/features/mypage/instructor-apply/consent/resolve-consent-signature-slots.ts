import { isCrimeConsentTemplate } from '@jakorea/form-schema/consent'

export type ConsentSignatureSlot = 'mid' | 'final'

export function resolveConsentSignatureSlots(templateId: string): ConsentSignatureSlot[] {
  if (isCrimeConsentTemplate(templateId)) return []
  if (templateId === 'agreement-third-party') return ['mid', 'final']
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
