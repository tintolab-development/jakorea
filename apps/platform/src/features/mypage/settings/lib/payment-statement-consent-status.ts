import {
  DOCUMENT_CONSENT_ITEMS,
  type SettingsConsentItem,
} from './consent-catalog.ts'
import { isSettingsConsentsMenuPinned } from './settings-consents-menu.ts'

export function isPaymentStatementPreConsentSubmitted(
  documentItems: readonly SettingsConsentItem[],
): boolean {
  return documentItems.some(item => item.id === 'paymentStatement' && item.agreed === true)
}

export function pickPaymentStatementConsentDocumentId(
  documentItems: readonly SettingsConsentItem[],
): number | null {
  const item = documentItems.find(row => row.id === 'paymentStatement' && row.agreed === true)
  const documentId = item?.documentId
  return typeof documentId === 'number' && Number.isFinite(documentId) && documentId > 0
    ? documentId
    : null
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
