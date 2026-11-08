import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchGeneralProgramSurveyResponses = vi.fn()
const fetchGeneralProgramSurveySummary = vi.fn()
const fetchGeneralProgramSurveyResponseDetail = vi.fn()

vi.mock('@/features/program/general/api/admin-general-programs-service', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fetchGeneralProgramSurveyResponses: (...args: unknown[]) =>
    fetchGeneralProgramSurveyResponses(...args),
  fetchGeneralProgramSurveySummary: (...args: unknown[]) =>
    fetchGeneralProgramSurveySummary(...args),
  fetchGeneralProgramSurveyResponseDetail: (...args: unknown[]) =>
    fetchGeneralProgramSurveyResponseDetail(...args),
}))

import { loadMappedProgramSurveyResponses } from './use-general-program-posts-surveys'

const FULL_TEXT = '강의가 아주 길고 '.repeat(30).trim()

const queryClient = {
  fetchQuery: vi.fn(async ({ queryFn }: { queryFn: () => unknown }) => queryFn()),
} as unknown as Parameters<typeof loadMappedProgramSurveyResponses>[0]['queryClient']

describe('loadMappedProgramSurveyResponses', () => {
  beforeEach(() => {
    fetchGeneralProgramSurveyResponses.mockReset()
    fetchGeneralProgramSurveySummary.mockReset()
    fetchGeneralProgramSurveyResponseDetail.mockReset()
    fetchGeneralProgramSurveyResponses.mockResolvedValue([
      {
        formResponseId: 1,
        submittedByMemberName: '김응답',
        answerCount: 2,
        // preview가 짧아도(답 수 < answerCount) 단건 상세를 부르지 않는다
        answerPreviewJson: JSON.stringify([{ questionKey: 'comment', answerDisplayText: '강의가' }]),
        answers: [
          { questionKey: 'comment', questionType: 'TEXTAREA', answerDisplayText: FULL_TEXT },
          { questionKey: 'score', answerDisplayText: '5' },
        ],
      },
    ])
  })

  it('강의평가(when-preview-short): 목록 1회(includeAnswers=true), 단건 상세 0회', async () => {
    const rows = await loadMappedProgramSurveyResponses({
      programId: '10',
      templateVersionId: '20',
      bindingId: '30',
      detailPolicy: 'when-preview-short',
      queryClient,
    })
    expect(fetchGeneralProgramSurveyResponses).toHaveBeenCalledTimes(1)
    expect(fetchGeneralProgramSurveyResponses).toHaveBeenCalledWith('10', '20', '30', {
      includeAnswers: true,
    })
    expect(fetchGeneralProgramSurveyResponseDetail).not.toHaveBeenCalled()
    expect(fetchGeneralProgramSurveySummary).not.toHaveBeenCalled()
    expect(rows).toEqual([
      {
        respondentId: '1',
        respondentName: '김응답',
        addressRegion: '',
        answers: { comment: FULL_TEXT, score: '5' },
      },
    ])
  })

  it('public-text-only: 공개 주관식 답이 없으면 includeAnswers=false로 목록만 조회', async () => {
    fetchGeneralProgramSurveySummary.mockResolvedValue([
      { questionKey: 'comment', questionType: 'LONG_TEXT', summaryJson: '{"topAnswers":[]}' },
    ])
    await loadMappedProgramSurveyResponses({
      programId: '10',
      templateVersionId: '20',
      bindingId: '30',
      detailPolicy: 'public-text-only',
      queryClient,
    })
    expect(fetchGeneralProgramSurveyResponses).toHaveBeenCalledTimes(1)
    expect(fetchGeneralProgramSurveyResponses).toHaveBeenCalledWith('10', '20', '30', {
      includeAnswers: false,
    })
    expect(fetchGeneralProgramSurveyResponseDetail).not.toHaveBeenCalled()
  })

  it('public-text-only: 공개 주관식 답이 있으면 includeAnswers=true, 단건 상세 0회', async () => {
    fetchGeneralProgramSurveySummary.mockResolvedValue([
      {
        questionKey: 'comment',
        questionType: 'LONG_TEXT',
        summaryJson: JSON.stringify({ topAnswers: [{ text: '좋아요' }] }),
      },
    ])
    const rows = await loadMappedProgramSurveyResponses({
      programId: '10',
      templateVersionId: '20',
      bindingId: '30',
      detailPolicy: 'public-text-only',
      queryClient,
    })
    expect(fetchGeneralProgramSurveyResponses).toHaveBeenCalledWith('10', '20', '30', {
      includeAnswers: true,
    })
    expect(fetchGeneralProgramSurveyResponseDetail).not.toHaveBeenCalled()
    expect(rows[0]?.answers.comment).toBe(FULL_TEXT)
  })
})
