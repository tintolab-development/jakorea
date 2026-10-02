import { describe, expect, it } from 'vitest'
import {
  applyLectureEvalAnswersToDraft,
  parseLectureEvalFormResponseId,
} from './lecture-eval-survey'
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
