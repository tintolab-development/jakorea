import { useCallback, useEffect, useState } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { StatusDropdownCell } from '@/shared/components'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import {
  parseSchoolTeacherEmploymentStatus,
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE,
  SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS,
  SchoolTeacherEmploymentStatusBadge,
} from '@/features/user/detail/lib/school-teacher-employment-status'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { ContactInfoFieldsRow } from './shared'
import type { BasicInfoSectionContext } from './types'
import { affiliationAndGradeView, detailAddressView, genderBirthView, socialView } from '../display'
import { formatDate } from '@/shared/utils'

export function SchoolTeacherMetaSection(ctx: BasicInfoSectionContext) {
  const { user } = ctx
  return (
    <EditableRow type="double">
      <EditableField label="가입일" readOnlyDisplay view={<span>{formatDate(user.createdAt)}</span>} />
      <EditableField label="연동된 소셜 계정" readOnlyDisplay view={socialView(user)} />
    </EditableRow>
  )
}

function SchoolTeacherEmploymentStatusField({
  userId,
  employmentStatusLabel,
}: {
  userId: string
  employmentStatusLabel?: string
}) {
  const [employmentStatus, setEmploymentStatus] = useState<SchoolTeacherEmploymentStatus | null>(() =>
    parseSchoolTeacherEmploymentStatus(employmentStatusLabel)
  )
  const [employmentDropdownOpen, setEmploymentDropdownOpen] = useState(false)

  useEffect(() => {
    setEmploymentStatus(parseSchoolTeacherEmploymentStatus(employmentStatusLabel))
  }, [userId, employmentStatusLabel])

  const handleEmploymentStatusChange = useCallback((next: SchoolTeacherEmploymentStatus) => {
    setEmploymentStatus(next)
    setEmploymentDropdownOpen(false)
  }, [])

  if (employmentStatus == null) {
    return <span>-</span>
  }

  return (
    <span className="user-basic-info-section__teacher-employment-dropdown">
      <StatusDropdownCell<SchoolTeacherEmploymentStatus>
      status={employmentStatus}
      statusOptions={SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS}
      renderBadge={status => <SchoolTeacherEmploymentStatusBadge status={status} />}
      isItemDisabled={(cur, opt) => cur === opt}
      onChange={handleEmploymentStatusChange}
      isOpen={employmentDropdownOpen}
      onOpenChange={setEmploymentDropdownOpen}
      style={SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE}
    />
    </span>
  )
}

export function SchoolTeacherSection(ctx: BasicInfoSectionContext) {
  const { user, scheduleChangeCount, personalInfoRevealed } = ctx
  return (
    <>
      <EditableRow type="double">
        <EditableField
          label="성명"
          readOnlyDisplay
          view={
            <span className="user-basic-info-section__name-with-badge">
              {user.name}
              {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
              ) : null}
            </span>
          }
        />
        <EditableField
          label="재직 현황"
          readOnlyDisplay
          view={
            <SchoolTeacherEmploymentStatusField
              userId={user.id}
              employmentStatusLabel={user.listMetrics?.employmentStatusLabel}
            />
          }
        />
      </EditableRow>
      <EditableRow type="single">
        <EditableField label="성별 및 생년월일" readOnlyDisplay view={genderBirthView(user)} />
      </EditableRow>
      <ContactInfoFieldsRow
        user={user}
        personalInfoRevealed={personalInfoRevealed}
        phoneValue=""
        emailValue=""
        onPhoneChange={() => undefined}
        onEmailChange={() => undefined}
        readOnlyDisplay
      />
      <EditableRow type="double">
        <EditableField
          label="자택 주소"
          readOnlyDisplay
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
        />
        <EditableField
          label="소속 및 담당 학년"
          readOnlyDisplay
          view={affiliationAndGradeView(user)}
        />
      </EditableRow>
    </>
  )
}
