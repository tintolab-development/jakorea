import { describe, expect, it } from 'vitest'
import {
  pickFormResponseFeedbackDisplayContent,
  resolveFormResponseFeedbackDisplayContent,
} from './form-response-feedback-list'

describe('pickFormResponseFeedbackDisplayContent', () => {
  it('createdAt 최신 non-empty content', () => {
    expect(
      pickFormResponseFeedbackDisplayContent({
        formResponseId: 1,
        feedbacks: [
          { feedbackId: 1, content: 'old', createdAt: '2026-01-01T10:00:00+09:00' },
          { feedbackId: 2, content: 'new', createdAt: '2026-01-02T10:00:00+09:00' },
        ],
      })
    ).toBe('new')
  })

  it('content 없으면 rejectReason fallback', () => {
    expect(
      pickFormResponseFeedbackDisplayContent({
        feedbacks: [{ feedbackId: null, rejectReason: '보완 필요', createdAt: '2026-01-01T10:00:00+09:00' }],
      })
    ).toBe('보완 필요')
  })
})

describe('resolveFormResponseFeedbackDisplayContent', () => {
  it('POST 단건 응답 content', () => {
    expect(resolveFormResponseFeedbackDisplayContent({ content: '  hello  ' })).toBe('hello')
  })
})
