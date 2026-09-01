import { describe, expect, it } from 'vitest'
import { normalizeWritingFormDraftFromApi } from '@/features/template/lib/form-template-seed-registry'
import { createPaymentStatementIssuanceDraft } from '@/features/template/model/payment-statement-issuance-draft'
import { normalizeWritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

const EMPTY_DRAFT = normalizeWritingFormDraft({
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [],
})

describe('normalizeWritingFormDraftFromApi', () => {
  it('does not seed-fill empty paragraphs for certificate Payload D codes', () => {
    const next = normalizeWritingFormDraftFromApi('document-3', EMPTY_DRAFT)
    expect(next.paragraphs).toHaveLength(0)
  })

  it('seed-fills empty paragraphs for Payload A issuance codes', () => {
    const next = normalizeWritingFormDraftFromApi('document-payment-order-issue', EMPTY_DRAFT)
    expect(next.paragraphs.length).toBeGreaterThan(0)
  })

  it('preserves non-empty paragraphs from API', () => {
    const seed = createPaymentStatementIssuanceDraft()
    const fromApi = normalizeWritingFormDraft({
      ...seed,
      paragraphs: [seed.paragraphs[0]!],
    })
    const next = normalizeWritingFormDraftFromApi('document-payment-order-issue', fromApi)
    expect(next.paragraphs).toHaveLength(1)
    expect(next.paragraphs[0]?.id).toBe(seed.paragraphs[0]?.id)
  })
})
