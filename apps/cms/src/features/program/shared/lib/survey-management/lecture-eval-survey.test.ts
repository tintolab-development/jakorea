import { describe, expect, it } from 'vitest'
import {
  applyLectureEvalAnswersToDraft,
  canDownloadLectureEvalResults,
  canEditLectureEvalResponse,
  draftToLectureEvalPollResponse,
  findOwnLectureEvalResponse,
  isLectureEvalFormPhase,
  isLectureEvalResultsTabAccessible,
  parseLectureEvalFormResponseId,
  parseOwnLectureEvalFormResponseId,
} from './lecture-eval-survey'
import type { SurveyPollRawResponse } from './survey-management-types'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

describe('parseLectureEvalFormResponseId', () => {
  it('reads a numeric respondentId as formResponseId', () => {
    expect(
      parseLectureEvalFormResponseId([
        { respondentId: 'lecture-eval-admin', respondentName: 'x', addressRegion: '', answers: {} },
        { respondentId: '4412', respondentName: 'y', addressRegion: '', answers: {} },
      ])
    ).toBe(4412)
  })

  it('returns null when no numeric id exists', () => {
    expect(
      parseLectureEvalFormResponseId([
        { respondentId: 'lecture-eval-admin', respondentName: 'x', addressRegion: '', answers: {} },
      ])
    ).toBeNull()
  })
})

describe('applyLectureEvalAnswersToDraft', () => {
  it('hydrates scale and short essay from remote answers', () => {
    const draft = {
      paragraphs: [
        {
          id: 'q-scale',
          kind: 'single_item',
          variant: 'scale_type',
          paragraphTitle: '만족도',
          selectedPreviewItemId: '',
        },
        {
          id: 'q-essay',
          kind: 'single_item',
          variant: 'short_essay',
          paragraphTitle: '의견',
          bodyText: '',
          items: [{ bodyText: '' }],
        },
      ],
    } as unknown as WritingFormDraft

    const next = applyLectureEvalAnswersToDraft(draft, {
      'q-scale': 'item-3',
      'q-essay': '잘 들었습니다',
    })

    expect(next.paragraphs[0]).toMatchObject({
      id: 'q-scale',
      selectedPreviewItemId: 'item-3',
    })
    expect(next.paragraphs[1]).toMatchObject({
      id: 'q-essay',
      bodyText: '잘 들었습니다',
    })
  })
})

describe('draftToLectureEvalPollResponse', () => {
  it('includes user_info field keys in answers', () => {
    const draft = {
      paragraphs: [
        {
          id: 'user',
          kind: 'single_item',
          variant: 'user_info',
          userFields: [
            { key: 'name', label: '이름' },
            { key: 'addressRegion', label: '자택 주소지(지역)' },
          ],
          selectedUserFieldKeys: ['name', 'addressRegion'],
          fieldAnswers: {
            name: '테스트담당자',
            addressRegion: '서울특별시',
          },
        },
        {
          id: 'q-scale',
          kind: 'single_item',
          variant: 'scale_type',
          selectedPreviewItemId: 'item-3',
        },
      ],
    } as unknown as WritingFormDraft

    const response = draftToLectureEvalPollResponse(draft)
    expect(response.answers).toMatchObject({
      name: '테스트담당자',
      addressRegion: '서울특별시',
      'q-scale': 'item-3',
    })
    expect(response.respondentName).toBe('테스트담당자')
  })
})

function row(respondentId: string, submittedByAdminId?: number): SurveyPollRawResponse {
  return {
    respondentId,
    respondentName: '',
    addressRegion: '',
    answers: {},
    ...(submittedByAdminId != null ? { submittedByAdminId } : {}),
  }
}

describe('findOwnLectureEvalResponse', () => {
  it('picks the row submitted by the signed-in admin, not the first row', () => {
    const rows = [row('101', 7), row('102', 9)]
    expect(findOwnLectureEvalResponse(rows, 9)?.respondentId).toBe('102')
    expect(parseOwnLectureEvalFormResponseId(rows, 9)).toBe(102)
  })

  it('treats a missing own row as not submitted', () => {
    expect(findOwnLectureEvalResponse([row('101', 7)], 9)).toBeNull()
    expect(parseOwnLectureEvalFormResponseId([row('101', 7)], 9)).toBeNull()
  })

  it('does not claim another admin row when the admin id is unknown', () => {
    expect(findOwnLectureEvalResponse([row('101', 7)], null)).toBeNull()
    expect(findOwnLectureEvalResponse([row('local')], null)?.respondentId).toBe('local')
  })
})

describe('canEditLectureEvalResponse', () => {
  const now = new Date('2026-11-11T12:00:00+09:00')

  it('allows edits before the binding submissionEndAt', () => {
    expect(
      canEditLectureEvalResponse(
        { status: 'in_progress', submissionEndAt: '2026-11-12T00:00:00+09:00' },
        now
      )
    ).toBe(true)
  })

  it('blocks edits at or after submissionEndAt', () => {
    expect(
      canEditLectureEvalResponse(
        { status: 'in_progress', submissionEndAt: '2026-11-11T12:00:00+09:00' },
        now
      )
    ).toBe(false)
  })

  it('blocks edits before start and after finish', () => {
    expect(canEditLectureEvalResponse({ status: 'before_start' }, now)).toBe(false)
    expect(canEditLectureEvalResponse({ status: 'finished' }, now)).toBe(false)
  })

  it('defers to the server when the end date is unknown', () => {
    expect(canEditLectureEvalResponse({ status: 'in_progress' }, now)).toBe(true)
  })
})

describe('lecture eval phase gates', () => {
  it('opens results only after FINISHED', () => {
    const base = { id: '1', title: '', templateId: '', responseCount: 1, participantTotal: 1 }
    expect(isLectureEvalResultsTabAccessible({ ...base, status: 'in_progress' })).toBe(false)
    expect(isLectureEvalResultsTabAccessible({ ...base, status: 'finished' })).toBe(true)
  })

  it('shows the submit form only while in progress without an own response', () => {
    expect(isLectureEvalFormPhase({ status: 'in_progress' }, false)).toBe(true)
    expect(isLectureEvalFormPhase({ status: 'in_progress' }, true)).toBe(false)
    expect(isLectureEvalFormPhase({ status: 'before_start' }, false)).toBe(false)
    expect(isLectureEvalFormPhase({ status: 'finished' }, false)).toBe(false)
  })

  it('enables download only when the binding says resultDownloadable', () => {
    expect(canDownloadLectureEvalResults({ resultDownloadable: true })).toBe(true)
    expect(canDownloadLectureEvalResults({ resultDownloadable: false })).toBe(false)
    expect(canDownloadLectureEvalResults({ resultDownloadable: null })).toBe(false)
    expect(canDownloadLectureEvalResults(null)).toBe(false)
  })
})
