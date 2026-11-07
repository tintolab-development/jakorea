/**
 * 신청 강사 상세 - 기본 정보
 *
 * 승인 현황 테이블과 프로필 테이블을 분리해 신청 강사 상세 시안의
 * 4열 필드 배치를 그대로 사용한다.
 */

import type { ReactNode } from 'react'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ProgramApprovalStatusDetailValue } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/program-approval-status-detail-value'
import {
  AffiliationEmploymentStatusField,
  formatAccountDisplayContent,
  formatBirthDateAndAge,
  HomeAddressDisplay,
  InstructorBasicInfoDetailForm,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/instructor-basic-info-detail-form'
import { resolveInstructorAffiliationEmploymentStatus } from '@/features/program/general/lib/instructor-affiliation-employment-display'
import { formatJaEvaluationGradeCellDisplay } from '@/features/program/general/lib/ja-evaluation-grade-display'
import {
  BusinessIncomeView,
  InstructorFeeGradeView,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-fee-fields'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import './applicant-instructor-basic-info.css'

export interface ApplicantInstructorBasicInfoProps {
  instructor: ApplicantInstructorRow
  /** true면 연락처·이메일·주소·정산 계좌를 신청 상세 정책에 따라 마스킹 */
  maskSensitive?: boolean
  /** 승인 현황 테이블 표시 여부 */
  showApprovalStatus?: boolean
  /** 한 줄 소개 표시 여부 */
  showOneLineIntro?: boolean
  /** 기존 호출부 호환용. 신청 상세에서는 강사비/사업소득자 필드가 기본 테이블에 표시된다. */
  showPostApprovalFields?: boolean
  /** 회원 관리 강사 상세 등에서 사용하는 하단 가입 정보. */
  memberBasicInfoFooter?: {
    joinDate: string
    linkedSocial: string
  }
  onResendNotificationClick?: () => void
  privacyMaskAddress?: boolean
}

function formatEvaluationGrade(value?: string): string {
  return formatJaEvaluationGradeCellDisplay(value)
}

function buildAffiliationCell(instructor: ApplicantInstructorRow): ReactNode {
  const affiliation = instructor.affiliation?.trim()
  if (!affiliation) return '-'

  const employmentStatus = resolveInstructorAffiliationEmploymentStatus(instructor)
  const employmentBadge = employmentStatus ? (
    <AffiliationEmploymentStatusField
      instructorId={instructor.id}
      affiliation={instructor.affiliation}
      employmentStatus={employmentStatus}
      affiliationOrganizationId={instructor.affiliationOrganizationId}
      instructorMemberId={instructor.instructorMemberId}
      persistRemote={false}
    />
  ) : null

  return employmentBadge ? (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider([affiliation, employmentBadge])}
    </ProgramDetailTdSegmentWrap>
  ) : (
    affiliation
  )
}

function buildStatusRows(
  instructor: ApplicantInstructorRow,
  showApprovalStatus: boolean,
  onResendNotificationClick?: () => void
): ReactNode {
  if (instructor.approvalStatus === 'unknown') return '-'
  return showApprovalStatus ? (
    <ProgramApprovalStatusDetailValue
      status={instructor.approvalStatus}
      participationRejectionReason={instructor.rejectionReason}
      approvalNotificationSentAt={instructor.approvalNotificationSentAt}
      onResendNotificationClick={onResendNotificationClick}
    />
  ) : (
    instructor.settlementStatusLabel?.trim() || '-'
  )
}

export function ApplicantInstructorBasicInfo({
  instructor,
  maskSensitive = true,
  showApprovalStatus = true,
  showOneLineIntro = true,
  privacyMaskAddress = false,
  onResendNotificationClick,
}: ApplicantInstructorBasicInfoProps) {
  const managerComment = instructor.managerComment?.trim()
  const showManagerComment = instructor.approvalStatus === 'approved' && Boolean(managerComment)
  const shouldMask = maskSensitive && instructor.approvalStatus !== 'approved'
  const addressMask = shouldMask || privacyMaskAddress
  const scheduleChangeCount = instructor.scheduleChangeCancelCount ?? 0

  const nameCell =
    scheduleChangeCount > 0 ? (
      <>
        {instructor.instructorName}
        <ScheduleChangeHistoryBadge
          count={scheduleChangeCount}
          className="applicant-instructor-basic-info__name-badge"
        />
      </>
    ) : (
      instructor.instructorName
    )

  const profile = {
    nameCell,
    genderBirthDisplay: withProgramDetailTdDivider(
      [instructor.gender, formatBirthDateAndAge(instructor.birthDate, instructor.age)].filter(
        Boolean
      )
    ),
    affiliationCell: buildAffiliationCell(instructor),
    lectureExperienceDisplay:
      instructor.lectureExperienceYears != null
        ? `${instructor.lectureExperienceYears}년`
        : instructor.teachingExperience?.trim() || '-',
    contactDisplay: displayServerPiiAsIs(instructor.contact),
    emailDisplay: displayServerPiiAsIs(instructor.email),
    homeAddressDisplay: <HomeAddressDisplay address={instructor.address} mask={addressMask} />,
    accountDisplay: formatAccountDisplayContent(instructor, shouldMask),
    instructorFeeGradeView: <InstructorFeeGradeView instructor={instructor} />,
    businessIncomeView: <BusinessIncomeView instructor={instructor} />,
    oneLineIntro: showOneLineIntro ? instructor.oneLineIntro?.trim() || '-' : '-',
  }

  return (
    <div className="applicant-instructor-basic-info__legacy">
      {showManagerComment ? (
        <div className="applicant-instructor-basic-info__manager-comment">
          <div className="applicant-instructor-basic-info__manager-comment-title">
            관리자 코멘트
          </div>
          <div className="applicant-instructor-basic-info__manager-comment-content">
            {managerComment}
          </div>
        </div>
      ) : null}
      <InstructorBasicInfoDetailForm
        statusRows={
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label={showApprovalStatus ? '프로그램 승인 현황' : '정산 현황'}
              view={buildStatusRows(instructor, showApprovalStatus, onResendNotificationClick)}
              readOnlyDisplay
            />
            <DetailInfoForm.Field
              label="JA 평가 등급"
              view={formatEvaluationGrade(instructor.evaluationGrade)}
              readOnlyDisplay
            />
          </DetailInfoForm.Row>
        }
        profile={profile}
      />
    </div>
  )
}
