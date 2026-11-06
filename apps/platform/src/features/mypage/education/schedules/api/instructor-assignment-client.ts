import type { LectureReportAssignment } from './lecture-report-client'

/*
 * 강사 마이페이지 > 강의 상세 > 배정 현황 탭.
 *
 * 존재하지 않는 endpoint는 호출하지 않는다:
 * - GET .../instructor-assignments
 * - GET .../instructor-assignment-waitings
 *
 * 배정된 목록 SSOT:
 * GET /api/portal/me/programs/{programId}/lecture-report-assignments
 *
 * 신청 대기 상태(결과 대기·서류 합격 등)는
 * GET /api/portal/me/program-applications?applicationType=INSTRUCTOR 의 displayStatus를 쓴다.
 * 배정 대기 목록을 assignment 부재로 추론하지 않는다.
 */

export type InstructorAssignmentRole = 'LEAD' | 'ASSISTANT'

export type InstructorAssignmentItem = {
  assignmentId: number
  /** lecture-report-assignments에는 없음 — 기관 묶음은 institutionName 사용 */
  organizationApplicationId: number | null
  scheduleId: number
  institutionName: string | null
  grade: string | number | null
  requestedGrade: string | number | null
  instructorRole: InstructorAssignmentRole | string | null
  institutionAddress: string | null
  scheduleLocation: string | null
  startAt: string | null
  endAt: string | null
  sessionNo: number | null
  scheduleName: string | null
  scheduleRole?: string | null
  educationSlotKey?: string | null
  scheduleKind?: string | null
  curriculumSessionCount?: number | null
  distanceKm: number | null
  distanceStatus: string | null
}

/** 배정 대기 API가 없으므로 타입만 유지(항상 빈 목록). 신규 mock/fallback endpoint 금지. */
export type InstructorAssignmentWaitingItem = {
  rowKey: string
  organizationApplicationId: number | null
  scheduleId: number | null
  educationPeriodIndex: number | null
  institutionName: string | null
  requestedGrade: string | number | null
  institutionAddress: string | null
  scheduleLocation: string | null
  distanceKm: number | null
  distanceStatus: string | null
  startAt: string | null
  endAt: string | null
  sessionNo: number | null
  scheduleName: string | null
  dateRangeLabel: string | null
  status: 'WAITING' | 'UNAVAILABLE' | 'CANCELLED'
  unavailableReason: 'SCHEDULE_CONFLICT' | 'CAPACITY_FULL' | null
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

/** lecture-report-assignments item → 배정 현황 패널 행 */
export function mapLectureReportAssignmentToInstructorItem(
  row: LectureReportAssignment,
): InstructorAssignmentItem {
  const distanceKm = asFiniteNumber(row.distanceFromHome)
  return {
    assignmentId: row.assignmentId,
    organizationApplicationId: null,
    scheduleId: row.scheduleId,
    institutionName: row.institutionName,
    grade: row.grade,
    requestedGrade: null,
    instructorRole: row.instructorRole ?? null,
    institutionAddress: row.institutionAddress ?? null,
    scheduleLocation: row.institutionAddress ?? row.institutionName ?? null,
    startAt: row.startAt,
    endAt: row.endAt,
    sessionNo: row.sessionNo,
    scheduleName: row.scheduleName,
    scheduleRole: row.scheduleRole ?? null,
    educationSlotKey: row.educationSlotKey ?? null,
    scheduleKind: row.scheduleKind ?? null,
    curriculumSessionCount: row.curriculumSessionCount ?? null,
    distanceKm,
    distanceStatus: distanceKm != null ? 'CALCULATED' : null,
  }
}
