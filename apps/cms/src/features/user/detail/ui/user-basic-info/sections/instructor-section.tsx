import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { CmsInput, CmsSelect } from '@/shared/ui'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import {
  affiliationAndInstructorCareerView,
  detailAddressView,
  genderBirthView,
  highestEducationLine,
  instructorApplicationTypeLine,
  instructorBankView,
  instructorFeeGradeLine,
  jaEvaluationGradeLine,
  oneLineIntroLine,
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

export function InstructorMetaSection(ctx: BasicInfoSectionContext) {
  const { user } = ctx
  return (
    <EditableRow type="double">
      <EditableField label="가입일" readOnlyDisplay view={<span>{formatDate(user.createdAt)}</span>} />
      <EditableField label="연동된 소셜 계정" readOnlyDisplay view={<span>{socialView(user)}</span>} />
    </EditableRow>
  )
}

function instructorBusinessIncomeView(user: BasicInfoSectionContext['user']) {
  const businessIncome =
    user.instructorInfo?.isBusinessIncome === true
      ? '해당'
      : user.instructorInfo?.isBusinessIncome === false
        ? '해당 없음'
        : '-'
  return <span>{businessIncome}</span>
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
      </EditableRow>

      <EditableRow type="single">
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
          label="자택 주소"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
          edit={<CmsInput value={d?.detailAddressDetail ?? ''} onChange={e => onMemberInfoDraftChange?.({ detailAddressDetail: e.target.value })} inputSize="medium" width="100%" placeholder="상세 주소" />}
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
        <EditableField
          label="최종 학력"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{highestEducationLine(user)}</span>}
          edit={<CmsInput value={d?.highestEducationLevel ?? ''} onChange={e => onMemberInfoDraftChange?.({ highestEducationLevel: e.target.value })} inputSize="medium" width="100%" placeholder="최종 학력" />}
        />
        <EditableField
          label="소속 및 강사 경력"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{affiliationAndInstructorCareerView(user)}</span>}
          edit={<CmsInput value={d?.instructorCareerSummaryLabel ?? ''} onChange={e => onMemberInfoDraftChange?.({ instructorCareerSummaryLabel: e.target.value })} inputSize="medium" width="100%" placeholder="강사 경력 요약" />}
        />
      </EditableRow>

      {!isInstructorPermissionDetail ? (
        <EditableRow type="double">
          <EditableField
            label="JA 평가 등급"
            readOnlyDisplay={editing.isReadOnlyDisplay}
            view={<span>{jaEvaluationGradeLine(user)}</span>}
            edit={
              <CmsSelect
                value={d?.jaEvaluationGrade || undefined}
                onChange={v =>
                  onMemberInfoDraftChange?.({
                    jaEvaluationGrade: v != null ? String(v) : '',
                  })
                }
                options={JA_EVALUATION_GRADE_OPTIONS}
                placeholder="선택"
                inputSize="medium"
                width="100%"
              />
            }
          />
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
        </EditableRow>
      ) : null}

      <EditableRow type={isInstructorPermissionDetail ? 'double' : 'single'}>
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
        {isInstructorPermissionDetail ? (
          <EditableField label="신청 유형" readOnlyDisplay view={<span>{instructorApplicationTypeLine(user)}</span>} />
        ) : null}
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
