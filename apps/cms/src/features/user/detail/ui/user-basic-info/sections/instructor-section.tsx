import type { ReactNode } from 'react'
import { DetailInfoForm, DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { CmsButton, CmsInput, CmsSelect } from '@/shared/ui'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
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
  jaEvaluationGradeLine,
  oneLineIntroLine,
  resolveInstructorAffiliationParts,
  socialView,
} from '../display'
import {
  PermissionApprovalStatusWithResend,
  settlementStatusView,
} from '../status'
import { useBasicInfoEditing } from '../use-basic-info-editing'
import type { BasicInfoSectionContext } from './types'
import { ContactInfoFieldsRow } from './shared'
import {
  GENDER_EDIT_OPTIONS,
  INDIVIDUAL_AFFILIATION_FIELDS_WIDTH,
  JA_EVALUATION_GRADE_OPTIONS,
} from './constants'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'
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

/**
 * 소속 — 여러 개면 콤마로 나열.
 * 교사 겸직(instructor_dual)이면 소속 기관명 옆에 재직 현황 태그(변경 가능).
 * 예: `진월초등학교 | [재직중], 제미나이 강사단`
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

function JaEvaluationGradeWithAction({
  user,
  editing,
  draftGrade,
  onDraftGradeChange,
  onOpenJaGradeEvaluation,
}: {
  user: BasicInfoSectionContext['user']
  editing: boolean
  draftGrade?: string
  onDraftGradeChange?: (next: string) => void
  onOpenJaGradeEvaluation?: () => void
}) {
  if (editing) {
    return (
      <CmsSelect
        value={draftGrade || undefined}
        onChange={v => onDraftGradeChange?.(v != null ? String(v) : '')}
        options={JA_EVALUATION_GRADE_OPTIONS}
        placeholder="선택"
        inputSize="medium"
        width="100%"
      />
    )
  }

  const hasGrade = Boolean(user.listMetrics?.jaEvaluationGrade?.trim())
  const gradeEvaluateButton = (
    <CmsButton
      type="button"
      variant="secondary"
      size="small"
      onClick={() => {
        onOpenJaGradeEvaluation?.()
      }}
    >
      등급 평가
    </CmsButton>
  )

  if (!hasGrade) {
    return gradeEvaluateButton
  }

  return (
    <span className="user-basic-info-section__permission-approval-dropdown-wrap">
      <span>{jaEvaluationGradeLine(user)}</span>
      <DetailInfoForm.InputsSeparator />
      {gradeEvaluateButton}
    </span>
  )
}

export function InstructorMetaSection(ctx: BasicInfoSectionContext) {
  const {
    user,
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
    onPermissionResendNotification,
    viewContext,
  } = ctx
  const isInstructorPermissionDetail =
    viewContext.permissionView && viewContext.permissionRole === 'instructor'
  const editing = useBasicInfoEditing({
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  })

  return (
    <>
      <EditableRow type="double">
        <EditableField
          label={isInstructorPermissionDetail ? '권한 승인 현황' : '정산 현황'}
          readOnlyDisplay
          view={
            isInstructorPermissionDetail ? (
              <PermissionApprovalStatusWithResend
                user={user}
                onPermissionResendNotification={onPermissionResendNotification}
                notifyPermissionRole="instructor"
              />
            ) : (
              settlementStatusView(user)
            )
          }
        />
        <EditableField
          label="JA 평가 등급"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={
            <JaEvaluationGradeWithAction
              user={user}
              editing={editing.isEditing}
              draftGrade={memberInfoDraft?.jaEvaluationGrade}
              onDraftGradeChange={next => onMemberInfoDraftChange?.({ jaEvaluationGrade: next })}
              onOpenJaGradeEvaluation={ctx.onOpenJaGradeEvaluation}
            />
          }
          edit={
            <JaEvaluationGradeWithAction
              user={user}
              editing
              draftGrade={memberInfoDraft?.jaEvaluationGrade}
              onDraftGradeChange={next => onMemberInfoDraftChange?.({ jaEvaluationGrade: next })}
              onOpenJaGradeEvaluation={ctx.onOpenJaGradeEvaluation}
            />
          }
        />
      </EditableRow>
      <EditableRow type="double">
        <EditableField label="가입일" readOnlyDisplay view={<span>{formatDate(user.createdAt)}</span>} />
        <EditableField label="연동된 소셜 계정" readOnlyDisplay view={<span>{socialView(user)}</span>} />
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
    viewContext,
  } = ctx
  const isInstructorPermissionDetail =
    viewContext.permissionView && viewContext.permissionRole === 'instructor'
  const editing = useBasicInfoEditing({
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  })
  const d = memberInfoDraft
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
          label="소속"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<InstructorAffiliationView user={user} />}
          edit={
            <CmsInput
              value={d?.affiliationInstitution ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ affiliationInstitution: e.target.value })}
              inputSize="medium"
              width="100%"
              placeholder="소속 (예: ㅇㅇ초등학교, JA 강사단)"
            />
          }
        />
        <EditableField
          label="강사 경력"
          readOnlyDisplay
          view={<span>{instructorCareerYearsLine(user)}</span>}
        />
      </EditableRow>

      <EditableRow type="double">
        <EditableField
          label="자택 주소지"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
          edit={
            <CmsInput
              value={d?.detailAddressDetail ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ detailAddressDetail: e.target.value })}
              inputSize="medium"
              width="100%"
              placeholder="상세 주소"
            />
          }
        />
        <EditableField
          label="정산 계좌 정보"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{instructorBankView(user, personalInfoRevealed)}</span>}
          edit={
            <span className="detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                value={d?.instructorBankName ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ instructorBankName: e.target.value })}
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                placeholder="은행명"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsNumericInput
                mode="numericText"
                value={d?.instructorAccountNumber ?? ''}
                onValueChange={value =>
                  onMemberInfoDraftChange?.({ instructorAccountNumber: value })
                }
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                placeholder="계좌번호"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                value={d?.instructorAccountHolder ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ instructorAccountHolder: e.target.value })}
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                placeholder="예금주"
              />
            </span>
          }
        />
      </EditableRow>

      <EditableRow type="double">
        {!isInstructorPermissionDetail ? (
          <EditableField
            label="강사비 등급"
            readOnlyDisplay={!editing.isEditing}
            view={<span>{instructorFeeGradeLine(user)}</span>}
            edit={
              <CmsSelect
                value={memberInfoDraft?.instructorFeeGrade || undefined}
                onChange={v =>
                  onMemberInfoDraftChange?.({ instructorFeeGrade: v != null ? String(v) : '' })
                }
                options={INSTRUCTOR_FEE_GRADE_OPTIONS}
                placeholder="선택"
                inputSize="medium"
                width="100%"
              />
            }
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
            <CmsSelect
              value={d?.instructorBusinessIncome || undefined}
              onChange={v =>
                onMemberInfoDraftChange?.({
                  instructorBusinessIncome: v != null ? (String(v) as '해당' | '해당 없음') : '',
                })
              }
              options={[
                { value: '해당', label: '해당' },
                { value: '해당 없음', label: '해당 없음' },
              ]}
              placeholder="선택"
              inputSize="medium"
              width="100%"
            />
          }
        />
      </EditableRow>

      <EditableRow type="single">
        <EditableField
          label="한 줄 소개"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{oneLineIntroLine(user)}</span>}
          edit={
            <CmsInput
              value={d?.bio ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ bio: e.target.value })}
              inputSize="medium"
              width="100%"
            />
          }
        />
      </EditableRow>
    </>
  )
}
