import { beforeEach, describe, expect, it, vi } from 'vitest'

const resolveSurveyWritingDraft = vi.fn()

vi.mock('./survey-writing-draft', async importOriginal => {
  const actual = await importOriginal<typeof import('./survey-writing-draft')>()
  return {
    ...actual,
    resolveSurveyWritingDraft: (templateId: string, options?: unknown) =>
      resolveSurveyWritingDraft(templateId, options),
  }
})

import { buildLectureEvalFormDraft } from './lecture-eval-survey'

describe('buildLectureEvalFormDraft — 등록된 강의평가 version 조회', () => {
  beforeEach(() => {
    resolveSurveyWritingDraft.mockReset()
    resolveSurveyWritingDraft.mockResolvedValue({ paragraphs: [] })
  })

  it('바인딩 version이 있으면 그 version으로 조회한다(템플릿 목록 미조회)', async () => {
    await buildLectureEvalFormDraft('lecture-eval', 2698)
    expect(resolveSurveyWritingDraft).toHaveBeenCalledWith(
      'lecture-eval',
      expect.objectContaining({ templateVersionId: 2698 })
    )
  })

  it.each([undefined, 0, -1, Number.NaN])('version이 %s이면 템플릿 기준으로 조회한다', async id => {
    await buildLectureEvalFormDraft('lecture-eval', id)
    expect(resolveSurveyWritingDraft).toHaveBeenCalledWith(
      'lecture-eval',
      expect.objectContaining({ templateVersionId: undefined })
    )
  })
})
