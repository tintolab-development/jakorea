/**
 * 일반 프로그램 — 강사 유형 신청 상세 (신청 정보 탭)
 * 스크린샷 시안: 기본 정보(승인·프로필) + 학력/경력/자격
 */

import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ApplicantAdminCommentSection } from './applicant-admin-comment-section'
import { ProgramApprovalStatusDetailValue } from './program-approval-status-detail-value'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { resolveInstructorAffiliationEmploymentStatus } from '@/features/program/general/lib/instructor-affiliation-employment-display'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
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
  formatServerAccountDisplayContent,
  formatBirthDateAndAge,
  HomeAddressDisplay,
  InstructorBasicInfoDetailForm,
} from './instructor-basic-info-detail-form'
import './applicant-general-instructor-basic-info.css'
import { InstructorJaGradeField } from '../../instructor-ja-grade-field'

export interface ApplicantGeneralInstructorBasicInfoProps {
  instructor: ApplicantInstructorRow
  maskSensitive?: boolean
  mode?: 'view' | 'edit'
  draft?: ApplicantInstructorEditDraft
  onDraftChange?: (partial: Partial<ApplicantInstructorEditDraft>) => void
  validationErrors?: Record<string, string>
  onResendNotificationClick?: () => void
  persistAffiliationEmploymentRemote?: boolean
  onAffiliationEmploymentStatusSaved?: (status: SchoolTeacherEmploymentStatus) => void
  /**
   * 기본 `default`(1사1교·일반 개인형). `general-organization`: 일반(기관형) 시안 03·06·07
   * — 사유 괄호 없음, 재발송 버튼 뒤 구분선 없음, 정보 수정 중에도 관리자 코멘트는 조회 표시(코멘트는
   * 「코멘트 수정」으로만 편집), JA 평가 등급 「등급 평가」 버튼 미노출.
   */
  copyVariant?: 'default' | 'general-organization'
}

function ProgramApprovalStatusValue({
  instructor,
  onResendNotificationClick,
  isGeneralOrganization,
}: {
  instructor: ApplicantInstructorRow
  onResendNotificationClick?: () => void
  isGeneralOrganization: boolean
}) {
  if (instructor.approvalStatus === 'unknown') return <span>-</span>
  return (
    <ProgramApprovalStatusDetailValue
      status={instructor.approvalStatus}
      participationRejectionReason={instructor.rejectionReason}
      approvalNotificationSentAt={instructor.approvalNotificationSentAt}
      onResendNotificationClick={onResendNotificationClick}
      rejectionReasonFormat={isGeneralOrganization ? 'plain' : 'parenthesized'}
      sentAtDivider={!isGeneralOrganization}
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
  persistAffiliationEmploymentRemote = false,
  onAffiliationEmploymentStatusSaved,
  copyVariant = 'default',
}: ApplicantGeneralInstructorBasicInfoProps) {
  const isGeneralOrganization = copyVariant === 'general-organization'
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  /** 기관형은 관리자 코멘트를 「코멘트 수정」 모달로만 편집한다 */
  const isAdminCommentEditMode = isEditMode && !isGeneralOrganization
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
    toDisplayGender(instructor.gender),
    formatBirthDateAndAge(instructor.birthDate, instructor.age),
  ])

  const affiliationEmploymentStatus = resolveInstructorAffiliationEmploymentStatus(instructor)
  const affiliationEmploymentBadge =
    affiliationEmploymentStatus != null ? (
      <AffiliationEmploymentStatusField
        instructorId={instructor.id}
        affiliation={instructor.affiliation}
        employmentStatus={affiliationEmploymentStatus}
        affiliationOrganizationId={instructor.affiliationOrganizationId}
        instructorMemberId={instructor.instructorMemberId}
        persistRemote={persistAffiliationEmploymentRemote}
        onEmploymentStatusSaved={onAffiliationEmploymentStatusSaved}
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

  const contactDisplay = displayServerPiiAsIs(instructor.contact)

  const emailDisplay = displayServerPiiAsIs(instructor.email)

  const lectureFeeView = (
    <LectureFeeBasisView
      instructor={instructor}
      copyVariant={copyVariant}
    />
  )
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
              isGeneralOrganization={isGeneralOrganization}
            />
          }
        />
        <DetailInfoForm.Field
          label="JA 평가 등급"
          readOnlyDisplay
          view={
            <InstructorJaGradeField
              grade={instructor.evaluationGrade}
              memberId={instructor.instructorMemberId}
              editable={isEditMode && !isGeneralOrganization}
            />
          }
        />
      </DetailInfoForm.Row>
      {showPostApprovalFields ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="강사비 책정 기준"
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
      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={
            isAdminCommentEditMode && draft ? draft.adminComment : instructor.managerComment
          }
          mode={isAdminCommentEditMode ? 'edit' : 'view'}
          draftValue={draft?.adminComment ?? ''}
          onDraftChange={
            isAdminCommentEditMode && onDraftChange
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
          homeAddressDisplay: (
            <HomeAddressDisplay address={instructor.address} mask={maskSensitive} />
          ),
          accountDisplay: formatServerAccountDisplayContent(instructor),
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
