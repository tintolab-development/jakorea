import { describe, expect, it } from 'vitest'
import { createAgreementPortraitDraft } from '@/features/template/model/writing-form-draft.schema'
import { normalizeMemberConsentWriteDraft } from '@/features/user/shared/lib/normalize-member-consent-write-draft'

describe('buildMemberConsentContextFromUser', () => {
  it('is retained for legacy view helpers only — write flow does not prefill from context', () => {
    const draft = normalizeMemberConsentWriteDraft(
      createAgreementPortraitDraft(),
      'agreement-portrait'
    )
    const table = draft.paragraphs.find(p => p.id === 'agreement-portrait-personal-consent-table')
    expect(table?.kind === 'single_item' && table.variant === 'vertical_table' && table.rows[0]?.cells).toEqual([
      '',
      '',
    ])
  })
})
