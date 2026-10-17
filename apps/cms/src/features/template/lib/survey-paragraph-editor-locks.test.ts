import { describe, expect, it } from 'vitest'
import { createNewSurveyDraft } from '@jakorea/form-schema/writing-form'
import { createAgreementExplanationTextParagraphForInsert } from '@/features/template/lib/writing-form-middle-paragraph-mutations'
import {
  isSurveyEditorParagraphDupDeleteLocked,
  isSurveyExplanationTextParagraph,
  isSurveyTitleParagraph,
} from '@/features/template/lib/survey-paragraph-editor-locks'
import {
  duplicateSurveyParagraph,
  removeSurveyParagraph,
} from '@/features/template/lib/writing-form-middle-paragraph-mutations'

describe('survey-paragraph-editor-locks', () => {
  it('제목형·설명글 텍스트형은 설문 에디터에서 dup/delete 잠금', () => {
    const draft = createNewSurveyDraft()
    const title = draft.paragraphs[0]!
    expect(isSurveyTitleParagraph(title)).toBe(true)
    expect(isSurveyEditorParagraphDupDeleteLocked(title)).toBe(true)

    const explanation = createAgreementExplanationTextParagraphForInsert('explanation-1')
    expect(isSurveyExplanationTextParagraph(explanation)).toBe(true)
    expect(isSurveyEditorParagraphDupDeleteLocked(explanation)).toBe(true)
  })
})

describe('removeSurveyParagraph / duplicateSurveyParagraph', () => {
  it('제목형·설명글 텍스트형은 삭제·복제 불가', () => {
    const draft = createNewSurveyDraft()
    const titleId = draft.paragraphs[0]!.id
    const explanation = createAgreementExplanationTextParagraphForInsert('explanation-1')
    const paragraphs = [draft.paragraphs[0]!, explanation, ...draft.paragraphs.slice(1)]

    expect(removeSurveyParagraph(paragraphs, titleId)).toBeNull()
    expect(removeSurveyParagraph(paragraphs, explanation.id)).toBeNull()
    expect(duplicateSurveyParagraph(paragraphs, titleId, 'title-copy')).toBeNull()
    expect(duplicateSurveyParagraph(paragraphs, explanation.id, 'explanation-copy')).toBeNull()
  })

  it('일반 문항은 삭제·복제 가능', () => {
    const draft = createNewSurveyDraft()
    const score = draft.paragraphs.find(p => p.kind === 'single_item' && p.variant === 'scale_type')!
    const next = removeSurveyParagraph(draft.paragraphs, score.id)
    expect(next).not.toBeNull()
    expect(next!.some(p => p.id === score.id)).toBe(false)

    const dup = duplicateSurveyParagraph(draft.paragraphs, score.id, 'score-copy')
    expect(dup).not.toBeNull()
    expect(dup!.filter(p => p.variant === 'scale_type').length).toBe(2)
  })
})
