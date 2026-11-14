/**
 * 강사 기본 정보 — 조회·수정 동일 EditableRow.
 * 수정 모드: 미본인인증=`profile`(기본정보·강사비·JA 모달), 본인인증 후=`feeJaRestrictedEdit`(강사비만).
 */

import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { isInstructorDualProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { SchoolTeacherEmploymentStatusDropdown } from '@/features/user/detail/lib/school-teacher-employment-status'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import {
  detailAddressView,
  genderBirthView,
  instructorApplicationTypeLine,
  instructorBankView,
  instructorCareerYearsLine,
  instructorFeeGradeLine,
  oneLineIntroLine,
  resolveInstructorAffiliationParts,
  socialView,
} from '../display'
import { InstructorJaEvaluationGradeField } from '../instructor-ja-grade-field'
import {
  normalizePermissionApprovalStatus,
  PermissionApprovalStatusWithResend,
  settlementStatusView,
} from '../status'
import type { BasicInfoSectionContext } from './types'
import {
  ContactInfoFieldsRow,
  ContactInfoViewRow,
  FullWidthAddressEdit,
} from './shared'
import {
  canEditInstructorFeeJaFields,
  InstructorFeeGradeSelect,
} from './instructor-fee-ja-edit'
import { formatDateDot } from '@/shared/utils'
import { CmsInput, CmsRadioGroup, CmsCheckbox } from '@/shared/ui'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { toApiGender } from '@/features/user/api/map-member-gender-birth'
import { INSTRUCTOR_FORM_PLACEHOLDERS } from '@jakorea/domain/instructor/form-copy'
import {
  BUSINESS_INCOME_OPTIONS,
  GENDER_OPTIONS,
} from '@/features/user/shared/ui/instructor-profile-form'
import { useBasicInfoEditing } from '../use-basic-info-editing'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

function instructorBusinessIncomeView(user: BasicInfoSectionContext['user']) {
  const businessIncome =
    user.instructorInfo?.isBusinessIncome === true
      ? '해당'
      : user.instructorInfo?.isBusinessIncome === false
        ? '해당 없음'
        : '-'
  return <span>{businessIncome}</span>
}

/**
 * 소속 — 학교·기관만 콤마로 나열.
 * 교사 겸직의 재직 현황은 별도 「재직 현황」 필드(교사 상세와 동일).
 */
function InstructorAffiliationView({ user }: { user: BasicInfoSectionContext['user'] }) {
  const { schoolName, others } = resolveInstructorAffiliationParts(user)
  const parts = [...(schoolName ? [schoolName] : []), ...others]

  if (parts.length === 0) {
    return <span>-</span>
  }

  if (parts.length === 1) {
    return <span>{parts[0]}</span>
  }

  return (
    <span className="user-basic-info-section__affiliation-multi">
      {parts.map((name, i) => (
        <span key={`${name}-${i}`} className="user-basic-info-section__affiliation-multi-item">
          {i > 0 ? <span className="user-basic-info-section__affiliation-multi-sep">, </span> : null}
          {name}
        </span>
      ))}
    </span>
  )
}

function isInstructorPermissionDetailView(ctx: BasicInfoSectionContext) {
  return ctx.viewContext.permissionView && ctx.viewContext.permissionRole === 'instructor'
}

/** 강사 신청 상세 · 승인 완료 전(대기·반려) — 스크린샷: JA 평가·신청 유형 비노출 */
function isInstructorPermissionCompactBasicInfo(ctx: BasicInfoSectionContext) {
  if (!isInstructorPermissionDetailView(ctx)) return false
  return normalizePermissionApprovalStatus(ctx.user.permissionApprovalStatus) !== 'APPROVED'
}

function jaEvaluationGradeField(ctx: BasicInfoSectionContext) {
  const draftGrade = ctx.memberInfoDraft?.jaEvaluationGrade?.trim()
  const userForJa =
    draftGrade && canEditInstructorFeeJaFields(ctx)
      ? {
          ...ctx.user,
          listMetrics: {
            ...ctx.user.listMetrics,
            jaEvaluationGrade: draftGrade,
          },
        }
      : ctx.user
  return (
    <InstructorJaEvaluationGradeField
      user={userForJa}
      wrapClassName="user-basic-info-section__permission-approval-dropdown-wrap"
      onOpenJaGradeEvaluation={ctx.onOpenJaGradeEvaluation}
    />
  )
}

export function InstructorMetaSection(ctx: BasicInfoSectionContext) {
  const { user, onPermissionResendNotification } = ctx
  const isInstructorPermissionDetail = isInstructorPermissionDetailView(ctx)
  const useCompactBasicInfo = isInstructorPermissionCompactBasicInfo(ctx)
  const jaField = jaEvaluationGradeField(ctx)
  const approvalStatusView = (
    <PermissionApprovalStatusWithResend
      user={user}
      onPermissionResendNotification={onPermissionResendNotification}
      notifyPermissionRole="instructor"
    />
  )

  return (
    <>
      {useCompactBasicInfo ? (
        <EditableRow type="double">
          <EditableField
            label="권한 승인 현황"
            fullRow
            readOnlyDisplay
            view={approvalStatusView}
          />
        </EditableRow>
      ) : (
        <EditableRow type="double">
          {isInstructorPermissionDetail ? (
            <EditableField label="권한 승인 현황" readOnlyDisplay view={approvalStatusView} />
          ) : (
            <EditableField label="정산 현황" readOnlyDisplay view={settlementStatusView(user)} />
          )}
          <EditableField label="JA 평가 등급" readOnlyDisplay view={jaField} />
        </EditableRow>
      )}
      <EditableRow type="double">
        <EditableField
          label="가입일"
          readOnlyDisplay
          view={<span>{formatDateDot(user.createdAt)}</span>}
        />
        <EditableField
          label="연동된 소셜 계정"
          readOnlyDisplay
          view={<span>{socialView(user)}</span>}
        />
      </EditableRow>
    </>
  )
}

export function InstructorSection(ctx: BasicInfoSectionContext) {
  const {
    user,
    scheduleChangeCount,
    personalInfoRevealed,
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  } = ctx
  const isInstructorPermissionDetail = isInstructorPermissionDetailView(ctx)
  const useCompactBasicInfo = isInstructorPermissionCompactBasicInfo(ctx)
  const canEditFeeJa = canEditInstructorFeeJaFields(ctx)
  const editing = useBasicInfoEditing({
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  })
  const d = memberInfoDraft
  const canEdit = editing.canEditBasic && d != null && onMemberInfoDraftChange != null
  const historyCount = scheduleChangeCount ?? user.scheduleChangeCancelCount ?? 0

  const nameWithBadge = (nameNode: ReactNode) => (
    <span className="user-basic-info-section__name-with-badge">
      {nameNode}
      {historyCount > 0 ? <ScheduleChangeHistoryBadge count={historyCount} /> : null}
    </span>
  )

  const businessIncomeRadioValue =
    d?.instructorBusinessIncome === '해당'
      ? 'yes'
      : d?.instructorBusinessIncome === '해당 없음'
        ? 'no'
        : undefined

  const genderRadioValue =
    toApiGender(d?.gender) === 'MALE' ? 'male' : toApiGender(d?.gender) === 'FEMALE' ? 'female' : undefined

  const businessIncomeField = (
    <EditableField
      label="사업소득자 여부"
      fullRow={useCompactBasicInfo}
      readOnlyDisplay={editing.isReadOnlyDisplay}
      view={instructorBusinessIncomeView(user)}
      edit={
        <CmsRadioGroup
          options={BUSINESS_INCOME_OPTIONS}
          size="medium"
          value={businessIncomeRadioValue}
          onChange={e => {
            const v = e.target.value
            onMemberInfoDraftChange?.({
              instructorBusinessIncome: v === 'yes' ? '해당' : v === 'no' ? '해당 없음' : '',
            })
          }}
        />
      }
    />
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
              inputSize="small"
              width="100%"
              placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.name}
              aria-label="성명"
            />
          )}
        />
        <EditableField
          label="성별 및 생년월일"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={genderBirthView(user)}
          edit={
            <span className="detail-info-form-inputs-wrapper-no-gap">
              <CmsRadioGroup
                options={[...GENDER_OPTIONS]}
                size="medium"
                value={genderRadioValue}
                onChange={e => {
                  const v = e.target.value
                  onMemberInfoDraftChange?.({
                    gender: v === 'male' || v === 'female' ? String(v) : '',
                  })
                }}
                style={{ flexShrink: 0, flexWrap: 'nowrap' }}
              />
              <DetailInfoForm.InputsSeparator />
              <span style={{ flex: '1 1 0', minWidth: 0 }}>
                <CmsDateTextInput
                  value={(d?.birthDate ?? '').replace(/-/g, '.')}
                  onValueChange={value =>
                    onMemberInfoDraftChange?.({ birthDate: value.replace(/\./g, '-') })
                  }
                  inputSize="small"
                  width="100%"
                  placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.birthDate}
                  maxLength={10}
                  aria-label="생년월일"
                />
              </span>
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
          phonePlaceholder={INSTRUCTOR_FORM_PLACEHOLDERS.contact}
          emailPlaceholder={INSTRUCTOR_FORM_PLACEHOLDERS.email}
        />
      ) : (
        <ContactInfoViewRow user={user} personalInfoRevealed={personalInfoRevealed} />
      )}

      {isInstructorDualProfile(user) ? (
        /* 교사 겸 강사 시안(4427:48874): 「소속(학교명 | 재직 현황 태그) | 강사 경력」 한 행 */
        <EditableRow type="double">
          <EditableField
            label="소속"
            readOnlyDisplay={editing.isReadOnlyDisplay}
            view={
              <span className="detail-info-form-inputs-wrapper-no-gap">
                <InstructorAffiliationView user={user} />
                <DetailInfoForm.InputsSeparator />
                <SchoolTeacherEmploymentStatusDropdown
                  userId={user.id}
                  employmentStatusLabel={user.listMetrics?.employmentStatusLabel}
                  onChange={ctx.onEmploymentStatusChange}
                />
              </span>
            }
            edit={
              <span className="detail-info-form-inputs-wrapper-no-gap">
                <CmsInput
                  value={d?.affiliationInstitution ?? ''}
                  onChange={e =>
                    onMemberInfoDraftChange?.({ affiliationInstitution: e.target.value })
                  }
                  inputSize="small"
                  width="100%"
                  placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.affiliationName}
                  aria-label="소속"
                />
                <DetailInfoForm.InputsSeparator />
                <SchoolTeacherEmploymentStatusDropdown
                  userId={user.id}
                  employmentStatusLabel={user.listMetrics?.employmentStatusLabel}
                  onChange={ctx.onEmploymentStatusChange}
                />
              </span>
            }
          />
          <EditableField
            label="강사 경력"
            readOnlyDisplay={editing.isReadOnlyDisplay}
            view={<span>{instructorCareerYearsLine(user)}</span>}
            edit={
              <CmsInput
                value={d?.instructorCareerSummaryLabel ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ instructorCareerSummaryLabel: e.target.value })
                }
                inputSize="small"
                width="100%"
                placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.instructorCareer}
                aria-label="강사 경력"
              />
            }
          />
        </EditableRow>
      ) : (
        <EditableRow type="double">
          <EditableField
            label="소속"
            readOnlyDisplay={editing.isReadOnlyDisplay}
            view={<InstructorAffiliationView user={user} />}
            edit={
              <span className="user-basic-info-section__affiliation-row">
                <CmsInput
                  value={d?.affiliationNone ? '' : (d?.affiliationInstitution ?? '')}
                  onChange={e =>
                    onMemberInfoDraftChange?.({
                      affiliationInstitution: e.target.value,
                      affiliationNone: false,
                    })
                  }
                  inputSize="small"
                  width="100%"
                  placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.affiliationName}
                  aria-label="소속"
                  disabled={d?.affiliationNone === true}
                />
                <CmsCheckbox
                  checkboxSize="medium"
                  checked={d?.affiliationNone === true}
                  onChange={e => {
                    const checked = e.target.checked === true
                    onMemberInfoDraftChange?.(
                      checked
                        ? { affiliationNone: true, affiliationInstitution: '' }
                        : { affiliationNone: false }
                    )
                  }}
                >
                  소속 없음
                </CmsCheckbox>
              </span>
            }
          />
          <EditableField
            label="강사 경력"
            readOnlyDisplay={editing.isReadOnlyDisplay}
            view={<span>{instructorCareerYearsLine(user)}</span>}
            edit={
              <CmsInput
                value={d?.instructorCareerSummaryLabel ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ instructorCareerSummaryLabel: e.target.value })
                }
                inputSize="small"
                width="100%"
                placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.instructorCareer}
                aria-label="강사 경력"
              />
            }
          />
        </EditableRow>
      )}

      {/* 시안: 강사 신청 상세는 「자택 주소지 | 정산 계좌 정보(은행명/계좌번호 ㅣ 예금주)」 한 행 */}
      <EditableRow type={isInstructorPermissionDetail ? 'double' : 'single'}>
        <EditableField
          label="자택 주소지"
          fullRow={!isInstructorPermissionDetail}
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
        {isInstructorPermissionDetail ? (
          <EditableField
            label="정산 계좌 정보"
            readOnlyDisplay
            view={<span>{instructorBankView(user, personalInfoRevealed)}</span>}
          />
        ) : null}
      </EditableRow>

      {useCompactBasicInfo ? (
        <EditableRow type="single">{businessIncomeField}</EditableRow>
      ) : (
        <EditableRow type="double">
          {/* 시안: 권한 신청 상세는 승인 완료 후 「강사비 등급 | 사업소득자 여부」 */}
          {!isInstructorPermissionDetail ||
          normalizePermissionApprovalStatus(user.permissionApprovalStatus) === 'APPROVED' ? (
            <EditableField
              label="강사비 등급"
              readOnlyDisplay={!canEditFeeJa}
              view={<span>{instructorFeeGradeLine(user)}</span>}
              edit={<InstructorFeeGradeSelect ctx={ctx} />}
            />
          ) : (
            <EditableField
              label="신청 유형"
              readOnlyDisplay
              view={<span>{instructorApplicationTypeLine(user)}</span>}
            />
          )}
          {businessIncomeField}
        </EditableRow>
      )}

      <EditableRow type="single">
        <EditableField
          label="한 줄 소개"
          fullRow
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{oneLineIntroLine(user)}</span>}
          edit={
            <CmsInput
              value={d?.bio ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ bio: e.target.value })}
              inputSize="small"
              width="100%"
              placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.oneLineIntro}
              aria-label="한 줄 소개"
            />
          }
        />
      </EditableRow>
    </>
  )
}
