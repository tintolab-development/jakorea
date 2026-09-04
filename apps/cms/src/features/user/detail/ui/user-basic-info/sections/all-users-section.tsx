import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  CmsInput,
  CmsRadioGroup,
  CmsSelect,
  SchoolSearch,
  type SchoolSearchSelection,
  type SchoolSearchSelectMeta,
} from '@/shared/ui'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import {
  affiliationView,
  detailAddressView,
  genderBirthView,
  individualSchoolEnrollmentStatusView,
  socialView,
} from '../display'
import { useBasicInfoEditing } from '../use-basic-info-editing'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { ContactInfoFieldsRow, FullWidthAddressEdit, Id1365View } from './shared'
import {
  GENDER_EDIT_OPTIONS,
  INDIVIDUAL_AFFILIATION_FIELDS_WIDTH,
  INDIVIDUAL_SCHOOL_ENROLLMENT_OPTIONS,
  individualAffiliationGradeSelectOptions,
} from './constants'
import type { BasicInfoSectionContext } from './types'
import { formatDate } from '@/shared/utils'

/** 개인 회원 — 가입일·소셜 (상단 분리 카드) */
export function AllUsersMetaSection(ctx: BasicInfoSectionContext) {
  const { user } = ctx
  return (
    <EditableRow type="double">
      <EditableField label="가입일" readOnlyDisplay view={<span>{formatDate(user.createdAt)}</span>} />
      <EditableField label="연동된 소셜 계정" readOnlyDisplay view={socialView(user)} />
    </EditableRow>
  )
}

export function AllUsersSection(ctx: BasicInfoSectionContext) {
  const {
    user,
    scheduleChangeCount,
    externalId1365,
    personalInfoRevealed,
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
  const isEnrolled = (d?.schoolEnrollmentStatus ?? 'enrolled') !== 'not_enrolled'

  const handleSchoolSelect = (selection: SchoolSearchSelection, meta: SchoolSearchSelectMeta) => {
    if (selection.source === 'neis') {
      const school = selection.item
      onMemberInfoDraftChange?.({
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
      })
      return
    }

    const univ = selection.item
    const schoolName = univ.campusName
      ? `${univ.schoolName.trim()} (${univ.campusName.trim()})`
      : univ.schoolName.trim()
    onMemberInfoDraftChange?.({
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
    })
  }

  const handleEnrollmentStatusChange = (next: 'enrolled' | 'not_enrolled') => {
    if (next === 'not_enrolled') {
      onMemberInfoDraftChange?.({
        schoolEnrollmentStatus: next,
        affiliationInstitution: '',
        affiliationGrade: '',
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
      return
    }
    // 재학 전환 시 잔존 검색 메타·자유입력 제거
    onMemberInfoDraftChange?.({
      schoolEnrollmentStatus: next,
      affiliationInstitution: '',
      affiliationGrade: '',
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

      <ContactInfoFieldsRow
        user={user}
        personalInfoRevealed={personalInfoRevealed}
        readOnlyDisplay={editing.isReadOnlyDisplay}
        phoneValue={d?.phone ?? ''}
        emailValue={d?.email ?? ''}
        onPhoneChange={next => onMemberInfoDraftChange?.({ phone: next })}
        onEmailChange={next => onMemberInfoDraftChange?.({ email: next })}
      />

      <EditableRow type="double">
        <EditableField
          label="현재 학교 재학 여부"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{individualSchoolEnrollmentStatusView(user)}</span>}
          edit={
            <CmsRadioGroup
              options={[...INDIVIDUAL_SCHOOL_ENROLLMENT_OPTIONS]}
              size="large"
              value={d?.schoolEnrollmentStatus || 'enrolled'}
              onChange={event =>
                handleEnrollmentStatusChange(event.target.value as 'enrolled' | 'not_enrolled')
              }
            />
          }
        />
        <EditableField
          label="소속"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={affiliationView(user)}
          edit={
            isEnrolled ? (
              <span className="detail-info-form-inputs-wrapper-no-gap">
                <SchoolSearch
                  value={d?.affiliationInstitution ?? ''}
                  onChange={nextSchoolName =>
                    onMemberInfoDraftChange?.({
                      affiliationInstitution: nextSchoolName,
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
                  placeholder="학교명"
                  inputSize="medium"
                  width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsSelect
                  placeholder="학년"
                  value={d?.affiliationGrade || undefined}
                  onChange={v =>
                    onMemberInfoDraftChange?.({ affiliationGrade: v != null ? String(v) : '' })
                  }
                  options={individualAffiliationGradeSelectOptions(d?.affiliationGrade)}
                  inputSize="medium"
                  width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                  aria-label="소속 학년"
                />
              </span>
            ) : (
              <CmsInput
                placeholder="소속"
                value={d?.affiliationInstitution ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ affiliationInstitution: e.target.value })}
                inputSize="medium"
                width="100%"
                aria-label="소속"
              />
            )
          }
        />
      </EditableRow>

      <EditableRow type="double">
        <EditableField
          label="자택 주소지"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
          edit={
            <FullWidthAddressEdit
              searchValue={d?.detailAddressSearch ?? ''}
              onSearchChange={next => onMemberInfoDraftChange?.({ detailAddressSearch: next })}
              detailValue={d?.detailAddressDetail ?? ''}
              onDetailChange={next => onMemberInfoDraftChange?.({ detailAddressDetail: next })}
              detailAriaLabel="자택 주소지 상세"
            />
          }
        />
        <EditableField
          label="1365 ID"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={
            <Id1365View
              personalInfoRevealed={personalInfoRevealed}
              externalId1365={externalId1365}
            />
          }
          edit={
            <CmsInput
              placeholder="1365 ID"
              value={
                d?.id1365 !== undefined
                  ? d.id1365
                  : (externalId1365?.fullLabel?.trim() ||
                      externalId1365?.maskedLabel?.trim() ||
                      '')
              }
              onChange={e => onMemberInfoDraftChange?.({ id1365: e.target.value })}
              inputSize="medium"
              width="100%"
              aria-label="1365 ID"
            />
          }
        />
      </EditableRow>
    </>
  )
}
