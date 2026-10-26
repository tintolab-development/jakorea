import dayjs from 'dayjs'
import type { GeneralProgramVolunteerInterviewScheduleException } from '@/types/domain'
import { formatDateOnly } from '@/features/program/shared/lib/program-detail-info-constants'
import { readVolunteerInterviewExceptionOverlayBlocks } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-exception-overlay-blocks'
import type { VolunteerInterviewOverlayStore } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-keys'

function formatAvailableTimeSlotsFromSelectedKeys(keys: unknown): string | undefined {
  if (!Array.isArray(keys) || keys.length === 0) return undefined
  const labels = keys
    .map(key => {
      if (typeof key !== 'string' || !key.trim()) return null
      const match = /^(\d+)-(\d+)$/.exec(key.trim())
      if (!match) return null
      const start = dayjs(Number(match[1]))
      const end = dayjs(Number(match[2]))
      if (!start.isValid() || !end.isValid()) return null
      return `${start.format('HH:mm')} ~ ${end.format('HH:mm')}`
    })
    .filter((label): label is string => label != null)
  return labels.length > 0 ? labels.join(', ') : undefined
}

function hasFilledException(block: {
  exceptionDate: unknown
  selectedSlotKeys: unknown
  interviewTime: unknown
}): boolean {
  if (block.exceptionDate != null && String(block.exceptionDate).trim() !== '') return true
  if (block.interviewTime != null && String(block.interviewTime).trim() !== '') return true
  return Array.isArray(block.selectedSlotKeys) && block.selectedSlotKeys.length > 0
}

/** 모집 overlay의 예외 일정 블록을 프로그램 저장·상세 표시용으로 옮긴다. */
export function mapVolunteerInterviewExceptionsFromOverlay(
  overlay: Record<string, unknown>,
  store: VolunteerInterviewOverlayStore = 'recruit',
  namespace?: string
): GeneralProgramVolunteerInterviewScheduleException[] {
  return readVolunteerInterviewExceptionOverlayBlocks(overlay, store, namespace).flatMap(block => {
    if (!hasFilledException(block)) return []
    const parsed =
      block.exceptionDate == null ? null : dayjs(block.exceptionDate as string | number | Date)
    const exceptionDate =
      parsed?.isValid() === true ? formatDateOnly(parsed.toISOString()) : undefined
    const exceptionDateIso = parsed?.isValid() === true ? parsed.toISOString() : undefined
    const availableTimeSlots = formatAvailableTimeSlotsFromSelectedKeys(block.selectedSlotKeys)
    return [
      {
        blockId: block.blockId,
        ...(exceptionDate && exceptionDate !== '-' ? { exceptionDate } : {}),
        ...(exceptionDateIso ? { exceptionDateIso } : {}),
        ...(availableTimeSlots ? { availableTimeSlots } : {}),
      },
    ]
  })
}
