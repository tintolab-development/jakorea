import type { SettingsConsentItem } from '../../../settings/lib/consent-catalog.ts'

export function isReceiptPreConsentSubmitted(
  documentItems: readonly SettingsConsentItem[],
): boolean {
  return documentItems.some(
    item => item.id === 'receiptPreConsent' && item.agreed === true && item.signed === true,
  )
}

export function pickReceiptPreConsentDocumentId(
  documentItems: readonly SettingsConsentItem[],
): number | null {
  const item = documentItems.find(
    row => row.id === 'receiptPreConsent' && row.agreed === true && row.signed === true,
  )
  const documentId = item?.documentId
  return typeof documentId === 'number' && Number.isFinite(documentId) && documentId > 0
    ? documentId
    : null
}
