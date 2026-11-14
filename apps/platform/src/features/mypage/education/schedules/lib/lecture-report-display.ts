import type { LectureReportAssignment } from '../api/lecture-report-client'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'

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
