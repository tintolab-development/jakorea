/**
 * 교사 상세(강사 겸직 아님, `school_teacher`) 기본 정보 — 조회 전용.
 * 강사 상세·일반 회원 상세 섹션과 분리한다.
 */

import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { SchoolTeacherEmploymentStatusDropdown } from '@/features/user/detail/lib/school-teacher-employment-status'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { ContactInfoViewRow } from './shared'
import type { BasicInfoSectionContext } from './types'
import { genderBirthView, resolveSchoolTeacherAffiliationDisplay, socialView } from '../display'
import { formatDate } from '@/shared/utils'

function schoolTeacherSchoolNameView(user: BasicInfoSectionContext['user']): string {
  return resolveSchoolTeacherAffiliationDisplay(user).school || '-'
}

/** 상단 카드 — 가입일·소셜 */
export function SchoolTeacherMetaSection(ctx: BasicInfoSectionContext) {
  const { user } = ctx
  return (
    <EditableRow type="double">
      <EditableField
        label="가입일"
        readOnlyDisplay
        view={<span>{formatDate(user.createdAt)}</span>}
      />
      <EditableField label="연동된 소셜 계정" readOnlyDisplay view={socialView(user)} />
    </EditableRow>
  )
}

/** 하단 카드 — 성명·연락처·소속 */
export function SchoolTeacherProfileSection(ctx: BasicInfoSectionContext) {
  const { user, scheduleChangeCount, personalInfoRevealed, onEmploymentStatusChange } = ctx
  const nameWithBadge = (nameNode: ReactNode) => (
    <span className="user-basic-info-section__name-with-badge">
      {nameNode}
      {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
        <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
      ) : null}
    </span>
  )

  return (
    <>
      <EditableRow type="double">
        <EditableField label="성명" readOnlyDisplay view={nameWithBadge(user.name)} />
        <EditableField label="성별 및 생년월일" readOnlyDisplay view={genderBirthView(user)} />
      </EditableRow>
      <ContactInfoViewRow user={user} personalInfoRevealed={personalInfoRevealed} />
      <EditableRow type="double">
        <EditableField
          label="소속"
          readOnlyDisplay
          view={<span>{schoolTeacherSchoolNameView(user)}</span>}
        />
        <EditableField
          label="재직 현황"
          readOnlyDisplay
          view={
            <SchoolTeacherEmploymentStatusDropdown
              userId={user.id}
              employmentStatusLabel={user.listMetrics?.employmentStatusLabel}
              onChange={onEmploymentStatusChange}
            />
          }
        />
      </EditableRow>
    </>
  )
}

/** @deprecated split 카드용 — {@link SchoolTeacherMetaSection} + {@link SchoolTeacherProfileSection} */
export function SchoolTeacherSection(ctx: BasicInfoSectionContext) {
  return (
    <>
      <SchoolTeacherMetaSection {...ctx} />
      <SchoolTeacherProfileSection {...ctx} />
    </>
  )
}
