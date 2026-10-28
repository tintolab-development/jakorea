import type { Dayjs } from 'dayjs'
import { normalizeTitleWithPeriodParagraph } from '@/features/template/lib/title-with-period-settings'
import {
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { isBeforeSeoulToday } from '@/shared/utils/date'

/** 설문 양식 제목 단락(템플릿 관리·프로그램 설문 공통 id)인지 */
export function isSurveyTitleParagraphId(paragraphId: string): boolean {
  return paragraphId === DEFAULT_SURVEY_PARAGRAPH_IDS.title
}

/** 설문 제목 단락 작성 기간 — 오늘(KST) 이전 날짜 비활성. 설문 외 제목형은 제한 없음(undefined) */
export function resolveSurveyTitlePeriodDisabledDate(
  paragraphId: string
): ((date: Dayjs) => boolean) | undefined {
  if (!isSurveyTitleParagraphId(paragraphId)) return undefined
  return date => isBeforeSeoulToday(date)
}

/** 프로그램 > 설문조사 수정 — 제목 단락「작성 기간」토글 ON 고정(초기 draft 정규화) */
export function forceSurveyTitleWritingPeriodOn(draft: WritingFormDraft): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(p => {
    if (
      !isSurveyTitleParagraphId(p.id) ||
      p.kind !== 'description' ||
      p.variant !== 'survey_title_with_period' ||
      p.showWritingPeriodOnForm === true
    ) {
      return p
    }
    changed = true
    return normalizeTitleWithPeriodParagraph({ ...p, showWritingPeriodOnForm: true })
  })
  return changed ? { ...draft, paragraphs } : draft
}
