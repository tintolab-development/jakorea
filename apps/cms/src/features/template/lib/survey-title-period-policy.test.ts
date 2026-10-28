import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createNewSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'
import {
  forceSurveyTitleWritingPeriodOn,
  resolveSurveyTitlePeriodDisabledDate,
} from '@/features/template/lib/survey-title-period-policy'

describe('resolveSurveyTitlePeriodDisabledDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('설문 제목 단락 — 오늘(KST) 이전만 비활성', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-28T03:00:00.000Z'))
    const disabledDate = resolveSurveyTitlePeriodDisabledDate(DEFAULT_SURVEY_PARAGRAPH_IDS.title)
    expect(disabledDate).toBeTypeOf('function')
    expect(disabledDate?.(dayjs('2026-10-27'))).toBe(true)
    expect(disabledDate?.(dayjs('2026-10-28'))).toBe(false)
    expect(disabledDate?.(dayjs('2026-11-01'))).toBe(false)
  })

  it('설문 외 제목형 단락은 제한 없음', () => {
    expect(resolveSurveyTitlePeriodDisabledDate('other-title')).toBeUndefined()
  })
})

describe('forceSurveyTitleWritingPeriodOn', () => {
  it('작성 기간 OFF 제목 단락을 ON으로 정규화', () => {
    const base = createNewSurveyDraft()
    const draft = {
      ...base,
      paragraphs: base.paragraphs.map(p =>
        p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title ? { ...p, showWritingPeriodOnForm: false } : p
      ),
    }
    const next = forceSurveyTitleWritingPeriodOn(draft)
    const title = next.paragraphs.find(p => p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title)
    expect(title).toMatchObject({ showWritingPeriodOnForm: true })
  })

  it('이미 ON이면 동일 참조 반환', () => {
    const base = createNewSurveyDraft()
    const draft = {
      ...base,
      paragraphs: base.paragraphs.map(p =>
        p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title ? { ...p, showWritingPeriodOnForm: true } : p
      ),
    }
    expect(forceSurveyTitleWritingPeriodOn(draft)).toBe(draft)
  })
})
