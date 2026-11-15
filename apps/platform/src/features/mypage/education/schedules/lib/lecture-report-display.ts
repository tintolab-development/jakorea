import type { TitleWithPeriodParagraph } from '@jakorea/form-schema/writing-form'
import {
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
  titlePeriodEndDisplayText,
} from '@jakorea/form-schema/writing-form'
import type { LectureReportAssignment } from '../api/lecture-report-client'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import { formatDisplayDateRange } from '@/shared/lib/format-display-date'

export const LECTURE_REPORT_DOCUMENT_TITLE = '강의보고서'
export const LECTURE_REPORT_TITLE_LECTURE_PLACEHOLDER = '강의명'

/**
 * 강의보고서 페이지 타이틀 「」 안에 넣는 이름 — 프로그램명.
 * CMS 미리보기(`resolveProgramTitle`)와 같은 값이어야 해서 일정명은 쓰지 않는다.
 * 프로그램명을 못 읽을 때만 일정명으로 되돌아간다.
 */
export function resolveLectureReportLectureName(
  program: { title?: string } | null | undefined,
  assignment: LectureReportAssignment | undefined,
): string {
  return (
    program?.title?.trim() ||
    toDisplayEducationScheduleName(assignment?.scheduleName) ||
    '강의'
  )
}

export function buildLectureReportPageTitle(lectureName: string): string {
  const trimmed = lectureName.trim() || '강의'
  return `JA KOREA 「${trimmed}」 ${LECTURE_REPORT_DOCUMENT_TITLE}`
}

function formatLectureReportPeriodDate(value: string | null | undefined): string {
  return formatDisplayDateRange(value, null, { weekday: false, empty: '' })
}

/**
 * 강의보고서 작성 상단 기간 — 시안 `2026년 11월 13일 ~ 2026년 11월 30일` (요일·시각 없음).
 * 시작·종료 기준은 설문 제목형 기간(`resolveEducationSurveyPeriodLabel`)과 같다:
 * 시작 = 직접 지정 시작일 → 강의 시작일, 종료 = 서버 마감(submitDueAt) → 프리셋 문구 → 지정 종료일.
 */
export function resolveLectureReportPeriodLabel(
  paragraph: TitleWithPeriodParagraph,
  lectureStartAt: string | null | undefined,
  submitDueAt: string | null | undefined,
): string {
  const startRaw =
    resolveTitleStartPeriodMode(paragraph) === 'custom' && paragraph.startAt
      ? paragraph.startAt
      : lectureStartAt ?? new Date().toISOString()
  const start = formatLectureReportPeriodDate(startRaw) || startRaw.slice(0, 10)

  if (resolveTitleEndPeriodMode(paragraph) === 'immediate') return `${start} ~`

  const dueEnd = formatLectureReportPeriodDate(submitDueAt?.trim())
  if (dueEnd) return `${start} ~ ${dueEnd}`

  const preset = paragraph.endPeriodPresetLabel?.trim()
  if (preset) return `${start} ~ ${preset}`

  const end = formatLectureReportPeriodDate(paragraph.endAt)
  if (end) return `${start} ~ ${end}`

  return `${start} ~ ${titlePeriodEndDisplayText(paragraph)}`
}
