/**
 * 강사 기본 정보 — 조회·수정 동일 EditableRow.
 * 수정 모드(`feeJaRestrictedEdit`)에서는 강사비 등급만 인라인 편집 (JA·그 외 필드는 조회 유지).
 */

import type { ReactNode } from 'react'
import { DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { isInstructorDualProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import {
  parseSchoolTeacherEmploymentStatus,
  SchoolTeacherEmploymentStatusDropdown,
} from '@/features/user/detail/lib/school-teacher-employment-status'
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
import { formatDate } from '@/shared/utils'
import { RestrictedPiiClickable } from '@/features/user/detail/ui/restricted-pii-clickable'
import { canAdminAction } from '@/shared/lib/admin-role-policy'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'
import { CmsInput, CmsNumericInput, CmsRadioGroup, CmsSelect } from '@/shared/ui'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { BUSINESS_INCOME_OPTIONS } from '@/features/user/shared/ui/instructor-profile-form'
import { useBasicInfoEditing } from '../use-basic-info-editing'
import { GENDER_EDIT_OPTIONS } from './constants'
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
 * 소속 — 여러 개면 콤마로 나열.
 * 교사 겸직(instructor_dual)이면 소속 기관명 옆에 재직 현황 태그(변경 가능).
 */
function InstructorAffiliationView({ user }: { user: BasicInfoSectionContext['user'] }) {
  const { schoolName, others } = resolveInstructorAffiliationParts(user)
  const employmentLabel = user.listMetrics?.employmentStatusLabel
  const showEmployment =
    Boolean(schoolName) &&
    isInstructorDualProfile(user) &&
    parseSchoolTeacherEmploymentStatus(employmentLabel) != null

  if (!schoolName && others.length === 0) {
    return <span>-</span>
  }

  const schoolNode =
    schoolName && showEmployment ? (
      <span className="user-basic-info-section__inline-segments">
        <span>{schoolName}</span>
        <DetailInfoFormTdDivider />
        <SchoolTeacherEmploymentStatusDropdown
          userId={user.id}
          employmentStatusLabel={employmentLabel}
          emptyFallback={null}
        />
      </span>
    ) : schoolName ? (
      <span>{schoolName}</span>
    ) : null

  const segments: ReactNode[] = []
  if (schoolNode) segments.push(schoolNode)
  for (const other of others) {
    segments.push(<span key={other}>{other}</span>)
  }

  if (segments.length === 1) return <>{segments[0]}</>

  return (
    <span className="user-basic-info-section__affiliation-multi">
      {segments.map((seg, i) => (
        <span key={i} className="user-basic-info-section__affiliation-multi-item">
          {i > 0 ? <span className="user-basic-info-section__affiliation-multi-sep">, </span> : null}
          {seg}
        </span>
      ))}
    </span>
  )
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
  const { user, onPermissionResendNotification, viewContext } = ctx
  const isInstructorPermissionDetail =
    viewContext.permissionView && viewContext.permissionRole === 'instructor'
  const jaField = jaEvaluationGradeField(ctx)

  return (
    <>
      <EditableRow type="double">
        {isInstructorPermissionDetail ? (
          <EditableField
            label="권한 승인 현황"
            readOnlyDisplay
            view={
              <PermissionApprovalStatusWithResend
                user={user}
                onPermissionResendNotification={onPermissionResendNotification}
                notifyPermissionRole="instructor"
              />
            }
          />
        ) : (
          <EditableField label="정산 현황" readOnlyDisplay view={settlementStatusView(user)} />
        )}
        <EditableField label="JA 평가 등급" readOnlyDisplay view={jaField} />
      </EditableRow>
      <EditableRow type="double">
        <EditableField
          label="가입일"
          readOnlyDisplay
          view={<span>{formatDate(user.createdAt)}</span>}
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
    viewContext,
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  } = ctx
  const roleCode = useSessionAdminRoleCode()
  const canRevealAccount = canAdminAction({ roleCode, action: 'piiAccount' })
  const isInstructorPermissionDetail =
    viewContext.permissionView && viewContext.permissionRole === 'instructor'
  const canEditFeeJa = canEditInstructorFeeJaFields(ctx)
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

  const businessIncomeRadioValue =
    d?.instructorBusinessIncome === '해당'
      ? 'yes'
      : d?.instructorBusinessIncome === '해당 없음'
        ? 'no'
        : undefined

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
          view={<InstructorAffiliationView user={user} />}
          edit={
            isInstructorDualProfile(user) ? (
              <span className="user-basic-info-section__inline-segments">
                <CmsInput
                  value={d?.affiliationInstitution ?? ''}
                  onChange={e =>
                    onMemberInfoDraftChange?.({ affiliationInstitution: e.target.value })
                  }
                  inputSize="medium"
                  width="100%"
                  placeholder="소속"
                  aria-label="소속"
                />
                <DetailInfoFormTdDivider />
                <SchoolTeacherEmploymentStatusDropdown
                  userId={user.id}
                  employmentStatusLabel={user.listMetrics?.employmentStatusLabel}
                  onChange={ctx.onEmploymentStatusChange}
                />
              </span>
            ) : (
              <CmsInput
                value={d?.affiliationInstitution ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ affiliationInstitution: e.target.value })
                }
                inputSize="medium"
                width="100%"
                placeholder="소속"
                aria-label="소속"
              />
            )
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
              inputSize="medium"
              width="100%"
              placeholder="강사 경력"
              aria-label="강사 경력"
            />
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
          label="정산 계좌 정보"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={
            <RestrictedPiiClickable action="piiAccount">
              <span>{instructorBankView(user, personalInfoRevealed && canRevealAccount)}</span>
            </RestrictedPiiClickable>
          }
          edit={
            <span className="user-basic-info-section__inline-segments">
              <CmsInput
                value={d?.instructorBankName ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ instructorBankName: e.target.value })
                }
                inputSize="medium"
                width={120}
                placeholder="은행명"
                aria-label="은행명"
              />
              <CmsNumericInput
                mode="numericText"
                value={d?.instructorAccountNumber ?? ''}
                onValueChange={next =>
                  onMemberInfoDraftChange?.({ instructorAccountNumber: next })
                }
                inputSize="medium"
                width={160}
                placeholder="계좌번호"
                aria-label="계좌번호"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                value={d?.instructorAccountHolder ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ instructorAccountHolder: e.target.value })
                }
                inputSize="medium"
                width={120}
                placeholder="예금주"
                aria-label="예금주"
              />
            </span>
          }
        />
      </EditableRow>

      <EditableRow type="double">
        {!isInstructorPermissionDetail ? (
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
        <EditableField
          label="사업소득자 여부"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={instructorBusinessIncomeView(user)}
          edit={
            <CmsRadioGroup
              options={BUSINESS_INCOME_OPTIONS}
              size="large"
              value={businessIncomeRadioValue}
              onChange={e => {
                const v = e.target.value
                onMemberInfoDraftChange?.({
                  instructorBusinessIncome:
                    v === 'yes' ? '해당' : v === 'no' ? '해당 없음' : '',
                })
              }}
            />
          }
        />
      </EditableRow>

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
              inputSize="medium"
              width="100%"
              placeholder="한 줄 소개"
              aria-label="한 줄 소개"
            />
          }
        />
      </EditableRow>
    </>
  )
}
