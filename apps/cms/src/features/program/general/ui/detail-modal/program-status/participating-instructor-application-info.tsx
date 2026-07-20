/**
 * 참여 강사 상세 — 신청 정보 탭 (관리자 코멘트 + 기본 정보)
 * 일반 프로그램 강사 신청 상세(`ApplicantGeneralInstructorBasicInfo`)와 동일 DetailInfoForm 격자
 */

import type { Program } from '@/types/domain'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ApplicantAdminCommentSection } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-admin-comment-section'
import {
  BusinessIncomeEditField,
  BusinessIncomeView,
  InstructorFeeGradeEditField,
  InstructorFeeGradeView,
  LectureFeeBasisEditField,
  LectureFeeBasisView,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-fee-fields'
import type { ParticipatingInstructorEditDraft } from '@/features/program/general/lib/participating-instructor-detail-edit'
import { participatingRowToApplicantFeeViewRow } from '@/features/program/general/lib/participating-instructor-detail-edit'
import type { ApplicantInstructorEditDraft } from '@/features/program/general/lib/applicant-instructor-detail-edit'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { ProgramProgressStatusText } from '@/shared/components/program-enrollment-status-text'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { resolveInstructorAffiliationEmploymentStatus } from '@/features/program/general/lib/instructor-affiliation-employment-display'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  AffiliationEmploymentStatusField,
  formatAccountDisplayContent,
  formatBirthDateAndAge,
  HomeAddressDisplay,
  InstructorBasicInfoDetailForm,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/instructor-basic-info-detail-form'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-basic-info.css'
import './participating-instructor-application-info.css'

export interface ParticipatingInstructorApplicationInfoProps {
  instructor: ParticipatingInstructorRow
  program: Program
  privacyMasked?: boolean
  adminComment?: string
  isAdminCommentEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentDraftChange?: (value: string) => void
  adminCommentError?: string
  mode?: 'view' | 'edit'
  draft?: ParticipatingInstructorEditDraft
  onDraftChange?: (partial: Partial<ParticipatingInstructorEditDraft>) => void
  validationErrors?: Record<string, string>
}

function toApplicantFeeViewRow(instructor: ParticipatingInstructorRow): ApplicantInstructorRow {
  return participatingRowToApplicantFeeViewRow(instructor) as ApplicantInstructorRow
}

function toApplicantFeeEditDraft(draft: ParticipatingInstructorEditDraft): ApplicantInstructorEditDraft {
  return { ...draft, adminComment: '' }
}

export function ParticipatingInstructorApplicationInfo({
  instructor,
  program,
  privacyMasked = true,
  adminComment,
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
  adminCommentError,
  mode = 'view',
  draft,
  onDraftChange,
  validationErrors,
}: ParticipatingInstructorApplicationInfoProps) {
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  const feeViewRow = toApplicantFeeViewRow(instructor)
  const feeEditDraft = draft ? toApplicantFeeEditDraft(draft) : undefined

  const lectureFeeView = (
    <ProgramDetailTdSegmentWrap>
      <LectureFeeBasisView instructor={feeViewRow} />
    </ProgramDetailTdSegmentWrap>
  )
  const lectureFeeEdit =
    isEditMode && feeEditDraft ? (
      <LectureFeeBasisEditField
        draft={feeEditDraft}
        onDraftChange={onDraftChange}
        validationError={validationErrors?.lectureFeeAmount}
      />
    ) : undefined

  const scheduleChangeCount = instructor.scheduleChangeCancelCount ?? 0
  const nameCell =
    scheduleChangeCount > 0 ? (
      <>
        {instructor.instructorName}
        <ScheduleChangeHistoryBadge
          count={scheduleChangeCount}
          className="applicant-general-instructor-basic-info__name-badge"
        />
      </>
    ) : (
      instructor.instructorName
    )

  const genderBirthDisplay = withProgramDetailTdDivider([
    instructor.gender ?? '-',
    formatBirthDateAndAge(instructor.birthDate, instructor.age),
  ])

  const affiliationEmploymentStatus = resolveInstructorAffiliationEmploymentStatus(instructor)
  const affiliationEmploymentBadge =
    affiliationEmploymentStatus != null ? (
      <AffiliationEmploymentStatusField
        instructorId={instructor.id}
        affiliation={instructor.affiliation}
        employmentStatus={affiliationEmploymentStatus}
      />
    ) : null

  const affiliationCell = instructor.affiliation?.trim() ? (
    <ProgramDetailTdSegmentWrap>
      {affiliationEmploymentBadge
        ? withProgramDetailTdDivider([instructor.affiliation, affiliationEmploymentBadge])
        : instructor.affiliation}
    </ProgramDetailTdSegmentWrap>
  ) : (
    '-'
  )

  const lectureExperienceDisplay =
    instructor.lectureExperienceYears != null ? `${instructor.lectureExperienceYears}년` : '-'

  const contactDisplay = instructor.contact
    ? privacyMasked
      ? MASKING_POLICY.phone(instructor.contact.replace(/\s/g, '')) || instructor.contact
      : instructor.contact
    : '-'

  const emailDisplay = instructor.email
    ? privacyMasked
      ? MASKING_POLICY.email(instructor.email)
      : instructor.email
    : '-'

  const statusRows = isEditMode ? (
    <>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="프로그램 진행 현황"
          readOnlyDisplay
          view={<ProgramProgressStatusText program={program} />}
        />
        <DetailInfoForm.Field
          label="JA 평가 등급"
          readOnlyDisplay
          view={instructor.jaEvaluationGrade?.trim() || '-'}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="정산 현황"
          fullRow
          readOnlyDisplay
          view={<InstructorSettlementStatusText status={instructor.settlementStatus} />}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="강의비 책정 기준"
          fullRow
          view={lectureFeeView}
          edit={lectureFeeEdit}
        />
      </DetailInfoForm.Row>
    </>
  ) : (
    <>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="프로그램 진행 현황"
          readOnlyDisplay
          view={<ProgramProgressStatusText program={program} />}
        />
        <DetailInfoForm.Field
          label="JA 평가 등급"
          readOnlyDisplay
          view={instructor.jaEvaluationGrade?.trim() || '-'}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="정산 현황"
          readOnlyDisplay
          view={<InstructorSettlementStatusText status={instructor.settlementStatus} />}
        />
        <DetailInfoForm.Field label="강의비 책정 기준" readOnlyDisplay view={lectureFeeView} />
      </DetailInfoForm.Row>
    </>
  )

  return (
    <div className="participating-instructor-application-info applicant-general-instructor-basic-info">
      {validationErrors?.form ? (
        <div className="applicant-general-instructor-basic-info__form-error">
          {validationErrors.form}
        </div>
      ) : null}
      <ApplicantAdminCommentSection
        adminComment={adminComment}
        mode={isAdminCommentEditing ? 'edit' : 'view'}
        draftValue={adminCommentDraft}
        onDraftChange={onAdminCommentDraftChange}
        validationError={adminCommentError}
      />
      <InstructorBasicInfoDetailForm
        mode={isEditMode ? 'edit' : 'view'}
        statusRows={statusRows}
        profile={{
          nameCell,
          genderBirthDisplay,
          affiliationCell,
          lectureExperienceDisplay,
          contactDisplay,
          emailDisplay,
          homeAddressDisplay: (
            <HomeAddressDisplay address={instructor.address} mask={privacyMasked} />
          ),
          accountDisplay: formatAccountDisplayContent(instructor, privacyMasked),
          instructorFeeGradeView: <InstructorFeeGradeView instructor={feeViewRow} />,
          instructorFeeGradeEdit:
            isEditMode && feeEditDraft ? (
              <InstructorFeeGradeEditField
                draft={feeEditDraft}
                onDraftChange={onDraftChange}
                validationError={validationErrors?.instructorFeeGrade}
              />
            ) : undefined,
          businessIncomeView: <BusinessIncomeView instructor={feeViewRow} />,
          businessIncomeEdit:
            isEditMode && feeEditDraft ? (
              <BusinessIncomeEditField draft={feeEditDraft} onDraftChange={onDraftChange} />
            ) : undefined,
          oneLineIntro: instructor.oneLineIntro?.trim() || '-',
        }}
      />
    </div>
  )
}
