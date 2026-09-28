/**
 * 프로그램 수정 가능 기간.
 * 공통 정보는 `businessEndDate`(도메인 `endDate`) 당일까지, 한국 시간 다음 날 00:00부터 불가.
 * 모집·신청 잠금은 유형별 `recruitments[].startAt`. `operationStartDate`로 잠그지 않는다.
 * `startAt`이 없으면 아직 시작 전이다. `now`가 그 시각이 속한 분 이상이면 저장할 수 없다.
 */

import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import { PROGRAM_RECRUITMENT_EDIT_PERIOD_ENDED_MESSAGE } from '@/shared/lib/program-edit-window-error-message'

export type ProgramRecruitmentEditType = 'PARTICIPANT' | 'INSTRUCTOR' | 'VOLUNTEER'

const MINUTE_MS = 60_000
const SEOUL_TIME_ZONE = 'Asia/Seoul'

export function toProgramRecruitmentWindows(
  recruitments:
    | Array<{
        recruitmentType?: string
        targetType?: string
        startAt?: string | null
      }>
    | null
    | undefined
): ProgramRecruitmentWindow[] | undefined {
  if (!recruitments?.length) return undefined
  return recruitments.map(row => ({
    recruitmentType: row.recruitmentType,
    targetType: row.targetType,
    startAt: row.startAt ?? null,
  }))
}

function seoulCalendarDate(value: string | Date): string | null {
  if (typeof value === 'string') {
    const dateOnly = value.trim().match(/^(\d{4}-\d{2}-\d{2})$/)
    if (dateOnly) return dateOnly[1]
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  if (!year || !month || !day) return null
  return `${year}-${month}-${day}`
}

/** 사업 종료일 당일(Asia/Seoul)까지 공통 정보 저장 가능. 종료일이 없으면 막지 않는다. */
export function isCommonInfoEditPeriodOpen(
  businessEndDate: string | Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (businessEndDate == null) return true
  if (typeof businessEndDate === 'string' && !businessEndDate.trim()) return true
  const endKey = seoulCalendarDate(businessEndDate)
  const todayKey = seoulCalendarDate(now)
  if (!endKey || !todayKey) return true
  return todayKey <= endKey
}

/** `startAt`이 속한 분부터 잠금. null·빈 값·파싱 실패는 잠그지 않는다. */
export function isRecruitmentStartLocked(
  startAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (startAt == null || !startAt.trim()) return false
  const startMs = Date.parse(startAt)
  if (Number.isNaN(startMs)) return false
  return Math.floor(now.getTime() / MINUTE_MS) >= Math.floor(startMs / MINUTE_MS)
}

export function isProgramRecruitmentTypeLocked(
  program: Program | null | undefined,
  recruitmentType: ProgramRecruitmentEditType,
  now: Date = new Date()
): boolean {
  const rows = (program?.programRecruitments ?? []).filter(
    row => row.recruitmentType === recruitmentType
  )
  if (rows.length === 0) return false
  return rows.some(row => isRecruitmentStartLocked(row.startAt, now))
}

export function recruitmentEditTypeForDetailTab(
  tab: 'institutions' | 'instructors' | 'volunteers'
): ProgramRecruitmentEditType {
  if (tab === 'instructors') return 'INSTRUCTOR'
  if (tab === 'volunteers') return 'VOLUNTEER'
  return 'PARTICIPANT'
}

/**
 * form-binding `targetType` / `targetRole` → 모집 유형.
 * 요청에 값이 있으면 그 값, 없으면 저장된 바인딩 값으로 잠근다.
 */
export function resolveRecruitmentTypeForFormBinding(
  targetType?: string | null,
  targetRole?: string | null
): ProgramRecruitmentEditType | null {
  const raw = (targetType?.trim() || targetRole?.trim() || '').toUpperCase()
  if (!raw) return null
  if (
    raw === 'PARTICIPANT' ||
    raw === 'ORGANIZATION' ||
    raw === 'INDIVIDUAL' ||
    raw === 'SCHOOL' ||
    raw === 'BOTH'
  ) {
    return 'PARTICIPANT'
  }
  if (raw === 'INSTRUCTOR' || raw === 'TEACHER') return 'INSTRUCTOR'
  if (raw === 'VOLUNTEER' || raw === 'COLLEGE_STUDENT' || raw === 'STUDENT') return 'VOLUNTEER'
  return null
}

export function isProgramFormBindingWriteLocked(
  program: Program | null | undefined,
  targetType?: string | null,
  targetRole?: string | null,
  now: Date = new Date()
): boolean {
  const recruitmentType = resolveRecruitmentTypeForFormBinding(targetType, targetRole)
  if (!recruitmentType) return false
  return isProgramRecruitmentTypeLocked(program, recruitmentType, now)
}

export function assertProgramFormBindingWritable(
  program: Program,
  targetType?: string | null,
  targetRole?: string | null,
  now: Date = new Date()
): void {
  if (!isProgramFormBindingWriteLocked(program, targetType, targetRole, now)) return
  throw new Error(PROGRAM_RECRUITMENT_EDIT_PERIOD_ENDED_MESSAGE)
}
