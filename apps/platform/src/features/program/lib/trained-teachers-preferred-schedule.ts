/**
 * 교육받은교사(TRAINED_TEACHER) 기관 신청 — 기간형 진행 희망 교육 일정의 차시·교시 줄.
 *
 * - 차시 = 그날 수업 개수(희망 차시 셀렉). 교시 = 각 차시가 들어가는 학교 시간표 번호.
 * - 희망 차시 수만큼 「N차시 희망 교육 시간」(교시 + 시작~종료) 줄이 생긴다.
 * - 1사1교(`economy-preferred-schedule.ts`)와 같은 구조: 다음 차시 교시는 앞 차시 + 1로 자동 입력.
 *   단, 교육받은교사는 연강 규칙 근거가 없어 자동 입력값을 사용자가 고칠 수 있다.
 * - 전송: `sessionCount` = 차시 수(= sessionTimes 줄 수), `sessionTimes[i].classPeriod` = 그 차시의 교시.
 *   교시 번호를 sessionCount로 보내지 않는다.
 */

import type {
  ApplyPreferredScheduleBlock,
  ApplyPreferredScheduleSessionTime,
} from '../ui/apply-preferred-schedule/apply-preferred-schedule'
import type { PortalPreferredScheduleSessionTime } from '../api/application-types'
import { resolveEconomySecondClassPeriod } from './economy-preferred-schedule.ts'

/**
 * 모집 1일 최대 차시(maxSessionsPerDay)를 받지 못했을 때의 희망 차시 상한.
 * 1사1교 희망 차시 셀렉(1·2차시)·OpenAPI `RequestedScheduleRequest.sessionCount` max 2와 같다.
 */
export const TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_FALLBACK_MAX = 2

/** OpenAPI `PreferredScheduleBlockRequest.sessionTimes` maxItems */
const TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_HARD_MAX = 16

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
  const max =
    typeof maxSessionsPerDay === 'number' &&
    Number.isInteger(maxSessionsPerDay) &&
    maxSessionsPerDay > 0
      ? Math.min(maxSessionsPerDay, TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_HARD_MAX)
      : TRAINED_TEACHERS_PREFERRED_SESSION_COUNT_FALLBACK_MAX
  return Array.from({ length: max }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}차시`,
  }))
}

export function readTrainedTeachersSessionCount(
  block: Pick<ApplyPreferredScheduleBlock, 'sessionCount'>,
): number {
  const raw = block.sessionCount?.trim() ?? ''
  if (!/^\d+$/.test(raw)) return 0
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? value : 0
}

function emptySessionTime(classPeriod = ''): ApplyPreferredScheduleSessionTime {
  return { classPeriod, startTime: '', endTime: '' }
}

/** 차시 수에 맞춰 줄을 늘리거나 줄인다. 새 줄 교시는 앞 차시 + 1로 채운다. */
export function resizeTrainedTeachersSessionTimes(
  times: readonly ApplyPreferredScheduleSessionTime[] | undefined,
  count: number,
): ApplyPreferredScheduleSessionTime[] {
  const next = (times ?? []).slice(0, Math.max(0, count)).map(row => ({ ...row }))
  while (next.length < count) {
    const previous = next[next.length - 1]
    next.push(emptySessionTime(previous ? resolveEconomySecondClassPeriod(previous.classPeriod) : ''))
  }
  return next
}

/**
 * 한 차시 줄을 고친다. 교시를 바꾸면 뒤 차시 중 비었거나 자동 입력값(앞 차시 + 1) 그대로인 줄만
 * 다시 앞 차시 + 1로 맞춘다. 사용자가 직접 고친 교시는 덮어쓰지 않는다.
 */
export function patchTrainedTeachersSessionTime(
  times: readonly ApplyPreferredScheduleSessionTime[],
  index: number,
  patch: Partial<ApplyPreferredScheduleSessionTime>,
): ApplyPreferredScheduleSessionTime[] {
  const previousRows = times.map(row => ({ ...row }))
  const next = previousRows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
  if (patch.classPeriod === undefined) return next
  for (let rowIndex = index + 1; rowIndex < next.length; rowIndex += 1) {
    const oldAuto = resolveEconomySecondClassPeriod(previousRows[rowIndex - 1]!.classPeriod)
    const current = previousRows[rowIndex]!.classPeriod.trim()
    if (current !== '' && current !== oldAuto) break
    next[rowIndex] = {
      ...next[rowIndex]!,
      classPeriod: resolveEconomySecondClassPeriod(next[rowIndex - 1]!.classPeriod),
    }
  }
  return next
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
