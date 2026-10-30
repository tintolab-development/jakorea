import { describe, expect, it } from 'vitest'
import { createNewSurveyDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  applyProgramSurveyTitleToParagraph,
  findProgramSurveyTitleParagraphId,
  PROGRAM_SURVEY_HEADER_FALLBACK_TITLE,
  readProgramSurveyTitle,
  resolveProgramSurveyHeaderTitle,
  seedProgramSurveyTitle,
  withProgramSurveyTitle,
} from './program-survey-title-sync'

describe('program-survey-title-sync', () => {
  it('제목 단락 surveyTitle을 읽고 바꾼다 (다른 단락은 그대로)', () => {
    const base = createNewSurveyDraft()
    const next = withProgramSurveyTitle(base, '2026 만족도 설문')
    expect(readProgramSurveyTitle(next)).toBe('2026 만족도 설문')
    expect(resolveProgramSurveyHeaderTitle(next)).toBe('2026 만족도 설문')
    const titleId = findProgramSurveyTitleParagraphId(next)
    expect(titleId).toBeDefined()
    next.paragraphs.forEach((paragraph, index) => {
      if (paragraph.id !== titleId) expect(paragraph).toBe(base.paragraphs[index])
    })
  })

  it('제목 단락이 비어 있으면 바인딩 설문명으로 시작해 좌상단과 같게 맞춘다', () => {
    const empty = withProgramSurveyTitle(createNewSurveyDraft(), '')
    const seeded = seedProgramSurveyTitle(empty, ' 설문조사 ')
    expect(readProgramSurveyTitle(seeded)).toBe('설문조사')
    expect(resolveProgramSurveyHeaderTitle(seeded)).toBe(readProgramSurveyTitle(seeded))
  })

  it('제목 단락에 값이 있으면 그 값을 유지하고 좌상단이 따른다', () => {
    const draft = withProgramSurveyTitle(createNewSurveyDraft(), 'ㅇㅇㅇㅇ')
    const seeded = seedProgramSurveyTitle(draft, '설문조사')
    expect(seeded).toBe(draft)
    expect(resolveProgramSurveyHeaderTitle(seeded)).toBe('ㅇㅇㅇㅇ')
  })

  it('좌상단 연필 편집 값은 제목 단락에만 반영된다', () => {
    const draft = withProgramSurveyTitle(createNewSurveyDraft(), '이전')
    const titleId = findProgramSurveyTitleParagraphId(draft)!
    const updated = {
      ...draft,
      paragraphs: draft.paragraphs.map(p =>
        p.id === titleId ? applyProgramSurveyTitleToParagraph(p, '새 설문명') : p
      ),
    }
    expect(readProgramSurveyTitle(updated)).toBe('새 설문명')
    const other = draft.paragraphs.find(p => p.id !== titleId)!
    expect(applyProgramSurveyTitleToParagraph(other, 'x')).toBe(other)
  })

  it('제목 단락이 비면 좌상단은 기본 문구를 보인다', () => {
    const empty = withProgramSurveyTitle(createNewSurveyDraft(), '  ')
    expect(resolveProgramSurveyHeaderTitle(empty)).toBe(PROGRAM_SURVEY_HEADER_FALLBACK_TITLE)
    expect(seedProgramSurveyTitle(empty, '')).toBe(empty)
  })
})
