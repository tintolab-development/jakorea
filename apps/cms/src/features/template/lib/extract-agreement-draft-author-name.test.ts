import { describe, expect, it } from 'vitest'
import {
  AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER,
  extractAgreementDraftAuthorName,
  resolveAgreementUserModeAuthorDisplayName,
} from '@/features/template/lib/extract-agreement-draft-author-name'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  normalizeWritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

describe('resolveAgreementUserModeAuthorDisplayName', () => {
  it('returns (작성자) when empty', () => {
    expect(resolveAgreementUserModeAuthorDisplayName('')).toBe(AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER)
    expect(resolveAgreementUserModeAuthorDisplayName('   ')).toBe(
      AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER
    )
  })

  it('returns trimmed name when present', () => {
    expect(resolveAgreementUserModeAuthorDisplayName(' 김철수 ')).toBe('김철수')
  })
})

describe('extractAgreementDraftAuthorName', () => {
  it('reads portrait personal consent name cell', () => {
    const draft = normalizeWritingFormDraft(createAgreementPortraitDraft())
    const next = {
      ...draft,
      paragraphs: draft.paragraphs.map(paragraph => {
        if (paragraph.id !== AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable) {
          return paragraph
        }
        if (paragraph.kind !== 'single_item' || paragraph.variant !== 'vertical_table') {
          return paragraph
        }
        const rows = [...paragraph.rows]
        const first = rows[0]
        if (first == null || first.stageCount !== 2) return paragraph
        rows[0] = {
          ...first,
          cells: ['박작성', first.cells[1] ?? ''],
        }
        return { ...paragraph, rows }
      }),
    }
    expect(extractAgreementDraftAuthorName('agreement-portrait', next)).toBe('박작성')
  })

  it('treats portrait legacy placeholder as empty', () => {
    const draft = normalizeWritingFormDraft(createAgreementPortraitDraft())
    expect(extractAgreementDraftAuthorName('agreement-portrait', draft)).toBe('')
  })

  it('reads notice subject name item', () => {
    const draft = normalizeWritingFormDraft(createAgreementNoticeDraft())
    const next = {
      ...draft,
      paragraphs: draft.paragraphs.map(paragraph => {
        if (paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subject) return paragraph
        if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') {
          return paragraph
        }
        return {
          ...paragraph,
          items: (paragraph.items ?? []).map(item =>
            item.id === 'agreement-notice-subj-name' ? { ...item, bodyText: '이대상' } : item
          ),
        }
      }),
    }
    expect(extractAgreementDraftAuthorName('agreement-notice', next)).toBe('이대상')
  })
})
