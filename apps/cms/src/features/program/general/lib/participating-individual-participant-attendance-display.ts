import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveParticipatingInstitutionScheduleRowLabel } from '@/features/program/general/lib/participating-school-session-display'
import type { Program } from '@/types/domain'

/** 출석 내역 테이블 — `2026. 04. 03(금) | 오리엔테이션` */
export function formatParticipatingIndividualParticipantAttendanceScheduleLabel(
  program: Program,
  session: ParticipatingSchoolSession
): string {
  const dateLabel = formatCmsScheduleDisplayLabel(
    session.dayOfWeek ? `${session.date}(${session.dayOfWeek})` : session.date
  )
  const scheduleName = resolveParticipatingInstitutionScheduleRowLabel(program, session)
  if (scheduleName === '교육 일정') return dateLabel
  return `${dateLabel} | ${scheduleName}`
}

const MONTH_DAY_LABEL_PATTERN = /^(\d{1,2})월\s+(\d{1,2})일$/
const KOREAN_DATE_PATTERN = /(\d{2,4})년\s+(\d{1,2})월\s+(\d{1,2})일/
const DOTTED_DATE_PATTERN = /(\d{2,4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/

const SEOUL_YMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function toMonthDayLabel(month: string | number, day: string | number): string {
  return `${Number(month)}월 ${Number(day)}일`
}

function formatIsoInstantToSeoulMonthDay(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}(?:[T\s]|$)/.test(value)) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [, month, day] = value.split('-')
    return toMonthDayLabel(month!, day!)
  }
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return null
  const ymd = SEOUL_YMD.format(new Date(parsed))
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!match) return null
  return toMonthDayLabel(match[2], match[3])
}

/** 불참 사유 일자 — `5월 8일` */
export function formatParticipatingIndividualParticipantAttendanceShortDateLabel(
  scheduleLabel: string
): string {
  const pipeIndex = scheduleLabel.indexOf('|')
  const datePart = (pipeIndex >= 0 ? scheduleLabel.slice(0, pipeIndex) : scheduleLabel).trim()
  if (!datePart) return '-'

  const already = MONTH_DAY_LABEL_PATTERN.exec(datePart)
  if (already) return toMonthDayLabel(already[1], already[2])

  const korean = KOREAN_DATE_PATTERN.exec(datePart)
  if (korean) return toMonthDayLabel(korean[2], korean[3])

  const iso = formatIsoInstantToSeoulMonthDay(datePart)
  if (iso) return iso

  const dotted = DOTTED_DATE_PATTERN.exec(datePart)
  if (dotted) return toMonthDayLabel(dotted[2], dotted[3])

  return datePart
}

export function resolveParticipatingIndividualParticipantAbsenceDateLabel(input: {
  scheduleLabel?: string | null
  scheduleStartAt?: string | null
  scheduleName?: string | null
}): string {
  for (const source of [input.scheduleLabel, input.scheduleStartAt, input.scheduleName]) {
    const trimmed = source?.trim()
    if (!trimmed) continue
    const formatted = formatParticipatingIndividualParticipantAttendanceShortDateLabel(trimmed)
    if (MONTH_DAY_LABEL_PATTERN.test(formatted)) return formatted
  }
  const first = [input.scheduleLabel, input.scheduleStartAt, toDisplayEducationScheduleName(input.scheduleName)]
    .map(value => value?.trim())
    .find(Boolean)
  return first
    ? formatParticipatingIndividualParticipantAttendanceShortDateLabel(first)
    : '-'
}
