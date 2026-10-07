import { describe, expect, it } from 'vitest'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  getSurveyWriteFormTitleNumberPrefix,
  getTitleNumberSequenceIndex,
} from '@/features/template/lib/form-title-numbering'
import {
  buildSurveyDisplayCards,
  shouldFlattenSurveyUserInfoWrite,
} from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-survey-write'

function userInfo(selectedUserFieldKeys: string[]): WritingFormParagraph {
  return {
    id: 'user',
    kind: 'single_item',
    variant: 'user_info',
    requiredMark: true,
    paragraphTitle: '설문자 정보',
    paragraphDescription: '선택한 항목을 자동으로 불러옵니다.',
    participatesInTitleNumbering: true,
    userFields: [
      { key: 'name', label: '이름' },
      { key: 'birthDate', label: '생년월일' },
      { key: 'addressRegion', label: '자택 주소지(지역)' },
    ],
    selectedUserFieldKeys,
  }
}

function scoreParagraph(): WritingFormParagraph {
  return {
    id: 'score',
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '프로그램 신청 계기',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    items: [],
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

describe('survey user_info write', () => {
  it('keeps user_info as a single auto-filled table card in edit and write', () => {
    const paragraphs = [userInfo(['name', 'birthDate']), scoreParagraph()]
    expect(shouldFlattenSurveyUserInfoWrite('survey', 'authoring')).toBe(false)
    expect(shouldFlattenSurveyUserInfoWrite('survey', 'preview')).toBe(true)
    expect(shouldFlattenSurveyUserInfoWrite('agreement', 'preview')).toBe(false)

    expect(buildSurveyDisplayCards(paragraphs, false).map(card => card.displayKey)).toEqual([
      'user',
      'score',
    ])
    expect(buildSurveyDisplayCards(paragraphs, true).map(card => card.displayKey)).toEqual([
      'user',
      'score',
    ])
  })

  it('hides user_info when no field is selected', () => {
    const cards = buildSurveyDisplayCards([userInfo([]), scoreParagraph()], true)
    expect(cards.map(card => card.displayKey)).toEqual(['score'])
  })

  it('consumes one Q for user_info in both edit and write', () => {
    const paragraphs = [userInfo(['name', 'birthDate']), scoreParagraph()]
    expect(getTitleNumberSequenceIndex(paragraphs, 'user')).toBe(1)
    expect(getTitleNumberSequenceIndex(paragraphs, 'score')).toBe(2)

    expect(getSurveyWriteFormTitleNumberPrefix(paragraphs, { paragraphId: 'user' }, 'q123')).toBe(
      'Q1. '
    )
    expect(getSurveyWriteFormTitleNumberPrefix(paragraphs, { paragraphId: 'score' }, 'q123')).toBe(
      'Q2. '
    )
  })

  it('skips the Q number of user_info without selected fields', () => {
    const paragraphs = [userInfo([]), scoreParagraph()]
    expect(getSurveyWriteFormTitleNumberPrefix(paragraphs, { paragraphId: 'score' }, 'q123')).toBe(
      'Q1. '
    )
  })
})
