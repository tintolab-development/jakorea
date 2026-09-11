/**
 * 교사 상세(강사 겸직 아님, `school_teacher`) 기본 정보.
 * 조회·수정 동일 EditableRow — 개인회원과 같이 인플레이스 edit 슬롯.
 */

import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import {
  SchoolTeacherEmploymentStatusDropdown,
} from '@/features/user/detail/lib/school-teacher-employment-status'
import {
  CmsInput,
  CmsSelect,
  SchoolSearch,
  type SchoolSearchSelection,
  type SchoolSearchSelectMeta,
} from '@/shared/ui'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { ContactInfoFieldsRow, ContactInfoViewRow } from './shared'
import { GENDER_EDIT_OPTIONS } from './constants'
import type { BasicInfoSectionContext } from './types'
import { genderBirthView, resolveSchoolTeacherAffiliationDisplay, socialView } from '../display'
import { useBasicInfoEditing } from '../use-basic-info-editing'
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
  const {
    user,
    scheduleChangeCount,
    personalInfoRevealed,
    onEmploymentStatusChange,
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  } = ctx
  const editing = useBasicInfoEditing({
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  })
  const d = memberInfoDraft
  const canEdit = editing.canEditBasic && d != null && onMemberInfoDraftChange != null

  const nameWithBadge = (nameNode: ReactNode) => (
    <span className="user-basic-info-section__name-with-badge">
      {nameNode}
      {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
        <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
      ) : null}
    </span>
  )

  const handleSchoolSelect = (selection: SchoolSearchSelection, meta: SchoolSearchSelectMeta) => {
    if (!onMemberInfoDraftChange || !d) return
    if (selection.source === 'neis') {
      const school = selection.item
      onMemberInfoDraftChange({
        affiliationInstitution: school.schulNm.trim(),
        schoolProvider: 'NEIS',
        schoolExternalCode: school.sdSchulCode.trim(),
        schoolEducationOfficeCode: school.atptOfcdcScCode.trim(),
        schoolLevel: school.schulKndScNm.trim(),
        schoolAddress: school.orgRdnma.trim(),
        schoolZipcode: school.orgRdnzc.trim(),
        schoolRegionSido: meta.regionSido,
        schoolRegionSigungu: meta.regionSigungu,
        schoolOrganizationId: null,
        ...(d.instructorCmsProfile
          ? {
              instructorCmsProfile: {
                ...d.instructorCmsProfile,
                affiliation: {
                  ...d.instructorCmsProfile.affiliation,
                  schoolName: school.schulNm.trim(),
                },
              },
            }
          : {}),
      })
      return
    }
    const univ = selection.item
    const schoolName = univ.campusName
      ? `${univ.schoolName.trim()} (${univ.campusName.trim()})`
      : univ.schoolName.trim()
    onMemberInfoDraftChange({
      affiliationInstitution: schoolName,
      schoolProvider: 'CAREER_NET',
      schoolExternalCode: univ.seq.trim(),
      schoolEducationOfficeCode: undefined,
      schoolLevel: univ.schoolGubun.trim() || univ.schoolType.trim(),
      schoolAddress: univ.address.trim(),
      schoolZipcode: '',
      schoolRegionSido: meta.regionSido || univ.region.trim(),
      schoolRegionSigungu: meta.regionSigungu,
      schoolOrganizationId: null,
      ...(d.instructorCmsProfile
        ? {
            instructorCmsProfile: {
              ...d.instructorCmsProfile,
              affiliation: {
                ...d.instructorCmsProfile.affiliation,
                schoolName,
              },
            },
          }
        : {}),
    })
  }

  const handleEmploymentChange = async (status: SchoolTeacherEmploymentStatus) => {
    await onEmploymentStatusChange?.(status)
  }

  const schoolNameValue =
    (d?.affiliationInstitution ?? '').trim() ||
    resolveSchoolTeacherAffiliationDisplay(user).school

  const employmentLabelForEdit = user.listMetrics?.employmentStatusLabel

  return (
    <>
      <EditableRow type="double">
        <EditableField
          label="성명"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={nameWithBadge(user.name)}
          edit={nameWithBadge(
            <CmsInput
              value={d?.name ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ name: e.target.value })}
              inputSize="medium"
              width="100%"
              placeholder="한글 성명"
              aria-label="성명"
            />
          )}
        />
        <EditableField
          label="성별 및 생년월일"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={genderBirthView(user)}
          edit={
            <span className="user-basic-info-section__inline-controls">
              <CmsSelect
                value={d?.gender || undefined}
                onChange={v => onMemberInfoDraftChange?.({ gender: v != null ? String(v) : '' })}
                options={GENDER_EDIT_OPTIONS}
                placeholder="성별"
                withAllOption={false}
                inputSize="medium"
                width={120}
              />
              <CmsDateTextInput
                value={(d?.birthDate ?? '').replace(/-/g, '.')}
                onValueChange={value =>
                  onMemberInfoDraftChange?.({ birthDate: value.replace(/\./g, '-') })
                }
                inputSize="medium"
                width={160}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                aria-label="생년월일"
              />
            </span>
          }
        />
      </EditableRow>

      {canEdit ? (
        <ContactInfoFieldsRow
          user={user}
          personalInfoRevealed={personalInfoRevealed}
          readOnlyDisplay={editing.isReadOnlyDisplay}
          phoneValue={d?.phone ?? ''}
          emailValue={d?.email ?? ''}
          onPhoneChange={next => onMemberInfoDraftChange?.({ phone: next })}
          onEmailChange={next => onMemberInfoDraftChange?.({ email: next })}
        />
      ) : (
        <ContactInfoViewRow user={user} personalInfoRevealed={personalInfoRevealed} />
      )}

      <EditableRow type="double">
        <EditableField
          label="소속"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{schoolTeacherSchoolNameView(user)}</span>}
          edit={
            <SchoolSearch
              value={schoolNameValue}
              onChange={next =>
                onMemberInfoDraftChange?.({
                  affiliationInstitution: next,
                  schoolOrganizationId: null,
                  schoolProvider: undefined,
                  schoolExternalCode: undefined,
                  schoolEducationOfficeCode: undefined,
                  schoolLevel: undefined,
                  schoolAddress: undefined,
                  schoolZipcode: undefined,
                  schoolRegionSido: undefined,
                  schoolRegionSigungu: undefined,
                })
              }
              onSelect={handleSchoolSelect}
              placeholder="소속 학교"
              inputSize="medium"
              width="100%"
            />
          }
        />
        <EditableField
          label="재직 현황"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={
            <SchoolTeacherEmploymentStatusDropdown
              userId={user.id}
              employmentStatusLabel={user.listMetrics?.employmentStatusLabel}
              onChange={onEmploymentStatusChange}
            />
          }
          edit={
            <SchoolTeacherEmploymentStatusDropdown
              userId={user.id}
              employmentStatusLabel={employmentLabelForEdit}
              onChange={status => {
                void handleEmploymentChange(status)
              }}
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
