import { AppStatusBadge } from '@/shared/components'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { NameBlockField } from '../fields/name-block-field'
import { ContactInfoFieldsRow } from './shared'
import type { BasicInfoSectionContext } from './types'
import { affiliationAndGradeLine, detailAddressView, formatGenderBirthLine, socialLine } from '../display'
import { schoolTeacherEmploymentBadgeModifier } from '../status'
import { formatDate } from '@/shared/utils'

export function SchoolTeacherMetaSection(ctx: BasicInfoSectionContext) {
  const { user } = ctx
  return (
    <EditableRow type="double">
      <EditableField label="가입일" readOnlyDisplay view={<span>{formatDate(user.createdAt)}</span>} />
      <EditableField label="연동된 소셜 계정" readOnlyDisplay view={<span>{socialLine(user)}</span>} />
    </EditableRow>
  )
}

export function SchoolTeacherSection(ctx: BasicInfoSectionContext) {
  const { user, scheduleChangeCount, personalInfoRevealed } = ctx
  const employment = user.listMetrics?.employmentStatusLabel?.trim() || '-'
  const employmentSide =
    employment === '-' ? (
      <span>-</span>
    ) : (
      <AppStatusBadge
        label={employment}
        className={`user-basic-info-section__teacher-employment-badge user-basic-info-section__teacher-employment-badge--${schoolTeacherEmploymentBadgeModifier(employment)}`}
      />
    )
  return (
    <>
      <NameBlockField
        rows={[
          {
            subLabel: '한글',
            main: (
              <span className="user-basic-info-section__name-with-badge">
                {user.name}
                {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                  <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                ) : null}
              </span>
            ),
            sideLabel: '재직 현황',
            side: employmentSide,
          },
          {
            subLabel: '영문',
            main: <span>{user.nameEn ?? '-'}</span>,
            sideLabel: '성별 및 생년월일',
            side: <span>{formatGenderBirthLine(user)}</span>,
          },
        ]}
      />
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
          view={<span>{affiliationAndGradeLine(user)}</span>}
        />
      </EditableRow>
    </>
  )
}
