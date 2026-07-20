import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  formatUjatVolunteerApplicationType,
  type UjatVolunteerApplicantRow,
} from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  formatUjatVolunteerApplicationRoute,
  formatUjatVolunteerBirthDateAndAge,
  formatUjatVolunteerUniversityDisplay,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { DocumentScreeningStatusText } from '../shared/document-screening-status-text'
import { InterviewAssignmentStatusText } from '../shared/interview-assignment-status-text'
import { SecondInterviewScreeningStatusText } from '@/features/program/shared/ui/volunteer-screening/second-interview-screening-status-text'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'

export type ApplicantBasicInfoStatusRow =
  | 'document_screening'
  | 'interview_assignment'
  | 'second_interview'

export interface ApplicantBasicInfoProps {
  applicant: UjatVolunteerApplicantRow
  maskSensitive: boolean
  statusRow?: ApplicantBasicInfoStatusRow
}

function resolveStatusField(
  applicant: UjatVolunteerApplicantRow,
  statusRow: ApplicantBasicInfoStatusRow
): { label: string; value: ReactNode } {
  if (statusRow === 'second_interview') {
    return {
      label: '2차 면접 심사 현황',
      value: applicant.secondInterviewScreeningStatus ? (
        <SecondInterviewScreeningStatusText status={applicant.secondInterviewScreeningStatus} />
      ) : (
        '—'
      ),
    }
  }

  if (statusRow === 'interview_assignment') {
    return {
      label: '면접일 배정 현황',
      value: <InterviewAssignmentStatusText status={applicant.interviewAssignmentStatus} />,
    }
  }

  return {
    label: '1차 서류 심사 현황',
    value: <DocumentScreeningStatusText status={applicant.documentScreeningStatus} />,
  }
}

function formatSchoolEnrollmentStatus(grade: UjatVolunteerApplicantRow['grade']): string {
  if (grade === '휴학생') return '휴학 중'
  if (grade === '졸업유예') return '졸업유예'
  return '재학 중'
}

function maskId1365(id: string): string {
  if (id.length <= 4) return '*'.repeat(id.length)
  return `${id.slice(0, 4)}***`
}

export function ApplicantBasicInfo({
  applicant,
  maskSensitive,
  statusRow = 'document_screening',
}: ApplicantBasicInfoProps) {
  const contactDisplay = maskSensitive ? applicant.contact : applicant.contactRaw
  const emailDisplay = maskSensitive ? applicant.email : applicant.emailRaw
  const id1365Display = maskSensitive ? maskId1365(applicant.id1365) : applicant.id1365
  const applicationTypeDisplay = formatUjatVolunteerApplicationType(
    applicant.hasEducationExperience ? 'ujat-graduate' : 'new'
  )
  const genderBirthDisplay = withProgramDetailTdDivider([
    applicant.gender,
    formatUjatVolunteerBirthDateAndAge(applicant.birthDate, applicant.age),
  ])
  const affiliationDisplay = withProgramDetailTdDivider([
    formatUjatVolunteerUniversityDisplay(applicant.universityName, maskSensitive),
    applicant.grade,
  ])
  const universityGradeDisplay = withProgramDetailTdDivider([
    formatUjatVolunteerUniversityDisplay(applicant.universityName, maskSensitive),
    applicant.grade,
  ])
  const applicationRouteDisplay = formatUjatVolunteerApplicationRoute(
    applicant.applicationRoute,
    applicant.applicationRouteOther
  )

  const nameCell =
    applicant.scheduleChangeCancelCount > 0 ? (
      <>
        {applicant.name}
        <ScheduleChangeHistoryBadge
          count={applicant.scheduleChangeCancelCount}
          className="applicant-basic-info__name-badge"
        />
      </>
    ) : (
      applicant.name
    )

  const statusField = resolveStatusField(applicant, statusRow)

  return (
    <section className="applicant-basic-info">
      <DetailInfoForm title="기본 정보" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label={statusField.label}
            fullRow
            readOnlyDisplay
            view={statusField.value}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm title="기본 정보" hideHeader mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="성명" readOnlyDisplay view={nameCell} />
          <DetailInfoForm.Field
            label="성별 및 생년월일"
            readOnlyDisplay
            view={<ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="학교 재학 여부"
            readOnlyDisplay
            view={formatSchoolEnrollmentStatus(applicant.grade)}
          />
          <DetailInfoForm.Field
            label="소속"
            readOnlyDisplay
            view={<ProgramDetailTdSegmentWrap>{affiliationDisplay}</ProgramDetailTdSegmentWrap>}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="연락처" readOnlyDisplay view={contactDisplay} />
          <DetailInfoForm.Field label="이메일" readOnlyDisplay view={emailDisplay} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="자택 주소지" readOnlyDisplay view="-" />
          <DetailInfoForm.Field label="1365 ID" readOnlyDisplay view={id1365Display} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 진행 경험 여부"
            readOnlyDisplay
            view={applicant.hasEducationExperience ? '있음' : '없음'}
          />
          <DetailInfoForm.Field
            label="희망 교육 활동 지역"
            readOnlyDisplay
            view={applicant.preferredRegion}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="대학교 및 학년"
            readOnlyDisplay
            view={<ProgramDetailTdSegmentWrap>{universityGradeDisplay}</ProgramDetailTdSegmentWrap>}
          />
          <DetailInfoForm.Field label="대학 전공" readOnlyDisplay view={applicant.major} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지원 형태"
            readOnlyDisplay
            view={applicationTypeDisplay}
          />
          <DetailInfoForm.Field
            label="지원 경로"
            readOnlyDisplay
            view={applicationRouteDisplay}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
