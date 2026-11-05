import {
  DOCUMENT_CONSENT_ITEMS,
  type SettingsConsentItem,
} from './consent-catalog.ts'
import { readPortalConsentDocumentId } from './map-consents.ts'
import { isSettingsConsentsMenuPinned } from './settings-consents-menu.ts'

export function isPaymentStatementPreConsentSubmitted(
  documentItems: readonly SettingsConsentItem[],
): boolean {
  return documentItems.some(item => item.id === 'paymentStatement' && item.agreed === true)
}

export function pickPaymentStatementConsentDocumentId(
  documentItems: readonly SettingsConsentItem[],
): number | null {
  const rows = documentItems.filter(row => row.id === 'paymentStatement')
  const submitted = rows.find(
    row => (row.agreed === true || row.signed === true) && readPortalConsentDocumentId(row.documentId) != null,
  )
  return (
    readPortalConsentDocumentId(submitted?.documentId) ??
    readPortalConsentDocumentId(rows.find(row => readPortalConsentDocumentId(row.documentId) != null)?.documentId) ??
    null
  )
}

export function ensurePinnedPaymentStatementConsentItem(
  documentItems: readonly SettingsConsentItem[],
): SettingsConsentItem[] {
  if (documentItems.some(item => item.id === 'paymentStatement')) {
    return [...documentItems]
  }
  if (!isSettingsConsentsMenuPinned()) return [...documentItems]
  const catalog = DOCUMENT_CONSENT_ITEMS.find(item => item.id === 'paymentStatement')
  return catalog ? [catalog, ...documentItems] : [...documentItems]
}
