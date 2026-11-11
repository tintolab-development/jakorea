import { formatAssignmentEducationUnitLabel } from './instructor-education-schedule-display.ts'

const INSTITUTION_ASSIGNMENT_PROGRAM_TYPES = new Set([
  'GENERAL_ORGANIZATION',
  'GEMINI_TRAINING',
  'GEMINI',
  'VISITING_TRAINING',
])

/**
 * 현재 응답 계약으로 기관 배정 현황을 조회할 수 있는 프로그램 유형 후보.
 * GENERAL_INDIVIDUAL은 기관 신청 관계가 없으므로 `supportsInstructorIndividualAssignment`로 따로 판단한다.
 * COMPANY_SCHOOL은 선택적 지원이므로 신규 overview API의 지원 여부 응답 전까지
 * 이 조회로 기관 배정 현황을 노출하지 않는다.
 */
export function supportsInstructorInstitutionAssignment(
  programType: string | null | undefined,
): boolean {
  return INSTITUTION_ASSIGNMENT_PROGRAM_TYPES.has(programType?.trim().toUpperCase() ?? '')
}

/**
 * 일반 개인형 강의현황 — 기관 신청 관계 없이 본인 배정 일정만 배정 현황 탭으로 노출한다.
 * 강의현황 상세에는 강의 일정 탭이 없다(배정 현황이 첫 번째 탭).
 */
export function supportsInstructorIndividualAssignment(
  programType: string | null | undefined,
): boolean {
  return programType?.trim().toUpperCase() === 'GENERAL_INDIVIDUAL'
}

/** API가 숫자·문자 혼용으로 내려도 화면이 깨지지 않게 표시 문자열만 만든다. */
export function asAssignmentDisplayText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export function displayAssignmentValueOrDash(value: unknown): string {
  return asAssignmentDisplayText(value) || '-'
}

/**
 * 서버 역할 값 → 표시 라벨 (기획: 대표 강사·일반 강사, CMS `INSTRUCTOR_ROLE_LABELS`와 동일).
 * BE `GeminiPortalAssignmentSupport.instructorRole`: is_schedule_lead true → LEAD, false → ASSISTANT, 미설정 → null.
 */
export function formatInstructorRole(raw: unknown): string {
  const display = asAssignmentDisplayText(raw)
  const value = display.toUpperCase()
  if (!value) return '-'
  if (
    value === 'LEAD' ||
    value === 'MAIN' ||
    value === 'REPRESENTATIVE' ||
    value === '대표 강사' ||
    value.includes('LEAD')
  ) {
    return '대표 강사'
  }
  if (value === 'ASSISTANT' || value === '보조 강사' || value === 'GENERAL' || value === 'MEMBER' || value === '일반 강사' || value.includes('GENERAL')) {
    return '일반 강사'
  }
  return display || '-'
}

/** 자택과의 거리. 서버 값(km, 소수 둘째 자리)을 재계산하지 않고 단위만 붙인다. */
export function formatAssignmentDistanceKm(value: unknown): string {
  const text = asAssignmentDisplayText(value)
  return text ? `${text} km` : '-'
}

/**
 * 배정된 목록 행 묶음
 * (SSOT: GET /api/portal/me/programs/{programId}/lecture-report-assignments).
 * - 기관형·제미나이: (organizationApplicationId 또는 institutionName + 역할 + grade)로 묶는다.
 *   같은 기관이어도 역할·학년이 다르면 다른 행. requestedGrade는 그룹 키로 쓰지 않는다.
 * - 개인형(기관명·orgAppId 없음): 일정(scheduleId)마다 한 행.
 * 서버 정렬 순서를 그대로 유지한다.
 */
export function groupAssignmentsByInstitution<
  T extends {
    assignmentId: number
    organizationApplicationId: number | null
    scheduleId?: number | null
    instructorRole?: unknown
    grade?: unknown
    institutionName?: unknown
  },
>(items: readonly T[]): Array<{ key: string; items: T[] }> {
  const groups = new Map<string, T[]>()
  items.forEach(item => {
    const institutionName = asAssignmentDisplayText(item.institutionName)
    const key =
      item.organizationApplicationId != null
        ? `organization:${JSON.stringify([
            item.organizationApplicationId,
            asAssignmentDisplayText(item.instructorRole).toUpperCase(),
            asAssignmentDisplayText(item.grade),
          ])}`
        : institutionName
          ? `institution:${JSON.stringify([
              institutionName,
              asAssignmentDisplayText(item.instructorRole).toUpperCase(),
              asAssignmentDisplayText(item.grade),
            ])}`
          : item.scheduleId != null
            ? `schedule:${item.scheduleId}`
            : `assignment:${item.assignmentId}`
    const current = groups.get(key)
    if (current) current.push(item)
    else groups.set(key, [item])
  })
  return Array.from(groups, ([key, groupItems]) => ({ key, items: groupItems }))
}

/**
 * 배정 대기 목록 상태 표시.
 * instructor-assignment-waitings API는 존재하지 않으므로 신규 호출/목 생성 금지.
 * 신청 대기(결과 대기 등)는 program-applications.displayStatus를 쓴다.
 */
export type AssignmentWaitingStatusView = {
  tone: 'waiting' | 'unavailable' | 'cancelled'
  label: string
  disabled: boolean
}

export function formatAssignmentWaitingStatus(status: unknown): AssignmentWaitingStatusView {
  const code = asAssignmentDisplayText(status).toUpperCase()
  if (code === 'UNAVAILABLE') {
    return { tone: 'unavailable', label: '배정 불가', disabled: true }
  }
  if (code === 'CANCELLED' || code === 'CANCELED') {
    return { tone: 'cancelled', label: '배정 취소', disabled: false }
  }
  return { tone: 'waiting', label: '배정 대기', disabled: false }
}

function waitingStartAtTime(startAt: unknown): number | null {
  const text = asAssignmentDisplayText(startAt)
  if (!text) return null
  const time = Date.parse(text)
  return Number.isNaN(time) ? null : time
}

/**
 * 배정 대기 목록 표시 순서(기획 요청으로 이 목록만 FE 정렬).
 * 배정 불가(UNAVAILABLE)는 항상 아래로 모으고, 각 묶음 안에서는 startAt 내림차순(최신 일정 먼저).
 * startAt이 없으면 묶음 맨 끝, 같은 값은 서버 순서 유지(안정 정렬). 행은 제거하지 않는다.
 */
export function sortAssignmentWaitingItems<T extends { status: unknown; startAt?: unknown }>(
  items: readonly T[],
): T[] {
  return items
    .map((item, index) => ({
      item,
      index,
      unavailable: asAssignmentDisplayText(item.status).toUpperCase() === 'UNAVAILABLE',
      time: waitingStartAtTime(item.startAt),
    }))
    .sort((a, b) => {
      if (a.unavailable !== b.unavailable) return a.unavailable ? 1 : -1
      if (a.time !== b.time) {
        if (a.time == null) return 1
        if (b.time == null) return -1
        return b.time - a.time
      }
      return a.index - b.index
    })
    .map(entry => entry.item)
}

/**
 * 교육 일정 줄의 회차·차시·사전교육 자리.
 * 일정형 + 복수 회차는 일정명 우선. 사전교육 canonical은 일정명보다 앞선다.
 * sessionNo는 회차이며 차시로 쓰지 않는다.
 */
export function formatAssignmentSessionLabel(
  item: {
    sessionNo: number | null
    scheduleName: string | null
    scheduleRole?: string | null
    educationSlotKey?: string | null
    scheduleKind?: string | null
    curriculumSessionCount?: number | null
    recognizedClassCount?: number | null
  },
  useScheduleName: boolean,
): string {
  return formatAssignmentEducationUnitLabel(item, useScheduleName)
}
