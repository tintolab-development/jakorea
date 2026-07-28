import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { SchoolTeacherEmploymentStatusDropdown } from '@/features/user/detail/lib/school-teacher-employment-status'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { ContactInfoFieldsRow } from './shared'
import type { BasicInfoSectionContext } from './types'
import {
  affiliationAndGradeView,
  detailAddressView,
  genderBirthView,
  instructorBankView,
  instructorCareerYearsLine,
  oneLineIntroLine,
  socialView,
} from '../display'
import { formatDate } from '@/shared/utils'

function instructorBusinessIncomeView(user: BasicInfoSectionContext['user']) {
  const businessIncome =
    user.instructorInfo?.isBusinessIncome === true
      ? '해당'
      : user.instructorInfo?.isBusinessIncome === false
        ? '해당 없음'
        : '-'
  return <span>{businessIncome}</span>
}

export function SchoolTeacherMetaSection(ctx: BasicInfoSectionContext) {
  const { user } = ctx
  return (
    <EditableRow type="double">
      <EditableField label="가입일" readOnlyDisplay view={<span>{formatDate(user.createdAt)}</span>} />
      <EditableField label="연동된 소셜 계정" readOnlyDisplay view={socialView(user)} />
    </EditableRow>
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
            <SchoolTeacherEmploymentStatusDropdown
              userId={user.id}
              employmentStatusLabel={user.listMetrics?.employmentStatusLabel}
            />
          }
        />
      </EditableRow>
      <EditableRow type="double">
        <EditableField label="성별 및 생년월일" readOnlyDisplay view={genderBirthView(user)} />
        <EditableField
          label="강사 경력"
          readOnlyDisplay
          view={<span>{instructorCareerYearsLine(user)}</span>}
        />
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
      <EditableRow type="double">
        <EditableField
          label="정산 계좌 정보"
          readOnlyDisplay
          view={<span>{instructorBankView(user, personalInfoRevealed)}</span>}
        />
        <EditableField
          label="사업소득자 여부"
          readOnlyDisplay
          view={instructorBusinessIncomeView(user)}
        />
      </EditableRow>
      <EditableRow type="single">
        <EditableField
          label="한 줄 소개"
          readOnlyDisplay
          view={<span>{oneLineIntroLine(user)}</span>}
        />
      </EditableRow>
    </>
  )
}
