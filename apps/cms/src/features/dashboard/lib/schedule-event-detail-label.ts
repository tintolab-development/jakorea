import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'

/**
 * 대시보드 프로그램 일정 위젯 일정 유형.
 * `operation`은 운영 시작·종료(BUSINESS_START/END, QA-0382) — 표시 문구는 BE `eventLabel`(목록 캘린더와 같은 문구)을 쓴다.
 */
export type DashboardScheduleEventType =
  | 'education'
  | 'recruitment_deadline'
  | 'recruitment_start'
  | 'operation'

/** 대시보드 주간 캘린더 태그 2줄(설명) 라벨 입력 — GET /dashboard/program-schedules 항목 기준 */
export interface ScheduleEventDetailLabelInput {
  type: DashboardScheduleEventType
  scheduleName?: string | null
  sessionNo?: number | null
  /** BE 추가 예정 필드. 없으면 기관 없이 표기 */
  organizationName?: string | null
  /** BE 추가 예정 필드. 2 이상이면 '{첫 기관명} 외 N곳' */
  organizationCount?: number | null
}

function trimmed(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function positiveInt(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

/**
 * 교육: '{기관명} {회차}회차 {일정명}' (기관 여러 곳이면 '{첫 기관명} 외 N곳 …').
 * 기관·회차·일정명은 없으면 해당 부분만 생략하고, 자동 기본명(`공통 교육 예정 N`)은 일정명에서 제외한다.
 * 모집·운영 일정: 일정명 그대로.
 * 표시할 내용이 없으면 undefined (호출부에서 유형 라벨로 대체).
 */
export function buildScheduleEventDetailLabel(input: ScheduleEventDetailLabelInput): string | undefined {
  if (input.type !== 'education') {
    return trimmed(input.scheduleName) || undefined
  }

  const parts: string[] = []
  const orgName = trimmed(input.organizationName)
  if (orgName) {
    const count = positiveInt(input.organizationCount)
    parts.push(count != null && count > 1 ? `${orgName} 외 ${count - 1}곳` : orgName)
  }
  const sessionNo = positiveInt(input.sessionNo)
  if (sessionNo != null) parts.push(`${sessionNo}회차`)
  const scheduleName = toDisplayEducationScheduleName(input.scheduleName)
  if (scheduleName) parts.push(scheduleName)

  return parts.length > 0 ? parts.join(' ') : undefined
}
