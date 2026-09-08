import { describe, expect, it } from 'vitest'
import {
  createAgreementNoticeDraft,
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { restoreAgreementNoticeFilledDocumentDraft } from './restore-agreement-notice-filled-document-draft'

describe('restoreAgreementNoticeFilledDocumentDraft', () => {
  it('표 idTypeWithInput에 저장된 주민등록번호를 유지한다', () => {
    const draft = normalizeWritingFormDraft(createAgreementNoticeDraft())
    const withResident: WritingFormDraft = {
      ...draft,
      paragraphs: draft.paragraphs.map(paragraph => {
        if (paragraph.id !== 'agreement-notice-table') return paragraph
        if (paragraph.kind !== 'single_item' || paragraph.variant !== 'horizontal_table') {
          return paragraph
        }
        if (paragraph.idTypeWithInput == null) return paragraph
        return {
          ...paragraph,
          idTypeWithInput: {
            ...paragraph.idTypeWithInput,
            inputValue: '9707211234567',
          },
        }
      }),
    }

    const restored = restoreAgreementNoticeFilledDocumentDraft(withResident)
    const table = restored.paragraphs.find(p => p.id === 'agreement-notice-table')
    expect(table?.kind === 'single_item' && table.variant === 'horizontal_table').toBe(true)
    if (table?.kind === 'single_item' && table.variant === 'horizontal_table') {
      expect(table.idTypeWithInput?.inputValue).toBe('970721-1234567')
    }
  })

  it('구버전 단독 id-type 단락 inputValue를 표 하단으로 옮긴다', () => {
    const draft = normalizeWritingFormDraft(createAgreementNoticeDraft())
    const legacyOnly: WritingFormDraft = {
      ...draft,
      paragraphs: draft.paragraphs.map(paragraph => {
        if (paragraph.id !== 'agreement-notice-table') return paragraph
        if (paragraph.kind !== 'single_item' || paragraph.variant !== 'horizontal_table') {
          return paragraph
        }
        return { ...paragraph, idTypeWithInput: null }
      }).concat([
        {
          id: 'agreement-notice-id-type',
          kind: 'single_item',
          variant: 'id_type_with_input',
          requiredMark: false,
          paragraphTitle: '',
          paragraphDescription: '',
          participatesInTitleNumbering: true,
          options: [
            { id: 'agreement-notice-id-resident', label: '주민등록번호' },
          ],
          selectedOptionId: 'agreement-notice-id-resident',
          inputPlaceholder: '주민등록번호를 입력해 주세요',
          inputValue: '9001012345678',
          answerRequired: false,
        },
      ]),
    }

    const restored = restoreAgreementNoticeFilledDocumentDraft(legacyOnly)
    const table = restored.paragraphs.find(p => p.id === 'agreement-notice-table')
    expect(table?.kind === 'single_item' && table.variant === 'horizontal_table').toBe(true)
    if (table?.kind === 'single_item' && table.variant === 'horizontal_table') {
      expect(table.idTypeWithInput?.inputValue).toBe('900101-2345678')
    }
  })
})
