/**
 * 일반 기관 · 기간 지정 — 승인 후 「희망 일정 확정」.
 * PUT …/schedule-assignments { requestedScheduleIds }로 희망 일정 행을 실제 기관 일정으로 확정한다.
 * 승인 모달(requestedScheduleIds)과 같은 상한·지난 일정 규칙을 쓴다.
 */
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import { isRequestedScheduleStartPassed } from '@/features/program/general/lib/organization-application-approve-slots'
import { formatOrganizationApproveScheduleCardTitle } from '@/features/program/general/lib/organization-preferred-schedule-label'

export type RequestedScheduleConfirmOption = {
  requestedScheduleId: number
  label: string
  /** 이미 실제 일정과 연결된 행 (현재 확정 상태) */
  confirmed: boolean
}

function readClock(raw: string | null | undefined): string | null {
  const match = raw?.trim().match(/^(\d{1,2}):(\d{2})/)
  return match ? `${match[1]!.padStart(2, '0')}:${match[2]}` : null
}

function positiveId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

/** `2026.11.08(일) 09:00 ~ 10:00 · 1지망 · 3차시` */
export function formatRequestedScheduleConfirmLabel(row: RequestedScheduleResponse): string {
  const date = (row.requestedDate ?? row.periodStartDate ?? '').trim()
  const dateLabel = formatOrganizationApproveScheduleCardTitle(date, date) || date || '-'
  const first = row.sessionTimes?.[0]
  const start = readClock(first?.startTime)
  const end = readClock(first?.endTime)
  const timeLabel = start && end ? `${start} ~ ${end}` : start ?? ''
  const parts = [
    [dateLabel, timeLabel].filter(Boolean).join(' '),
    row.preferenceOrder != null ? `${row.preferenceOrder}지망` : '',
    positiveId(row.sessionCount) != null ? `${row.sessionCount}차시` : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

export function buildRequestedScheduleConfirmOptions(
  rows: readonly RequestedScheduleResponse[] | null | undefined,
  now: Date = new Date()
): RequestedScheduleConfirmOption[] {
  return [...(rows ?? [])]
    // 시작 시각이 지난 희망 일정은 확정할 수 없어(서버 409) 목록에서 뺀다.
    .filter(row => positiveId(row.id) != null && !isRequestedScheduleStartPassed(row, now))
    .sort(
      (left, right) =>
        (left.preferenceOrder ?? 99) - (right.preferenceOrder ?? 99) ||
        (left.id ?? 0) - (right.id ?? 0)
    )
    .map(row => ({
      requestedScheduleId: row.id as number,
      label: formatRequestedScheduleConfirmLabel(row),
      confirmed:
        positiveId(row.resolvedScheduleId) != null || (row.resolvedScheduleIds?.length ?? 0) > 0,
    }))
}

/** 확정 액션 노출 — 일반 기관(1사1교 제외) · 기간 지정 · 희망 일정 행이 있을 때 */
export function shouldShowRequestedScheduleConfirmAction(input: {
  isGeneralOrganization: boolean
  isCompanySchool: boolean
  educationScheduleMode: string | null | undefined
  options: readonly RequestedScheduleConfirmOption[]
}): boolean {
  if (!input.isGeneralOrganization || input.isCompanySchool) return false
  if (String(input.educationScheduleMode ?? '').trim().toLowerCase() !== 'period') return false
  return input.options.length > 0
}

/** 전 행이 미확정이면 「희망 일정 확정」, 하나라도 확정돼 있으면 「희망 일정 변경」 */
export function hasConfirmedRequestedSchedule(
  options: readonly RequestedScheduleConfirmOption[]
): boolean {
  return options.some(option => option.confirmed)
}

/** 처음 열 때 선택 상태 — 이미 확정된 행 */
export function initialRequestedScheduleConfirmSelection(
  options: readonly RequestedScheduleConfirmOption[]
): number[] {
  return options.filter(option => option.confirmed).map(option => option.requestedScheduleId)
}
