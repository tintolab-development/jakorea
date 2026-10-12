import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import type { SettingsConsentItemId } from './consent-catalog'

export type ConsentDocumentPreviewConfig = {
  templateId: string
  a4HiddenParagraphIds: ReadonlySet<string>
  pageBreakBeforeParagraphIds: ReadonlySet<string>
}

const PAYMENT_A4_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-third-party',
  a4HiddenParagraphIds: new Set([PAYMENT_STATEMENT_PRE_CONSENT_IDS.title]),
  pageBreakBeforeParagraphIds: new Set([PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine]),
}

const EDUCATOR_A4_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-expense',
  a4HiddenParagraphIds: new Set([EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title]),
  pageBreakBeforeParagraphIds: new Set(),
}

const NOTICE_A4_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-notice',
  a4HiddenParagraphIds: new Set([AGREEMENT_NOTICE_PARAGRAPH_IDS.title]),
  pageBreakBeforeParagraphIds: new Set(),
}

const PORTRAIT_A4_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-portrait',
  a4HiddenParagraphIds: new Set([AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title]),
  /** 단락(표)마다 끊지 않음 — CMS는 높이 측정 분할, Platform은 1장 연속(필요 시 추후 pagination) */
  pageBreakBeforeParagraphIds: new Set(),
}

const CRIME_CONFIG: ConsentDocumentPreviewConfig = {
  templateId: 'agreement-crime',
  a4HiddenParagraphIds: new Set(),
  pageBreakBeforeParagraphIds: new Set(),
}

const PREVIEW_CONFIG_BY_ITEM_ID: Partial<Record<SettingsConsentItemId, ConsentDocumentPreviewConfig>> =
  {
    portrait: PORTRAIT_A4_CONFIG,
    paymentStatement: PAYMENT_A4_CONFIG,
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
