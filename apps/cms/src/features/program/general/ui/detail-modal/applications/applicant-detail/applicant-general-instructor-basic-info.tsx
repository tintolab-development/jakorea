/**
 * 일반 프로그램 — 강사 유형 신청 상세 (신청 정보 탭)
 * 스크린샷 시안: 기본 정보 + ApplicantInstructorResume(학력/경력/Q&A)
 */

import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ApplicantAdminCommentSection } from './applicant-admin-comment-section'
import { ProgramApprovalStatusDetailValue } from './program-approval-status-detail-value'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import type { ApplicantInstructorEditDraft } from '@/features/program/general/lib/applicant-instructor-detail-edit'
import {
  BusinessIncomeEditField,
  BusinessIncomeView,
  InstructorFeeGradeEditField,
  InstructorFeeGradeView,
  LectureFeeBasisEditField,
  LectureFeeBasisView,
} from './applicant-general-instructor-fee-fields'
import {
  AffiliationEmploymentStatusField,
  formatAccountDisplayContent,
  formatBirthDateAndAge,
  HomeAddressDisplay,
  InstructorBasicInfoDetailForm,
} from './instructor-basic-info-detail-form'
import './applicant-general-instructor-basic-info.css'

function resolveAffiliationEmploymentStatus(
  instructor: ApplicantInstructorRow
): SchoolTeacherEmploymentStatus | null {
  if (!instructor.affiliation?.trim()) return null
  if (instructor.affiliationEmploymentStatus) {
    return instructor.affiliationEmploymentStatus
  }
  if (instructor.affiliationIsCurrentlyEmployed) return 'ACTIVE'
  return null
}

export interface ApplicantGeneralInstructorBasicInfoProps {
  instructor: ApplicantInstructorRow
  maskSensitive?: boolean
  mode?: 'view' | 'edit'
  draft?: ApplicantInstructorEditDraft
  onDraftChange?: (partial: Partial<ApplicantInstructorEditDraft>) => void
  validationErrors?: Record<string, string>
  onResendNotificationClick?: () => void
}

function ProgramApprovalStatusValue({
  instructor,
  onResendNotificationClick,
}: {
  instructor: ApplicantInstructorRow
  onResendNotificationClick?: () => void
}) {
  return (
    <ProgramApprovalStatusDetailValue
      status={instructor.approvalStatus}
      participationRejectionReason={instructor.rejectionReason}
      approvalNotificationSentAt={instructor.approvalNotificationSentAt}
      onResendNotificationClick={onResendNotificationClick}
    />
  )
}

export function ApplicantGeneralInstructorBasicInfo({
  instructor,
  maskSensitive = true,
  mode = 'view',
  draft,
  onDraftChange,
  validationErrors,
  onResendNotificationClick,
}: ApplicantGeneralInstructorBasicInfoProps) {
  const shouldMask = maskSensitive && instructor.approvalStatus !== 'approved'
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  const showAdminComment = instructor.approvalStatus === 'approved'
  const showPostApprovalFields = instructor.approvalStatus === 'approved'

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

  const affiliationEmploymentStatus = resolveAffiliationEmploymentStatus(instructor)
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
    ? shouldMask
      ? MASKING_POLICY.phone(instructor.contact.replace(/\s/g, '')) || instructor.contact
      : instructor.contact
    : '-'

  const emailDisplay = instructor.email
    ? shouldMask
      ? MASKING_POLICY.email(instructor.email)
      : instructor.email
    : '-'

  const evaluationGradeDisplay = instructor.evaluationGrade
    ? `${instructor.evaluationGrade}등급`
    : '-'

  const lectureFeeView = <LectureFeeBasisView instructor={instructor} />
  const lectureFeeEdit =
    isEditMode && draft && onDraftChange ? (
      <LectureFeeBasisEditField
        draft={draft}
        onDraftChange={onDraftChange}
        validationError={validationErrors?.lectureFeeAmount}
      />
    ) : undefined

  const statusRows = (
    <>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="프로그램 승인 현황"
          readOnlyDisplay
          view={
            <ProgramApprovalStatusValue
              instructor={instructor}
              onResendNotificationClick={onResendNotificationClick}
            />
          }
        />
        <DetailInfoForm.Field label="JA 평가 등급" readOnlyDisplay view={evaluationGradeDisplay} />
      </DetailInfoForm.Row>
      {showPostApprovalFields ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="강의비 책정 기준"
            fullRow
            view={lectureFeeView}
            edit={lectureFeeEdit}
          />
        </DetailInfoForm.Row>
      ) : null}
    </>
  )

  return (
    <div className="applicant-general-instructor-basic-info">
      {validationErrors?.form ? (
        <div className="applicant-general-instructor-basic-info__form-error">{validationErrors.form}</div>
      ) : null}
      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={isEditMode && draft ? draft.adminComment : instructor.managerComment}
          mode={isEditMode ? 'edit' : 'view'}
          draftValue={draft?.adminComment ?? ''}
          onDraftChange={
            isEditMode && onDraftChange
              ? value => onDraftChange({ adminComment: value })
              : undefined
          }
          validationError={validationErrors?.adminComment}
        />
      ) : null}
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
          homeAddressDisplay: <HomeAddressDisplay address={instructor.address} mask={shouldMask} />,
          accountDisplay: formatAccountDisplayContent(instructor, shouldMask),
          instructorFeeGradeView: <InstructorFeeGradeView instructor={instructor} />,
          instructorFeeGradeEdit:
            isEditMode && draft && onDraftChange ? (
              <InstructorFeeGradeEditField
                draft={draft}
                onDraftChange={onDraftChange}
                validationError={validationErrors?.instructorFeeGrade}
              />
            ) : undefined,
          businessIncomeView: <BusinessIncomeView instructor={instructor} />,
          businessIncomeEdit:
            isEditMode && draft && onDraftChange ? (
              <BusinessIncomeEditField draft={draft} onDraftChange={onDraftChange} />
            ) : undefined,
          oneLineIntro: instructor.oneLineIntro?.trim() || '-',
        }}
      />
    </div>
  )
}
