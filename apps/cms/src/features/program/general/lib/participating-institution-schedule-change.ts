/**
 * 일반 기관형 참여 기관 상세 — 신청 정보 수정 모드 「교육 진행 일정 변경」(시안 02-1·02-2).
 *
 * 교육 진행 일정 행(ParticipatingSchoolSession)을 공유 `EducationScheduleChangeModal`이 읽는 일정 문자열로 바꾸고,
 * 선택 완료된 변경분을 `PATCH …/participants/{participantId}/schedules` 요청(fromDate → toDate)으로 만든다.
 * 저장은 [정보 수정 → 저장] 시점에만 보낸다.
 */

import dayjs from 'dayjs'
import type { DateValue } from '@/types'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { buildSameDateScheduleChangePairs } from '@/features/program/shared/lib/education-schedule-change'

export const PARTICIPATING_INSTITUTION_SCHEDULE_CHANGE_DESCRIPTION =
  '일정은 아래 교육 진행 기간 내에서만 변경할 수 있습니다.'

export const PARTICIPATING_INSTITUTION_SCHEDULE_SELECTED_TITLE = '일정 선택 완료'
export const PARTICIPATING_INSTITUTION_SCHEDULE_SELECTED_CONTENT =
  '변경할 교육 일정이 선택되었습니다.\n일정은 아직 저장 전이며, [정보 수정] 버튼을 눌러야 최종 반영됩니다.'

function toValidDayjs(raw: string | null | undefined) {
  if (!raw?.trim()) return null
  const parsed = dayjs(raw)
  return parsed.isValid() ? parsed : null
}

/** 세션 → 변경 모달 일정 문자열. 원본 ISO 시각을 우선하고, 없으면 표시 날짜·시간을 쓴다. */
export function buildParticipatingInstitutionScheduleChangeLine(
  session: ParticipatingSchoolSession
): string {
  const start = toValidDayjs(session.startAt)
  const end = toValidDayjs(session.endAt)
  if (start && end) return formatEducationScheduleLineFromRange([start, end])
  const date = session.date?.trim() ?? ''
  const time = session.timeRange?.trim() ?? ''
  return [date, time].filter(Boolean).join(' ')
}

/** 모달 「교육 진행 기간」 행 — 운영 시작~종료(날짜만) */
export function formatParticipatingInstitutionScheduleChangePeriod(
  start: DateValue | null | undefined,
  end: DateValue | null | undefined
): string | undefined {
  const startDay = start ? dayjs(start as string | number | Date) : null
  const endDay = end ? dayjs(end as string | number | Date) : null
  if (!startDay?.isValid() || !endDay?.isValid()) return undefined
  return formatEducationScheduleLineFromRange([startDay.startOf('day'), endDay.startOf('day')])
}

/** 저장 시 보낼 일정 변경 쌍(날짜 단위, 중복 제거) */
export function buildParticipatingInstitutionScheduleChangeRequests(
  previousLines: readonly string[],
  nextLines: readonly string[]
): Array<{ fromDate: string; toDate: string }> {
  return buildSameDateScheduleChangePairs(previousLines, nextLines)
}
