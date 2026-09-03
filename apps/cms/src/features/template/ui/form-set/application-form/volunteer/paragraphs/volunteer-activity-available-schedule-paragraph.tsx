import type { InstructorAvailableScheduleSlot } from '@/features/program/general/lib/instructor-application-available-schedule'
import { InstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/instructor/paragraphs/instructor-available-schedule-paragraph'

const VOLUNTEER_ACTIVITY_SCHEDULE_OVERLAY_PREFIX = 'application.volunteer.activitySchedule'

/** 봉사 진행 가능 일정 — 강사 「강의 진행 가능 일정」 UI 재사용 */
export function VolunteerActivityAvailableScheduleParagraph({
  scheduleSlots,
  isTemplateAuthoringMode = false,
  readOnlyPreview = false,
  hideCalendar = false,
  formatSummarySegment,
}: {
  scheduleSlots?: readonly InstructorAvailableScheduleSlot[]
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
  hideCalendar?: boolean
  formatSummarySegment?: (slot: InstructorAvailableScheduleSlot) => string
}) {
  return (
    <InstructorAvailableScheduleParagraph
      scheduleSlots={scheduleSlots}
      isTemplateAuthoringMode={isTemplateAuthoringMode}
      readOnlyPreview={readOnlyPreview}
      summaryFieldLabel="봉사 진행 가능일"
      overlayKeyPrefix={VOLUNTEER_ACTIVITY_SCHEDULE_OVERLAY_PREFIX}
      hideCalendar={hideCalendar}
      formatSummarySegment={formatSummarySegment}
    />
  )
}
