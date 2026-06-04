import { Descriptions } from 'antd'
import { CmsButton } from '@/shared/ui'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import {
  GENERAL_DOCUMENT_SCREENING_STATUS_LABELS,
  GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS,
  GENERAL_MANAGER_EVALUATION_LABELS,
  GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_LABELS,
  GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatGeneralVolunteerApplicationType,
  formatGeneralVolunteerEssayCellValue,
} from '@/features/program/general/lib/volunteer-screening-constants'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail.css'

export function GeneralVolunteerApplicantDetailView({
  applicant,
  variant,
  onDocumentReject,
  onDocumentApprove,
  onAssignInterview,
  onWithdrawActivity,
  onInterviewFail,
  onInterviewPass,
}: {
  applicant: GeneralVolunteerApplicantRow
  variant: 'doc_screening' | 'doc_passed' | 'interview2'
  onDocumentReject?: () => void
  onDocumentApprove?: () => void
  onAssignInterview?: () => void
  onWithdrawActivity?: () => void
  onInterviewFail?: () => void
  onInterviewPass?: () => void
}) {
  return (
    <div className="general-volunteer-applicant-detail applicant-details">
      <div className="program-detail-fullpage-modal__header-actions">
        {variant === 'doc_screening' ? (
          <>
            <CmsButton type="button" variant="delete" size="large" width={160} onClick={onDocumentReject}>
              반려
            </CmsButton>
            <CmsButton type="button" variant="secondary" size="large" width={160} onClick={onDocumentApprove}>
              승인
            </CmsButton>
          </>
        ) : null}
        {variant === 'doc_passed' ? (
          <>
            <CmsButton type="button" variant="delete" size="large" width={160} onClick={onWithdrawActivity}>
              활동 포기
            </CmsButton>
            <CmsButton type="button" variant="secondary" size="large" width={160} onClick={onAssignInterview}>
              면접일 배정
            </CmsButton>
          </>
        ) : null}
        {variant === 'interview2' ? (
          <>
            <CmsButton type="button" variant="delete" size="large" width={160} onClick={onWithdrawActivity}>
              활동 포기
            </CmsButton>
            <CmsButton type="button" variant="delete" size="large" width={160} onClick={onInterviewFail}>
              면접 불합격
            </CmsButton>
            <CmsButton type="button" variant="secondary" size="large" width={160} onClick={onInterviewPass}>
              면접 합격
            </CmsButton>
          </>
        ) : null}
      </div>

      <Descriptions bordered column={2} size="middle" className="general-volunteer-applicant-detail__info">
        <Descriptions.Item label="신청 봉사자명">{applicant.name}</Descriptions.Item>
        <Descriptions.Item label="연락처">{applicant.contact}</Descriptions.Item>
        <Descriptions.Item label="이메일">{applicant.email}</Descriptions.Item>
        <Descriptions.Item label="지원 형태">
          {formatGeneralVolunteerApplicationType(applicant.applicationType)}
        </Descriptions.Item>
        <Descriptions.Item label="담당자 A 평가">
          {GENERAL_MANAGER_EVALUATION_LABELS[applicant.managerAEvaluation]}
        </Descriptions.Item>
        <Descriptions.Item label="담당자 B 평가">
          {GENERAL_MANAGER_EVALUATION_LABELS[applicant.managerBEvaluation]}
        </Descriptions.Item>
        <Descriptions.Item label="1차 서류 심사 현황">
          {GENERAL_DOCUMENT_SCREENING_STATUS_LABELS[applicant.documentScreeningStatus]}
        </Descriptions.Item>
        <Descriptions.Item label="면접일 배정 현황">
          {GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS[applicant.interviewAssignmentStatus]}
        </Descriptions.Item>
        <Descriptions.Item label="면접일">
          {applicant.assignedInterviewDateLabel ?? '-'}
        </Descriptions.Item>
        <Descriptions.Item label="면접 시간">
          {applicant.assignedInterviewTime ?? '-'}
        </Descriptions.Item>
        <Descriptions.Item label="2차 면접 심사 현황">
          {applicant.secondInterviewScreeningStatus
            ? GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_LABELS[
                applicant.secondInterviewScreeningStatus
              ]
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="점수 종합">{applicant.totalScore ?? '-'}</Descriptions.Item>
      </Descriptions>

      <div className="general-volunteer-applicant-detail__essays">
        {(Object.keys(GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES) as Array<
          keyof typeof GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES
        >).map(key => (
          <section key={key} className="general-volunteer-applicant-detail__essay-section">
            <h3>{GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES[key]}</h3>
            <p>
              {formatGeneralVolunteerEssayCellValue(applicant.applicationType, applicant[key])}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}
