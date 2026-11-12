/**
 * 교육받은교사(TRAINED_TEACHER) 기관 신청 — 기간형 진행 희망 교육 일정의 차시·교시 줄.
 *
 * - 차시 = 그날 수업 개수(희망 차시 셀렉). 교시 = 각 차시가 들어가는 학교 시간표 번호.
 * - 희망 차시 수만큼 「N차시 희망 교육 시간」(교시 + 시작~종료) 줄이 생긴다.
 * - 차시마다 교시·시간을 따로 입력한다(연강이 아니어도 됨, 예: 1교시·4교시).
 *   1사1교의 「다음 교시 자동 입력(앞 차시 + 1)」은 적용하지 않는다 — 새 차시 줄은 빈 교시로 시작.
 * - 전송: `sessionCount` = 차시 수(= sessionTimes 줄 수), `sessionTimes[i].classPeriod` = 그 차시의 교시.
 *   교시 번호를 sessionCount로 보내지 않는다.
 */

import {
  buildTrainedTeachersPreferredSessionCountOptions,
  TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_FALLBACK_MAX,
} from '@jakorea/form-schema/program-application'
import type {
  ApplyPreferredScheduleBlock,
  ApplyPreferredScheduleSessionTime,
} from '../ui/apply-preferred-schedule/apply-preferred-schedule'
import type { PortalPreferredScheduleSessionTime } from '../api/application-types'

/**
 * 희망 차시 상한 규칙(값 있으면 그 값·상한 16, 없으면 2차시)은 CMS 신청 양식 미리보기와 공유한다
 * (`@jakorea/form-schema/program-application` trained-teachers-preferred-session-count).
 */
export { TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_FALLBACK_MAX }

export const TRAINED_TEACHERS_PREFERRED_SCHEDULE_INCOMPLETE_MESSAGE =
  '진행 희망 교육 일정에 날짜·희망 차시·차시별 수업 진행 교시·시작/종료 시간을 모두 입력해 주세요.'

/**
 * 희망 차시 셀렉 선택지 `1차시` … `N차시`.
 * N = 모집 1일 최대 차시(CMS 교육받은교사 모집 `maxSessionsPerDay` — CMS도 희망 일정 차시 줄 수를 이 값으로 막는다).
 * 값이 없으면 1사1교와 같은 2차시.
 */
export function buildTrainedTeachersSessionCountOptions(
  maxSessionsPerDay?: number | null,
): { value: string; label: string }[] {
  return buildTrainedTeachersPreferredSessionCountOptions(maxSessionsPerDay)
}

export function readTrainedTeachersSessionCount(
  block: Pick<ApplyPreferredScheduleBlock, 'sessionCount'>,
): number {
  const raw = block.sessionCount?.trim() ?? ''
  if (!/^\d+$/.test(raw)) return 0
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? value : 0
}

function emptySessionTime(): ApplyPreferredScheduleSessionTime {
  return { classPeriod: '', startTime: '', endTime: '' }
}

/** 차시 수에 맞춰 줄을 늘리거나 줄인다. 새 줄은 교시·시간 모두 빈 값으로 시작한다. */
export function resizeTrainedTeachersSessionTimes(
  times: readonly ApplyPreferredScheduleSessionTime[] | undefined,
  count: number,
): ApplyPreferredScheduleSessionTime[] {
  const next = (times ?? []).slice(0, Math.max(0, count)).map(row => ({ ...row }))
  while (next.length < count) next.push(emptySessionTime())
  return next
}

/** 한 차시 줄만 고친다. 다른 차시 줄의 교시는 바꾸지 않는다. */
export function patchTrainedTeachersSessionTime(
  times: readonly ApplyPreferredScheduleSessionTime[],
  index: number,
  patch: Partial<ApplyPreferredScheduleSessionTime>,
): ApplyPreferredScheduleSessionTime[] {
  return times.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : { ...row }))
}

function normalizeTime(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return trimmed
  return `${match[1]!.padStart(2, '0')}:${match[2]}`
}

/**
 * 완전 입력된 블록의 sessionTimes. 희망 차시가 없거나 줄 중 하나라도 비면 null.
 * sessionIndex = 차시 순번(1-based), classPeriod = 입력 교시.
 */
export function toTrainedTeachersPortalSessionTimes(
  block: Pick<ApplyPreferredScheduleBlock, 'sessionCount' | 'sessionTimes'>,
): PortalPreferredScheduleSessionTime[] | null {
  const count = readTrainedTeachersSessionCount(block)
  if (count < 1) return null
  const rows = (block.sessionTimes ?? []).slice(0, count)
  if (rows.length !== count) return null
  const out: PortalPreferredScheduleSessionTime[] = []
  for (const [index, row] of rows.entries()) {
    const classPeriod = row.classPeriod.trim()
    const startTime = normalizeTime(row.startTime)
    const endTime = normalizeTime(row.endTime)
    if (!classPeriod || !startTime || !endTime) return null
    out.push({
      sessionIndex: index + 1,
      classPeriod,
      startTime,
      endTime,
      timeRange: `${startTime}~${endTime}`,
    })
  }
  return out
}

export function hasTrainedTeachersSessionInput(
  block: Pick<ApplyPreferredScheduleBlock, 'sessionCount' | 'sessionTimes'>,
): boolean {
  if (block.sessionCount?.trim()) return true
  return (block.sessionTimes ?? []).some(row =>
    Boolean(row.classPeriod.trim() || row.startTime.trim() || row.endTime.trim()),
  )
}
