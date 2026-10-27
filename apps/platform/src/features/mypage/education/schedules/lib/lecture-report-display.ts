import type { LectureReportAssignment } from '../api/lecture-report-client'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'

export const LECTURE_REPORT_DOCUMENT_TITLE = '강의보고서'
export const LECTURE_REPORT_TITLE_LECTURE_PLACEHOLDER = '강의명'

/** 강의보고서 페이지 타이틀 「」 안에 넣는 강의명 — 일정명 우선, 없으면 프로그램명 */
export function resolveLectureReportLectureName(
  program: { title?: string } | null | undefined,
  assignment: LectureReportAssignment | undefined,
): string {
  return (
    toDisplayEducationScheduleName(assignment?.scheduleName) ||
    program?.title?.trim() ||
    '강의'
  )
}

export function buildLectureReportPageTitle(lectureName: string): string {
  const trimmed = lectureName.trim() || '강의'
  return `JA KOREA 「${trimmed}」 ${LECTURE_REPORT_DOCUMENT_TITLE}`
}
