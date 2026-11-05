import { describe, expect, it } from 'vitest'
import {
  createDefaultSurveyDraft,
  normalizeWritingFormDraft,
} from '@jakorea/form-schema/writing-form'
import {
  buildEducationSurveyAnswers,
  validateEducationSurveyFill,
} from '../src/features/mypage/education/surveys/lib/survey-answers'
import { EMPTY_SURVEY_SIDECAR } from '../src/features/mypage/education/surveys/lib/survey-sidecar'

describe('education survey answers', () => {
  const draft = normalizeWritingFormDraft(createDefaultSurveyDraft())
  const userInfo = draft.paragraphs.find(
    paragraph => paragraph.kind === 'single_item' && paragraph.variant === 'user_info'
  )

  it('keeps selected user info fields', () => {
    expect(userInfo?.kind).toBe('single_item')
    expect(userInfo && 'variant' in userInfo ? userInfo.variant : null).toBe('user_info')
  })

  it('does not require user info on member fill, but does on public fill', () => {
    if (userInfo == null || userInfo.kind !== 'single_item' || userInfo.variant !== 'user_info') {
      throw new Error('expected user_info paragraph')
    }
    const emptyUserInfoDraft = {
      ...draft,
      paragraphs: [{ ...userInfo, answerRequired: true, requiredMark: true, fieldAnswers: {} }],
    }
    expect(validateEducationSurveyFill(emptyUserInfoDraft, EMPTY_SURVEY_SIDECAR).ok).toBe(true)
    expect(
      validateEducationSurveyFill(emptyUserInfoDraft, EMPTY_SURVEY_SIDECAR, {
        requireUserInfoAnswers: true,
      }).ok
    ).toBe(false)
  })

  it('requires only explicit user info keys on public fill (e.g. name)', () => {
    if (userInfo == null || userInfo.kind !== 'single_item' || userInfo.variant !== 'user_info') {
      throw new Error('expected user_info paragraph')
    }
    const optionalParagraphDraft = {
      ...draft,
      paragraphs: [
        {
          ...userInfo,
          answerRequired: false,
          requiredMark: false,
          fieldAnswers: { addressRegion: '서울특별시 강서구' },
        },
      ],
    }
    expect(
      validateEducationSurveyFill(optionalParagraphDraft, EMPTY_SURVEY_SIDECAR, {
        requireUserInfoAnswers: true,
        requiredUserInfoFieldKeys: ['name'],
      }).ok
    ).toBe(false)

    const nameOnlyDraft = {
      ...draft,
      paragraphs: [
        {
          ...userInfo,
          answerRequired: false,
          requiredMark: false,
          fieldAnswers: { name: '홍길동' },
        },
      ],
    }
    expect(
      validateEducationSurveyFill(nameOnlyDraft, EMPTY_SURVEY_SIDECAR, {
        requireUserInfoAnswers: true,
        requiredUserInfoFieldKeys: ['name'],
      }).ok
    ).toBe(true)
  })

  it('submits user info under the paragraph key only', () => {
    if (userInfo == null || userInfo.kind !== 'single_item' || userInfo.variant !== 'user_info') {
      throw new Error('expected user_info paragraph')
    }
    const filledUserInfoDraft = {
      ...draft,
      paragraphs: [
        {
          ...userInfo,
          fieldAnswers: { name: '홍길동', addressRegion: '서울특별시 강서구' },
        },
      ],
    }
    expect(
      validateEducationSurveyFill(filledUserInfoDraft, EMPTY_SURVEY_SIDECAR, {
        requireUserInfoAnswers: true,
      }).ok
    ).toBe(true)
    const answers = buildEducationSurveyAnswers(filledUserInfoDraft, EMPTY_SURVEY_SIDECAR)
    expect(answers.name).toBeUndefined()
    expect(answers.addressRegion).toBeUndefined()
    expect(answers['survey-paragraph-user']).toEqual({
      name: '홍길동',
      addressRegion: '서울특별시 강서구',
    })
  })
})
