import type { ActivityScheduleSlot } from '@/shared/api/generated/dashboard/schemas/activityScheduleSlot'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'

/** 봉사자 상세 `activityScheduleSlots`만 preferred로 옮긴다. 빈 배열을 다른 값으로 채우지 않는다. */
export function mapVolunteerActivityScheduleSlotsToPreferred(
  slots: readonly ActivityScheduleSlot[] | null | undefined
): PreferredEducationSchedule[] {
  if (!slots?.length) return []
  return slots.map(slot => {
    const scheduleId = slot.scheduleId ?? null
    const label = slot.label?.trim() || slot.scheduleName?.trim() || null
    return {
      scheduleId,
      startAt: slot.startAt ?? null,
      endAt: slot.endAt ?? null,
      label,
      scheduleIds: scheduleId != null ? [scheduleId] : [],
    }
  })
}
