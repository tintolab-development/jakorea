import assert from 'node:assert/strict'
import { resolveInstructorApplyConsentTemplate } from '@jakorea/form-schema/consent'
import { restoreCompatibleConsentDraftValues } from './restore-compatible-consent-draft.ts'

function buildFilledDocument(
  consentKey: 'consentPaymentStatement' | 'consentEducatorPledge' | 'consentReceiptPreConsent',
  state: {
    draft: { schemaVersion: 1; formSettings: { titleNumbering: 'numeric' }; paragraphs: [] }
    paymentBasicInfo?: { nameKo?: string }
    portalDocument?: {
      documentId: number
      templateVersionId?: number | null
      templateCode?: string | null
    }
  },
) {
  const templateCode =
    state.portalDocument?.templateCode?.trim() ||
    (consentKey === 'consentReceiptPreConsent'
      ? 'agreement-receipt-pre-consent'
      : resolveInstructorApplyConsentTemplate(consentKey).templateId)
  const allowPaymentBasicInfo =
    templateCode === 'agreement-third-party' ||
    templateCode === 'document-payment-order-pre-consent' ||
    templateCode === 'agreement-receipt-pre-consent'
  const paymentBasicInfo =
    allowPaymentBasicInfo &&
    state.paymentBasicInfo &&
    Object.keys(state.paymentBasicInfo).length > 0
      ? state.paymentBasicInfo
      : undefined
  return {
    templateVersionId: state.portalDocument?.templateVersionId,
    templateCode,
    schemaJson: state.draft,
    ...(paymentBasicInfo ? { paymentBasicInfo } : {}),
  }
}

function resolveConsentPreviewTemplateId(
  detail: { filledDocument?: { templateCode?: string; templateVersionId?: number | null } | null },
  fallbackTemplateId: string,
): string {
  const submitted = detail.filledDocument?.templateCode?.trim()
  if (submitted) return submitted
  return fallbackTemplateId
}

const state = {
  draft: {
    schemaVersion: 1 as const,
    formSettings: { titleNumbering: 'numeric' as const },
    paragraphs: [] as [],
  },
  paymentBasicInfo: {
    nameKo: '이건희',
  },
  portalDocument: {
    documentId: 123,
    templateVersionId: 64,
    templateCode: 'agreement-third-party',
  },
}

const filledDocument = buildFilledDocument('consentPaymentStatement', state)

assert.equal(filledDocument.templateVersionId, 64)
assert.equal(filledDocument.templateCode, 'agreement-third-party')
assert.deepEqual(filledDocument.schemaJson, state.draft)
assert.equal(filledDocument.paymentBasicInfo?.nameKo, '이건희')

const legacyFilledDocument = buildFilledDocument('consentEducatorPledge', {
  ...state,
  paymentBasicInfo: undefined,
  portalDocument: undefined,
})

assert.equal(legacyFilledDocument.templateVersionId, undefined)
assert.equal(
  legacyFilledDocument.templateCode,
  resolveInstructorApplyConsentTemplate('consentEducatorPledge').templateId,
)

const restored = restoreCompatibleConsentDraftValues(
  {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: 'q1',
        kind: 'single_item',
        variant: 'short_essay',
        paragraphTitle: '이전',
        items: [{ id: 'q1-item', bodyText: '기존 답변' }],
      } as never,
    ],
  },
  {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: 'q1',
        kind: 'single_item',
        variant: 'short_essay',
        paragraphTitle: '최신 제목',
        items: [{ id: 'q1-item', bodyText: '' }],
      } as never,
      {
        id: 'q2',
        kind: 'single_item',
        variant: 'short_essay',
        paragraphTitle: '새 문항',
        items: [],
      } as never,
    ],
  },
)

assert.equal(restored.paragraphs[0]?.paragraphTitle, '최신 제목')
assert.equal(
  (restored.paragraphs[0] as { items?: Array<{ bodyText?: string }> }).items?.[0]?.bodyText,
  '기존 답변',
)
assert.equal(restored.paragraphs[1]?.id, 'q2')

assert.equal(
  resolveConsentPreviewTemplateId(
    { filledDocument: { templateCode: 'agreement-third-party', templateVersionId: 64 } },
    'agreement-portrait',
  ),
  'agreement-third-party',
)
assert.equal(
  resolveConsentPreviewTemplateId({ filledDocument: { templateVersionId: null } }, 'agreement-portrait'),
  'agreement-portrait',
)

const receiptFilled = buildFilledDocument('consentReceiptPreConsent', {
  ...state,
  portalDocument: {
    documentId: 9001,
    templateVersionId: 123,
    templateCode: 'agreement-receipt-pre-consent',
  },
})
assert.equal(receiptFilled.templateCode, 'agreement-receipt-pre-consent')
assert.equal(receiptFilled.templateVersionId, 123)
assert.equal(receiptFilled.paymentBasicInfo?.nameKo, '이건희')

const expenseFilled = buildFilledDocument('consentEducatorPledge', {
  ...state,
  paymentBasicInfo: {},
  portalDocument: {
    documentId: 61,
    templateVersionId: 61,
    templateCode: 'agreement-expense',
  },
})
assert.equal(expenseFilled.templateCode, 'agreement-expense')
assert.equal('paymentBasicInfo' in expenseFilled, false)

console.log('portal-consent-template-version.selfcheck: ok')
