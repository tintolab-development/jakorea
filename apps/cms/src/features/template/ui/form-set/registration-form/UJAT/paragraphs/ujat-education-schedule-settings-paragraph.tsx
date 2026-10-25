/**
 * UJAT — 교육 진행 일정 설정 (등록 양식 단락)
 */
import {
  resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail,
} from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import type { UseFormReturn } from 'react-hook-form'
import { EMPTY_UJAT_TYPED_DETAIL, type UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'
import { UjatEducationScheduleSettingsSection } from '@/features/program/ujat/ui/detail-modal/info/ujat-education-schedule-settings-section'

export function UjatEducationScheduleSettingsParagraph({
  scheduleForm,
}: {
  scheduleForm?: UseFormReturn<UjatTypedDetail>
}) {
  const typedDetail = scheduleForm?.getValues() ?? EMPTY_UJAT_TYPED_DETAIL
  const h1Display = resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail('h1', typedDetail)
  const h2Display = resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail('h2', typedDetail)
  return (
    <UjatEducationScheduleSettingsSection
      mode="edit"
      h1Display={h1Display}
      h2Display={h2Display}
      scheduleForm={scheduleForm}
    />
  )
}
