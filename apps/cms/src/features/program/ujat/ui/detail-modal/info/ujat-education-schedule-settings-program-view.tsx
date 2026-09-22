import type { Program } from '@/types/domain'
import {
  resolveUjatEducationScheduleSettingsSemesterDisplay,
  type UjatEducationScheduleSettingsSemesterDisplay,
} from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import { UjatEducationScheduleSettingsSection } from '@/features/program/ujat/ui/detail-modal/info/ujat-education-schedule-settings-section'

export function UjatEducationScheduleSettingsProgramView({
  program,
  isEdit = false,
  h1Display: h1DisplayInput,
  h2Display: h2DisplayInput,
}: {
  program: Program
  isEdit?: boolean
  h1Display?: UjatEducationScheduleSettingsSemesterDisplay
  h2Display?: UjatEducationScheduleSettingsSemesterDisplay
}) {
  const overlay = program.ujatRegistrationOverlay
  const h1Display =
    h1DisplayInput ?? resolveUjatEducationScheduleSettingsSemesterDisplay('h1', overlay)
  const h2Display =
    h2DisplayInput ?? resolveUjatEducationScheduleSettingsSemesterDisplay('h2', overlay)
  const mode = isEdit ? 'edit' : 'view'

  return (
    <section className="ujat-education-schedule-settings-program-view program-detail-fullpage-modal__info-tab-block">
      <div className="ujat-education-schedule-settings-program-view__header">
        <h3 className="ujat-education-schedule-settings-program-view__title">교육 진행 일정 설정</h3>
      </div>
      <UjatEducationScheduleSettingsSection mode={mode} h1Display={h1Display} h2Display={h2Display} />
    </section>
  )
}
