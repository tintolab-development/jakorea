import dayjs from 'dayjs'
import type { FormPeriodMode, TitleWithPeriodParagraph } from './draft-schema.js'

/** 강의보고서 작성 시작 — 활동일 상대 규칙 */
export const LECTURE_REPORT_START_ACTIVITY_PRESET_LABEL = '활동일 (09:00)' as const
/** 강의보고서 작성 종료 — 활동일 상대 규칙 */
export const LECTURE_REPORT_END_ACTIVITY_PRESET_LABEL = '활동일 익월 5일 (24:00)' as const

/** UJAT 교육일지 작성 시작 — 활동일 상대 규칙 (강의보고서와 동일 카피) */
export const UJAT_EDU_JOURNAL_START_ACTIVITY_PRESET_LABEL = '활동일 (09:00)' as const
/** UJAT 교육일지 작성 종료 — 활동일 기준 다음 주 목요일 */
export const UJAT_EDU_JOURNAL_END_ACTIVITY_PRESET_LABEL = '활동일 다음주 목요일 (24:00)' as const
/** 레거시 시드(교육계획서 카피 혼입) — choice 해석만 허용 */
export const UJAT_EDU_JOURNAL_END_ACTIVITY_PRESET_LABEL_LEGACY = '활동일 전주 목요일 (24:00)' as const

export const UJAT_EDU_JOURNAL_END_NO_DEADLINE_PREVIEW_LABEL = '마감 기한 없음' as const

/** UJAT 교육계획서 작성 종료 — 활동일 기준 전주 목요일 */
export const UJAT_EDU_PLAN_END_ACTIVITY_PRESET_LABEL = '활동일 전주 목요일 (24:00)' as const
export const UJAT_EDU_PLAN_END_NO_DEADLINE_PREVIEW_LABEL =
  UJAT_EDU_JOURNAL_END_NO_DEADLINE_PREVIEW_LABEL

function formatDisplayDate(value: dayjs.Dayjs): string {
  if (!value.isValid()) return ''
  const y = value.year()
  const m = String(value.month() + 1).padStart(2, '0')
  const d = String(value.date()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 시안 미리보기 — `2026년 9월 15일(월)` */
export function formatKoreanDateWithWeekday(value: dayjs.Dayjs): string {
  if (!value.isValid()) return ''
  const weekday = WEEKDAYS_KO[value.day()] ?? ''
  return `${value.year()}년 ${value.month() + 1}월 ${value.date()}일(${weekday})`
}

export function isTitleWithPeriodParagraph(
  p: { kind?: string; variant?: string } | null | undefined
): p is TitleWithPeriodParagraph {
  return p?.kind === 'description' && p.variant === 'survey_title_with_period'
}

export function resolveTitleStartPeriodMode(paragraph: TitleWithPeriodParagraph): FormPeriodMode {
  if (paragraph.startPeriodMode != null) return paragraph.startPeriodMode
  if (paragraph.startAt || paragraph.startPeriodPresetLabel) return 'custom'
  return paragraph.periodMode === 'custom' ? 'custom' : 'immediate'
}

export function resolveTitleEndPeriodMode(paragraph: TitleWithPeriodParagraph): FormPeriodMode {
  if (paragraph.endPeriodMode != null) return paragraph.endPeriodMode
  if (paragraph.endAt || paragraph.endPeriodPresetLabel) return 'custom'
  return paragraph.periodMode === 'custom' ? 'custom' : 'immediate'
}

function formatEndClock(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return ''
  return d.format('HH:mm')
}

export function titlePeriodStartDisplayText(paragraph: TitleWithPeriodParagraph): string {
  if (resolveTitleStartPeriodMode(paragraph) === 'immediate') return '바로 시작'
  if (paragraph.startPeriodPresetLabel?.trim()) return paragraph.startPeriodPresetLabel.trim()
  if (paragraph.startAt) {
    const d = dayjs(paragraph.startAt)
    if (d.isValid()) return formatDisplayDate(d)
  }
  return '바로 시작'
}

export function titlePeriodEndDisplayText(paragraph: TitleWithPeriodParagraph): string {
  if (resolveTitleEndPeriodMode(paragraph) === 'immediate') return '마감 없음'
  if (paragraph.endPeriodPresetLabel?.trim()) return paragraph.endPeriodPresetLabel.trim()
  if (paragraph.endAt) {
    const d = dayjs(paragraph.endAt)
    if (!d.isValid()) return '마감 없음'
    const date = formatDisplayDate(d)
    const atMidnight =
      d.hour() === 0 && d.minute() === 0 && d.second() === 0 && d.millisecond() === 0
    if (atMidnight) return date
    return `${date} (${formatEndClock(paragraph.endAt)})`
  }
  return '마감 없음'
}

export function normalizeTitleWithPeriodParagraph(
  paragraph: TitleWithPeriodParagraph
): TitleWithPeriodParagraph {
  const startPeriodMode = resolveTitleStartPeriodMode(paragraph)
  const endPeriodMode = resolveTitleEndPeriodMode(paragraph)
  return {
    ...paragraph,
    startPeriodMode,
    endPeriodMode,
    startAt: startPeriodMode === 'immediate' ? null : paragraph.startAt,
    endAt: endPeriodMode === 'immediate' ? null : paragraph.endAt,
    startPeriodPresetLabel:
      startPeriodMode === 'immediate' ? null : (paragraph.startPeriodPresetLabel ?? null),
    endPeriodPresetLabel:
      endPeriodMode === 'immediate' ? null : (paragraph.endPeriodPresetLabel ?? null),
    periodMode:
      startPeriodMode === 'custom' || endPeriodMode === 'custom' ? 'custom' : 'immediate',
  }
}

/** 강의보고서 — 작성 시작 선택값 */
export type LectureReportStartPeriodChoice = 'immediate' | 'custom' | 'activity'
/** 강의보고서 — 작성 종료 선택값 */
export type LectureReportEndPeriodChoice = 'immediate' | 'custom' | 'activity'

export function resolveLectureReportStartPeriodChoice(
  paragraph: TitleWithPeriodParagraph
): LectureReportStartPeriodChoice {
  if (resolveTitleStartPeriodMode(paragraph) === 'immediate') return 'immediate'
  if (paragraph.startPeriodPresetLabel?.trim() === LECTURE_REPORT_START_ACTIVITY_PRESET_LABEL) {
    return 'activity'
  }
  return 'custom'
}

export function resolveLectureReportEndPeriodChoice(
  paragraph: TitleWithPeriodParagraph
): LectureReportEndPeriodChoice {
  if (resolveTitleEndPeriodMode(paragraph) === 'immediate') return 'immediate'
  if (paragraph.endPeriodPresetLabel?.trim() === LECTURE_REPORT_END_ACTIVITY_PRESET_LABEL) {
    return 'activity'
  }
  return 'custom'
}

/** 템플릿·미리보기용 샘플 활동일 (연동 전) */
export function resolveLectureReportActivityDaySample(
  activityDateIso?: string | null
): dayjs.Dayjs {
  if (activityDateIso) {
    const d = dayjs(activityDateIso)
    if (d.isValid()) return d.startOf('day')
  }
  return dayjs().startOf('day')
}

export function lectureReportStartActivityPreviewLabel(activityDay: dayjs.Dayjs): string {
  return formatKoreanDateWithWeekday(activityDay)
}

/** 활동일 익월 5일 */
export function lectureReportEndActivityPreviewDay(activityDay: dayjs.Dayjs): dayjs.Dayjs {
  return activityDay.add(1, 'month').date(5).startOf('day')
}

export function lectureReportEndActivityPreviewLabel(activityDay: dayjs.Dayjs): string {
  return formatKoreanDateWithWeekday(lectureReportEndActivityPreviewDay(activityDay))
}

/** UJAT 교육일지 — 작성 시작/종료 선택값 (강의보고서와 동일 3분기) */
export type UjatEduJournalStartPeriodChoice = 'immediate' | 'custom' | 'activity'
export type UjatEduJournalEndPeriodChoice = 'immediate' | 'custom' | 'activity'

export function resolveUjatEduJournalStartPeriodChoice(
  paragraph: TitleWithPeriodParagraph
): UjatEduJournalStartPeriodChoice {
  if (resolveTitleStartPeriodMode(paragraph) === 'immediate') return 'immediate'
  if (paragraph.startPeriodPresetLabel?.trim() === UJAT_EDU_JOURNAL_START_ACTIVITY_PRESET_LABEL) {
    return 'activity'
  }
  return 'custom'
}

export function resolveUjatEduJournalEndPeriodChoice(
  paragraph: TitleWithPeriodParagraph
): UjatEduJournalEndPeriodChoice {
  if (resolveTitleEndPeriodMode(paragraph) === 'immediate') return 'immediate'
  const label = paragraph.endPeriodPresetLabel?.trim() ?? ''
  if (
    label === UJAT_EDU_JOURNAL_END_ACTIVITY_PRESET_LABEL ||
    label === UJAT_EDU_JOURNAL_END_ACTIVITY_PRESET_LABEL_LEGACY
  ) {
    return 'activity'
  }
  return 'custom'
}

export function resolveUjatEduJournalActivityDaySample(
  activityDateIso?: string | null
): dayjs.Dayjs {
  return resolveLectureReportActivityDaySample(activityDateIso)
}

export function ujatEduJournalStartImmediatePreviewLabel(today = dayjs()): string {
  return formatKoreanDateWithWeekday(today.startOf('day'))
}

export function ujatEduJournalStartActivityPreviewLabel(activityDay: dayjs.Dayjs): string {
  return formatKoreanDateWithWeekday(activityDay)
}

/** 활동일 기준 「다음 주 목요일」(활동일 주의 다음 주 목요일) */
export function ujatEduJournalEndActivityPreviewDay(activityDay: dayjs.Dayjs): dayjs.Dayjs {
  return activityDay.startOf('day').startOf('week').add(1, 'week').day(4).startOf('day')
}

export function ujatEduJournalEndActivityPreviewLabel(activityDay: dayjs.Dayjs): string {
  return formatKoreanDateWithWeekday(ujatEduJournalEndActivityPreviewDay(activityDay))
}

/** UJAT 교육계획서 — 작성 시작(바로 시작/직접 설정), 종료(+활동일 전주 목요일) */
export type UjatEduPlanStartPeriodChoice = 'immediate' | 'custom'
export type UjatEduPlanEndPeriodChoice = 'immediate' | 'custom' | 'activity'

export function resolveUjatEduPlanStartPeriodChoice(
  paragraph: TitleWithPeriodParagraph
): UjatEduPlanStartPeriodChoice {
  if (resolveTitleStartPeriodMode(paragraph) === 'immediate') return 'immediate'
  return 'custom'
}

export function resolveUjatEduPlanEndPeriodChoice(
  paragraph: TitleWithPeriodParagraph
): UjatEduPlanEndPeriodChoice {
  if (resolveTitleEndPeriodMode(paragraph) === 'immediate') return 'immediate'
  if (paragraph.endPeriodPresetLabel?.trim() === UJAT_EDU_PLAN_END_ACTIVITY_PRESET_LABEL) {
    return 'activity'
  }
  return 'custom'
}

export function resolveUjatEduPlanActivityDaySample(
  activityDateIso?: string | null
): dayjs.Dayjs {
  return resolveLectureReportActivityDaySample(activityDateIso)
}

export function ujatEduPlanStartImmediatePreviewLabel(today = dayjs()): string {
  return ujatEduJournalStartImmediatePreviewLabel(today)
}

/** 활동일 기준 「전주 목요일」(활동일 주의 이전 주 목요일) */
export function ujatEduPlanEndActivityPreviewDay(activityDay: dayjs.Dayjs): dayjs.Dayjs {
  return activityDay.startOf('day').startOf('week').subtract(1, 'week').day(4).startOf('day')
}

export function ujatEduPlanEndActivityPreviewLabel(activityDay: dayjs.Dayjs): string {
  return formatKoreanDateWithWeekday(ujatEduPlanEndActivityPreviewDay(activityDay))
}
