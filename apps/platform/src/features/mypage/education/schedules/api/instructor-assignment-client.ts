import type { GeminiLectureScheduleItem } from '../../settlements/lib/gemini-settlement-status'
import type { LectureReportAssignment } from './lecture-report-client'

/*
 * 강사 마이페이지 > 강의 상세 > 배정 현황 탭.
 *
 * 존재하지 않는 endpoint는 호출하지 않는다:
 * - GET .../instructor-assignments
 * - GET .../instructor-assignment-waitings
 *
 * 배정된 목록 SSOT:
 * - 제미나이: GET /api/portal/me/program-applications/INSTRUCTOR/{applicationId}/gemini-lecture-schedules
 *   (제미나이 배정은 기관 신청 ID 없이 일정↔기관(OSA)으로 연결되어 lecture-report-assignments에는 기관 정보가 없다)
 * - 그 외: GET /api/portal/me/programs/{programId}/lecture-report-assignments
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
  /** Gemini 정산 인정 차시(recognizedClassCount). 커리큘럼 차시 수와 별개. */
  recognizedClassCount?: number | null
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

/** gemini-lecture-schedules 클라이언트 타입은 string | number — 숫자로만 받는다. */
function asNumericKm(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asPositiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

/** 서버 LocalDate + LocalTime(서울 기준) → `yyyy-MM-ddTHH:mm:ss+09:00`. 없으면 null */
function seoulDateTime(date: string | null | undefined, time: string | null | undefined): string | null {
  const day = date?.trim() ?? ''
  const clock = time?.trim() ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(clock)
  if (!match) return null
  return `${day}T${match[1]}:${match[2]}:${match[3] ?? '00'}+09:00`
}

/** lecture-report-assignments item → 배정 현황 패널 행 */
export function mapLectureReportAssignmentToInstructorItem(
  row: LectureReportAssignment,
): InstructorAssignmentItem {
  /** 계약상 number(km). 문자열은 파싱하지 않는다. */
  const distanceKm =
    typeof row.distanceFromHome === 'number' && Number.isFinite(row.distanceFromHome)
      ? row.distanceFromHome
      : null
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

/**
 * gemini-lecture-schedules item → 배정 현황 패널 행.
 * 응답에 있는 값만 쓴다. 단위 라벨은 서버 인정 차시(recognizedClassCount) → `N차시`.
 * 인정 차시는 커리큘럼 차시 수(curriculumSessionCount)에 넣지 않는다.
 */
export function mapGeminiLectureScheduleToInstructorItem(
  row: GeminiLectureScheduleItem,
  index: number,
): InstructorAssignmentItem {
  const distanceKm = asNumericKm(row.distanceFromHome)
  const scheduleId = row.scheduleId ?? -(index + 1)
  return {
    assignmentId: scheduleId,
    organizationApplicationId: null,
    scheduleId,
    institutionName: row.institutionName ?? null,
    grade: row.grade ?? null,
    requestedGrade: null,
    instructorRole: row.instructorRole ?? null,
    institutionAddress: row.institutionAddress ?? null,
    scheduleLocation: row.institutionAddress ?? row.institutionName ?? null,
    startAt: row.startAt ?? seoulDateTime(row.trainingDate, row.trainingStartTime),
    endAt: row.endAt ?? seoulDateTime(row.trainingDate, row.trainingEndTime),
    sessionNo: null,
    scheduleName: null,
    scheduleRole: null,
    educationSlotKey: null,
    scheduleKind: null,
    curriculumSessionCount: null,
    recognizedClassCount: asPositiveInt(row.recognizedClassCount),
    distanceKm,
    distanceStatus: distanceKm != null ? 'CALCULATED' : null,
  }
}
