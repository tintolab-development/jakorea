import dayjs from 'dayjs'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

/**
 * 1사1교 강사 신청 상세 「강의 진행 가능 일정」 — 강사가 고른 승인 기관 희망 일정(availableScheduleSlots).
 * 한 줄 = `YYYY년 M월 D일 (HH:mm ~ HH:mm)`. 교육 예정일 구간 라벨(label)이 있으면 그 라벨을 쓴다.
 * 일정이 없으면 빈 배열(값을 지어내지 않는다). QA 2026-11-13 1사1교 #13.
 */
export function buildCompanySchoolInstructorAvailableScheduleLines(
  row: Pick<ApplicantInstructorRow, 'preferredScheduleSlots'> | null | undefined
): string[] {
  const lines: string[] = []
  const seen = new Set<string>()
  const slots = [...(row?.preferredScheduleSlots ?? [])].sort((a, b) =>
    (a.startAt ?? '').localeCompare(b.startAt ?? '')
  )
  for (const slot of slots) {
    const line = formatSlotLine(slot)
    if (!line || seen.has(line)) continue
    seen.add(line)
    lines.push(line)
  }
  return lines
}

function formatSlotLine(slot: { startAt?: string; endAt?: string; label?: string | null }): string {
  const label = slot.label?.trim()
  if (label) return label
  const start = slot.startAt ? dayjs(slot.startAt) : null
  if (!start?.isValid()) return ''
  const end = slot.endAt ? dayjs(slot.endAt) : null
  const date = start.format('YYYY년 M월 D일')
  const startClock = start.format('HH:mm')
  const endClock = end?.isValid() ? end.format('HH:mm') : ''
  if (startClock === '00:00' && (!endClock || endClock === '00:00')) return date
  const time = endClock && endClock !== startClock ? `${startClock} ~ ${endClock}` : startClock
  return `${date} (${time})`
}
