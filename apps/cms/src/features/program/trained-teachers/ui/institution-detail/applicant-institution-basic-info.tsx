/**
 * 교육받은 교사 — 기관 신청 상세 신청 정보 (안내사항·합반 비노출, TT 일정 표시)
 */

import type { ReactNode } from 'react'
import type {
  ApplicantInstitutionDetailExtend,
  ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import { ProgramApprovalStatusDetailValue } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/program-approval-status-detail-value'
import type { ApplicantInstitutionEditDraft } from '@/features/program/general/lib/applicant-institution-detail-edit'
import type {
  SameSchoolGradeOption,
  TextbookSelectOption,
} from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import type { InstitutionAffiliatedTeacherOption } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  InstitutionAddressDetailEdit,
  InstitutionClassAndStudentCountEdit,
  InstitutionEducationFormatRadios,
  InstitutionGradeSelectEdit,
  InstitutionReadonlyInput,
  InstitutionTeacherEdit,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  resolveInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { shouldShowInstitutionApplicationDetailScheduleSection } from '@/features/program/general/lib/institution-application-session-display'
import type { Program } from '@/types/domain'
import { TrainedTeachersPreferredScheduleDetailSection } from './preferred-schedule-detail-section'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import {
  INSTITUTION_APPLICATION_INFO_COLGROUP,
  InstitutionApplicationTableRowFullWidth,
  InstitutionApplicationTableRowSingleCol,
  InstitutionApplicationTableRowTwoCols,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-info-table'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'

export interface TrainedTeachersApplicantInstitutionBasicInfoProps {
  institution: ApplicantSchoolRow
  detail?: ApplicantInstitutionDetailExtend
  maskSensitive?: boolean
  mode?: 'view' | 'edit'
  draft?: ApplicantInstitutionEditDraft
  onDraftChange?: (partial: Partial<ApplicantInstitutionEditDraft>) => void
  textbookOptions?: TextbookSelectOption[]
  sameSchoolGradeOptions?: SameSchoolGradeOption[]
  classCountOptions?: Array<{ value: string; label: string }>
  teacherOptions?: InstitutionAffiliatedTeacherOption[]
  isTeacherOptionsLoading?: boolean
  showEducationFormatField?: boolean
  validationErrors?: Record<string, string>
  onResendNotificationClick?: () => void
  program?: Program | null
  isAdminCommentEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentDraftChange?: (value: string) => void
  adminCommentError?: string
}

function buildTeacherInfoCell(
  institution: ApplicantSchoolRow,
  detail: ApplicantInstitutionDetailExtend | undefined
): ReactNode {
  const raw = detail?.teacherInfo?.trim()
  if (raw) {
    const parts = raw
      .split(' | ')
      .map(s => s.trim())
      .filter(Boolean)
    if (parts.length === 0) return '-'
    return (
      <ProgramDetailTdSegmentWrap>
        {parts.length === 1 ? parts[0] : withProgramDetailTdDivider(parts)}
      </ProgramDetailTdSegmentWrap>
    )
  }
  const parts = [institution.teacherName, institution.contact].filter(Boolean) as string[]
  if (parts.length === 0) return '-'
  if (parts.length === 1) return parts[0]
  return (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider(parts)}
    </ProgramDetailTdSegmentWrap>
  )
}

export function TrainedTeachersApplicantInstitutionBasicInfo({
  institution,
  detail,
  maskSensitive: _maskSensitive = true,
  mode = 'view',
  draft,
  onDraftChange,
  textbookOptions = [],
  classCountOptions = [],
  teacherOptions = [],
  isTeacherOptionsLoading = false,
  showEducationFormatField = false,
  validationErrors,
  onResendNotificationClick,
  program = null,
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
  adminCommentError,
}: TrainedTeachersApplicantInstitutionBasicInfoProps) {
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  const institutionApplicationBridge = program
    ? resolveInstitutionApplicationProgramBridge(program)
    : null
  const showScheduleSection =
    (institution.preferredScheduleBlocks?.length ?? 0) > 0 ||
    shouldShowInstitutionApplicationDetailScheduleSection(
      institutionApplicationBridge,
      institution
    )
  /** remote SoT — preferredScheduleBlocks. memo/mock id 파싱 금지. */
  const preferredScheduleBlocks = institution.preferredScheduleBlocks ?? []

  const classAndCount: ReactNode =
    isEditMode && draft && onDraftChange ? (
      <InstitutionClassAndStudentCountEdit
        classCount={draft.classCount}
        studentCount={draft.studentCount}
        classCountOptions={classCountOptions}
        onChange={patch => onDraftChange(patch)}
        errors={{
          classCount: validationErrors?.classCount,
          studentCount: validationErrors?.studentCount,
        }}
      />
    ) : institution.classCount != null && institution.studentCount != null ? (
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider([
          `${institution.classCount}개 학급`,
          `총 ${institution.studentCount}명`,
        ])}
      </ProgramDetailTdSegmentWrap>
    ) : (
      '-'
    )

  const teacherInfo =
    isEditMode && draft && onDraftChange ? (
      <InstitutionTeacherEdit
        name={draft.teacherName}
        phone={draft.teacherPhone}
        mobile={draft.teacherMobile}
        email={draft.teacherEmail}
        teacherOptions={teacherOptions}
        isTeacherOptionsLoading={isTeacherOptionsLoading}
        onChange={patch => onDraftChange(patch)}
        errors={{
          teacherName: validationErrors?.teacherName,
          teacherPhone: validationErrors?.teacherPhone,
          teacherMobile: validationErrors?.teacherMobile,
          teacherEmail: validationErrors?.teacherEmail,
        }}
      />
    ) : (
      buildTeacherInfoCell(institution, detail)
    )

  const textbookViewValue = detail?.textbookName?.trim() || '미정'

  const textbookEditValue =
    isEditMode && draft && onDraftChange ? (
      <div className="institution-basic-info__field-stack">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="large"
          placeholder="교재명 선택"
          value={draft.textbookId || undefined}
          options={textbookOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const selected = textbookOptions.find(option => option.value === value)
            onDraftChange({
              textbookId: selected?.value ?? String(value ?? ''),
              textbookName: selected?.textbookName ?? '',
            })
          }}
        />
        {validationErrors?.textbookId || validationErrors?.textbookName ? (
          <span className="institution-basic-info__field-error">
            {validationErrors.textbookId ?? validationErrors.textbookName}
          </span>
        ) : null}
      </div>
    ) : (
      textbookViewValue
    )

  const addressDetailValue =
    isEditMode && draft && onDraftChange ? (
      <InstitutionAddressDetailEdit
        value={draft.addressDetail}
        onChange={value => onDraftChange({ addressDetail: value })}
        error={validationErrors?.addressDetail}
      />
    ) : (
      detail?.addressDetail ?? '-'
    )

  const educationTypeValue =
    showEducationFormatField && isEditMode && draft && onDraftChange ? (
      <InstitutionEducationFormatRadios
        value={draft.educationFormat}
        onChange={value => onDraftChange({ educationFormat: value })}
        error={validationErrors?.educationFormat}
      />
    ) : showEducationFormatField ? (
      detail?.educationType ?? '-'
    ) : (
      '-'
    )

  const schoolNameValue =
    isEditMode && draft ? (
      <InstitutionReadonlyInput value={institution.schoolName ?? ''} />
    ) : (
      institution.schoolName ?? '-'
    )

  const educationGradeValue =
    isEditMode && draft && onDraftChange ? (
      <InstitutionGradeSelectEdit
        value={draft.educationGrade}
        onChange={value => onDraftChange({ educationGrade: value })}
        error={validationErrors?.educationGrade}
      />
    ) : (
      institution.educationGrade ?? '-'
    )

  const regionValue =
    isEditMode && draft ? (
      <InstitutionReadonlyInput value={institution.region ?? ''} />
    ) : (
      institution.region ?? '-'
    )

  const showAdminComment = institution.approvalStatus === 'approved'

  return (
    <div className="institution-basic-info applicant-institution-basic-info">
      {validationErrors?.form ? (
        <div className="institution-basic-info__form-error">{validationErrors.form}</div>
      ) : null}
      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={institution.adminComment}
          mode={isAdminCommentEditing ? 'edit' : 'view'}
          draftValue={adminCommentDraft}
          onDraftChange={isAdminCommentEditing ? onAdminCommentDraftChange : undefined}
          validationError={adminCommentError}
        />
      ) : null}
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">기본 정보</h3>
        <div className="applicant-institution-basic-info__basic-info-fields">
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {INSTITUTION_APPLICATION_INFO_COLGROUP}
              <tbody>
                <InstitutionApplicationTableRowFullWidth
                  label="프로그램 승인 현황"
                  value={
                    <ProgramApprovalStatusDetailValue
                      status={institution.approvalStatus}
                      participationRejectionReason={institution.participationRejectionReason}
                      approvalNotificationSentAt={institution.approvalNotificationSentAt}
                      onResendNotificationClick={onResendNotificationClick}
                    />
                  }
                />
                <InstitutionApplicationTableRowFullWidth label="교재명" value={textbookEditValue} />
              </tbody>
            </table>
          </div>
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {INSTITUTION_APPLICATION_INFO_COLGROUP}
              <tbody>
                <InstitutionApplicationTableRowTwoCols
                  label1="신청 기관명"
                  value1={schoolNameValue}
                  label2="신청 학년"
                  value2={educationGradeValue}
                />
                <InstitutionApplicationTableRowTwoCols
                  label1="기관 소재지"
                  value1={regionValue}
                  label2="상세 주소"
                  value2={addressDetailValue}
                />
                {showEducationFormatField ? (
                  <InstitutionApplicationTableRowTwoCols
                    label1="신청 학급 수 및 총 인원"
                    value1={classAndCount}
                    label2="희망 교육 형태"
                    value2={educationTypeValue}
                  />
                ) : (
                  <InstitutionApplicationTableRowSingleCol
                    label="신청 학급 수 및 총 인원"
                    value={classAndCount}
                  />
                )}
                <InstitutionApplicationTableRowFullWidth label="담당 교사 정보" value={teacherInfo} />
                <InstitutionApplicationTableRowFullWidth
                  label="신청 사유"
                  value={detail?.applicationReason ?? '-'}
                  multiline
                />
                <InstitutionApplicationTableRowFullWidth
                  label="기타 요청사항"
                  value={detail?.otherRequests ?? '-'}
                  multiline
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showScheduleSection ? (
        <TrainedTeachersPreferredScheduleDetailSection blocks={preferredScheduleBlocks} />
      ) : null}
    </div>
  )
}
