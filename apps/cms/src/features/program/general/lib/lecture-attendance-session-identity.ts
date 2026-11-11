import { PRE_EDUCATION_DISPLAY_LABEL } from '@/features/program/general/lib/schedule-detail-form'
import type { LectureAttendanceSession } from '@/features/program/general/model/school-detail-types'

/** 사전교육 행 roundNumber — 회차 번호가 아니며 본교육 회차를 밀지 않는다. */
export const PRE_EDUCATION_LECTURE_ROUND_NUMBER = 0

/** 강의 출석 행 식별 — scheduleId 우선, 없으면(목업) 회차 번호 */
export function lectureAttendanceSessionKey(
  session: Pick<LectureAttendanceSession, 'scheduleId' | 'roundNumber'>
): string {
  if (session.scheduleId != null) return `schedule:${session.scheduleId}`
  return `round:${session.roundNumber ?? 'unknown'}`
}

/**
 * 강의 출석 행 라벨 — 사전교육은 「사전교육」, 교육 구조별 라벨(`sessionLabel`)이 있으면 그 값,
 * 회차 번호가 있으면 「N회차」, 없으면 빈 값(회차를 지어내지 않는다)
 */
export function formatLectureAttendanceSessionLabel(
  session: Pick<LectureAttendanceSession, 'roundNumber' | 'preEducation' | 'sessionLabel'>
): string {
  if (session.preEducation) return PRE_EDUCATION_DISPLAY_LABEL
  const label = session.sessionLabel?.trim()
  if (label) return label
  const roundNumber = session.roundNumber
  return roundNumber != null && Number.isInteger(roundNumber) && roundNumber > 0
    ? `${roundNumber}회차`
    : ''
}
