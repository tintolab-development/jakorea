import { describe, expect, it } from 'vitest'
import { createEducatorFacilitatorPledgeDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME,
  AGREEMENT_EXPENSE_A4_SECTION_GAP_PX,
  getAgreementExpenseA4DocumentDisplayTitle,
  stripAgreementExpenseAuthoringTitleSuffix,
} from '@/features/template/model/agreement-expense-a4-preview'

describe('agreement-expense A4 preview', () => {
  it('scopes document preview CSS to the agreement-expense body class', () => {
    expect(AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME).toBe(
      'form-document-preview-body--agreement-expense'
    )
  })

  it('uses compact section gap for 1-page layout', () => {
    expect(AGREEMENT_EXPENSE_A4_SECTION_GAP_PX).toBeLessThan(40)
  })

  it('strips (안) from A4 document title only', () => {
    expect(stripAgreementExpenseAuthoringTitleSuffix('JA Korea 교육진행자 서약서(안)')).toBe(
      'JA Korea 교육진행자 서약서'
    )
    const draft = createEducatorFacilitatorPledgeDraft()
    expect(getAgreementExpenseA4DocumentDisplayTitle(draft, 'fallback')).toBe(
      'JA Korea 교육진행자 서약서'
    )
  })
})
