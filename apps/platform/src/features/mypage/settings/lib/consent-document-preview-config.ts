import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import { RECEIPT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/receipt-pre-consent-draft'
import type { SettingsConsentItemId } from './consent-catalog'

export type ConsentDocumentPreviewBodyVariant =
  | 'payment'
  | 'receipt'
  | 'expense'
  | 'notice'
  | 'portrait'
  | 'default'

export type ConsentDocumentPreviewConfig = {
  templateId: string
  a4HiddenParagraphIds: ReadonlySet<string>
  pageBreakBeforeParagraphIds: ReadonlySet<string>
  bodyVariant: ConsentDocumentPreviewBodyVariant
}

const PAYMENT_A4_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-third-party',
  a4HiddenParagraphIds: new Set([PAYMENT_STATEMENT_PRE_CONSENT_IDS.title]),
  pageBreakBeforeParagraphIds: new Set([PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord]),
  bodyVariant: 'payment',
}

const RECEIPT_A4_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-receipt-pre-consent',
  a4HiddenParagraphIds: new Set([RECEIPT_PRE_CONSENT_IDS.title]),
  pageBreakBeforeParagraphIds: new Set([RECEIPT_PRE_CONSENT_IDS.paymentRecord]),
  bodyVariant: 'receipt',
}

const EDUCATOR_A4_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-expense',
  a4HiddenParagraphIds: new Set([EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title]),
  pageBreakBeforeParagraphIds: new Set(),
  bodyVariant: 'expense',
}

const NOTICE_A4_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-notice',
  a4HiddenParagraphIds: new Set([AGREEMENT_NOTICE_PARAGRAPH_IDS.title]),
  pageBreakBeforeParagraphIds: new Set(),
  bodyVariant: 'notice',
}

const PORTRAIT_A4_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-portrait',
  a4HiddenParagraphIds: new Set([AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title]),
  pageBreakBeforeParagraphIds: new Set(),
  bodyVariant: 'portrait',
}

const CRIME_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-crime',
  a4HiddenParagraphIds: new Set(),
  pageBreakBeforeParagraphIds: new Set(),
  bodyVariant: 'default',
}

const PREVIEW_CONFIG_BY_ITEM_ID: Partial<Record<SettingsConsentItemId, ConsentDocumentPreviewConfig>> =
  {
    portrait: PORTRAIT_A4_CONFIG,
    paymentStatement: PAYMENT_A4_CONFIG,
    receiptPreConsent: RECEIPT_A4_CONFIG,
    educatorPledge: EDUCATOR_A4_CONFIG,
    administrativeJoint: NOTICE_A4_CONFIG,
    sexOffenseCheck: CRIME_CONFIG,
  }

export function resolveConsentDocumentPreviewConfig(
  itemId: SettingsConsentItemId,
): ConsentDocumentPreviewConfig | null {
  return PREVIEW_CONFIG_BY_ITEM_ID[itemId] ?? null
}

export function buildConsentDocumentPreviewHeaderTitle(itemTitle: string): string {
  return `${itemTitle} 미리보기`
}

/** CMS A4 문서 제목 — 시드 `(안)` 접미만 제거(목록·API 명은 유지) */
export function stripAgreementExpenseAuthoringTitleSuffix(title: string): string {
  const trimmed = title.trim()
  const without = trimmed.replace(/\(안\)/gu, '').replace(/\s+/g, ' ').trim()
  return without.length > 0 ? without : trimmed
}

export function resolveConsentDocumentA4Title(templateId: string, title: string): string {
  if (templateId === 'agreement-expense') {
    return stripAgreementExpenseAuthoringTitleSuffix(title)
  }
  return title
}

export function resolveConsentDocumentPreviewBodyVariant(
  templateId: string | undefined,
): ConsentDocumentPreviewBodyVariant {
  if (templateId === 'agreement-third-party') return 'payment'
  if (templateId === 'agreement-receipt-pre-consent') return 'receipt'
  if (templateId === 'agreement-expense') return 'expense'
  if (templateId === 'agreement-notice') return 'notice'
  if (templateId === 'agreement-portrait') return 'portrait'
  return 'default'
}
