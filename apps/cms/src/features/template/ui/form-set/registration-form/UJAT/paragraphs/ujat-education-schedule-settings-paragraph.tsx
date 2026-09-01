/**
 * UJAT — 교육 진행 일정 설정 (등록 양식 단락)
 */
import {
  resolveUjatEducationScheduleSettingsSemesterDisplay,
} from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import { UjatEducationScheduleSettingsSection } from '@/features/program/ujat/ui/detail-modal/info/ujat-education-schedule-settings-section'

export function UjatEducationScheduleSettingsParagraph() {
  const h1Display = resolveUjatEducationScheduleSettingsSemesterDisplay('h1')
  const h2Display = resolveUjatEducationScheduleSettingsSemesterDisplay('h2')
  return (
    <UjatEducationScheduleSettingsSection mode="edit" h1Display={h1Display} h2Display={h2Display} />
  )
}
