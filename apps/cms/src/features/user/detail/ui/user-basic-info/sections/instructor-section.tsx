import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { CmsInput, CmsSelect } from '@/shared/ui'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { NameBlockField } from '../fields/name-block-field'
import {
  affiliationAndInstructorCareerLine,
  detailAddressView,
  formatGenderBirthLine,
  highestEducationLine,
  instructorApplicationTypeLine,
  instructorBankLine,
  instructorFeeGradeLine,
  jaEvaluationGradeLine,
  oneLineIntroLine,
  socialLine,
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
      <EditableField label="연동된 소셜 계정" readOnlyDisplay view={<span>{socialLine(user)}</span>} />
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

  return (
    <>
      <NameBlockField
        rows={[
          {
            subLabel: '한글',
            main: editing.canEditBasic ? (
              <span className="user-basic-info-section__name-with-badge">
                <CmsInput
                  value={d?.name ?? ''}
                  onChange={e => onMemberInfoDraftChange?.({ name: e.target.value })}
                  inputSize="medium"
                  width="100%"
                  aria-label="한글 성명"
                />
                {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                  <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                ) : null}
              </span>
            ) : (
              <span className="user-basic-info-section__name-with-badge">
                {user.name}
                {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                  <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                ) : null}
              </span>
            ),
            sideLabel: isInstructorPermissionDetail ? '권한 승인 현황' : '정산 현황',
            side: isInstructorPermissionDetail
              ? <PermissionApprovalStatusWithResend user={user} />
              : settlementStatusView(user),
          },
          {
            subLabel: '영문',
            main: editing.canEditBasic ? (
              <CmsInput
                value={d?.nameEn ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ nameEn: e.target.value })}
                inputSize="medium"
                width="100%"
                placeholder="영문 성명"
              />
            ) : (
              <span>{user.nameEn ?? '-'}</span>
            ),
            sideLabel: '성별 및 생년월일',
            side: editing.canEditBasic ? (
              <span className="user-basic-info-section__inline-controls">
                <CmsSelect
                  value={d?.gender || undefined}
                  onChange={v => onMemberInfoDraftChange?.({ gender: v != null ? String(v) : '' })}
                  options={GENDER_EDIT_OPTIONS}
                  placeholder="성별"
                  inputSize="medium"
                  width={120}
                  allowClear
                />
                <CmsInput
                  value={d?.birthDate ?? ''}
                  onChange={e => onMemberInfoDraftChange?.({ birthDate: e.target.value })}
                  inputSize="medium"
                  width={160}
                  placeholder="YYYY-MM-DD"
                  aria-label="생년월일"
                />
              </span>
            ) : (
              <span>{formatGenderBirthLine(user)}</span>
            ),
          },
        ]}
      />

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
          view={<span>{instructorBankLine(user, personalInfoRevealed)}</span>}
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
              <CmsInput
                value={d?.instructorAccountNumber ?? ''}
                onChange={e =>
                  onMemberInfoDraftChange?.({ instructorAccountNumber: e.target.value })
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
          view={<span>{affiliationAndInstructorCareerLine(user)}</span>}
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
                allowClear
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
                allowClear
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
              allowClear
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
