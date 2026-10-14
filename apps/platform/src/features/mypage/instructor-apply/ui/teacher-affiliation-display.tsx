import type { SchoolTeacherEmploymentStatus } from '@jakorea/domain/instructor/employment-status'
import type { SettingsTeacherEmploymentStatus } from '@/features/mypage/settings/lib/map-edit'
import {
  PFFormFieldValueText,
  PFFormInlineSeparatedFields,
  SchoolTeacherEmploymentStatusBadge,
} from '@/shared/ui'
import { displayOrDash } from '../lib/format-instructor-apply-display'
import { TeacherEmploymentStatusPicker } from './teacher-employment-status-picker'

export type TeacherAffiliationDisplayProps = {
  schoolName: string
  employmentStatus: SchoolTeacherEmploymentStatus | ''
  /** 작성 폼 — CMS 배지 클릭으로 재직 현황 변경 */
  onEmploymentStatusChange?: (next: SettingsTeacherEmploymentStatus) => void
}

function EmploymentStatusSlot({
  employmentStatus,
  onEmploymentStatusChange,
}: {
  employmentStatus: SchoolTeacherEmploymentStatus | ''
  onEmploymentStatusChange?: (next: SettingsTeacherEmploymentStatus) => void
}) {
  if (onEmploymentStatusChange) {
    return (
      <TeacherEmploymentStatusPicker
        value={employmentStatus}
        onChange={onEmploymentStatusChange}
      />
    )
  }
  if (employmentStatus === '') return null
  return <SchoolTeacherEmploymentStatusBadge status={employmentStatus} />
}

export function TeacherAffiliationDisplay({
  schoolName,
  employmentStatus,
  onEmploymentStatusChange,
}: TeacherAffiliationDisplayProps) {
  const school = schoolName.trim()
  const editable = onEmploymentStatusChange != null
  const hasEmploymentSlot = editable || employmentStatus !== ''

  if (!school && !hasEmploymentSlot) {
    return <PFFormFieldValueText>{displayOrDash('')}</PFFormFieldValueText>
  }

  if (!hasEmploymentSlot) {
    return <PFFormFieldValueText>{displayOrDash(school)}</PFFormFieldValueText>
  }

  return (
    <PFFormInlineSeparatedFields>
      {school ? <PFFormFieldValueText>{school}</PFFormFieldValueText> : null}
      <EmploymentStatusSlot
        employmentStatus={employmentStatus}
        onEmploymentStatusChange={onEmploymentStatusChange}
      />
    </PFFormInlineSeparatedFields>
  )
}
