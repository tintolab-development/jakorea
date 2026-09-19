import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'
import type { EducationSurveyListEntry } from './mock-survey-list'

/** immediate 기간일 때 헤더 시작일(설문 생성일) mock */
export const EDUCATION_SURVEY_SEED_CREATED_AT = '2024-09-23'

export type EducationSurveySeedKind = 'survey' | 'satisfaction'
export type EducationSatisfactionAudience = 'student' | 'teacher'

const SURVEY_TEMPLATE_NAME = '설문조사'
const SATISFACTION_TEMPLATE_NAME_BY_AUDIENCE: Record<EducationSatisfactionAudience, string> = {
  student: '만족도조사 (학생용)',
  teacher: '만족도조사 (교사용)',
}

export type CreateEducationSurveySeedDraftOptions = {
  /** satisfaction 전용 — 기본 student */
  satisfactionAudience?: EducationSatisfactionAudience
  /** 목록 선택 건 — 제목·설명·기간 오버레이 */
  listEntry?: Pick<EducationSurveyListEntry, 'title' | 'description' | 'startAt' | 'endAt'>
}

function resolveSurveyTitle(
  kind: EducationSurveySeedKind,
  options?: CreateEducationSurveySeedDraftOptions,
): string {
  if (options?.listEntry?.title?.trim()) return options.listEntry.title.trim()
  if (kind === 'survey') return SURVEY_TEMPLATE_NAME
  return SATISFACTION_TEMPLATE_NAME_BY_AUDIENCE[options?.satisfactionAudience ?? 'student']
}

function applySurveyHeader(
  draft: WritingFormDraft,
  surveyTitle: string,
  listEntry?: CreateEducationSurveySeedDraftOptions['listEntry'],
): WritingFormDraft {
  const description = listEntry?.description?.trim() ?? ''
  const startAt = listEntry?.startAt?.trim() || null
  const endAt = listEntry?.endAt?.trim() || null
  const hasCustomPeriod = Boolean(startAt || endAt)

  return normalizeWritingFormDraft({
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.id !== DEFAULT_SURVEY_PARAGRAPH_IDS.title || paragraph.kind !== 'description') {
        return paragraph
      }
      return {
        ...paragraph,
        surveyTitle,
        surveyDescription: description,
        ...(hasCustomPeriod
          ? {
              periodMode: 'custom' as const,
              startPeriodMode: 'custom' as const,
              endPeriodMode: endAt ? ('custom' as const) : ('immediate' as const),
              startAt,
              endAt,
            }
          : {}),
      }
    }),
  })
}

/**
 * CMS 기본 설문/만족도 시드 — `createDefaultSurveyDraft()` + catalog templateName.
 * schema 본문은 survey-default / survey-student / survey-teacher와 동일.
 */
export function createEducationSurveySeedDraft(
  kind: EducationSurveySeedKind,
  options?: CreateEducationSurveySeedDraftOptions,
): WritingFormDraft {
  const base = normalizeWritingFormDraft(createDefaultSurveyDraft())
  return applySurveyHeader(base, resolveSurveyTitle(kind, options), options?.listEntry)
}
