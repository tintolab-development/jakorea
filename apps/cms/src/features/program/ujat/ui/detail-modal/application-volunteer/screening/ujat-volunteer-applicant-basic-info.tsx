import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  formatUjatVolunteerApplicationType,
  type UjatVolunteerApplicantRow,
} from '@/data/mock/ujat-volunteer-applicants-mock'
import { DocumentScreeningStatusText } from './document-screening-status-text'
import { InterviewAssignmentStatusText } from './interview-assignment-status-text'
import { SecondInterviewScreeningStatusText } from './second-interview-screening-status-text'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'

export type UjatVolunteerApplicantBasicInfoStatusRow =
  | 'document_screening'
  | 'interview_assignment'
  | 'second_interview'

function formatBirthDateAndAge(birthDate: string, age: number): string {
  const formatted = birthDate.replace(/\./g, '. ')
  return `${formatted} (만 ${age}세)`
}

export interface UjatVolunteerApplicantBasicInfoProps {
  applicant: UjatVolunteerApplicantRow
  maskSensitive: boolean
  statusRow?: UjatVolunteerApplicantBasicInfoStatusRow
}

function resolveStatusField(
  applicant: UjatVolunteerApplicantRow,
  statusRow: UjatVolunteerApplicantBasicInfoStatusRow
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

export function UjatVolunteerApplicantBasicInfo({
  applicant,
  maskSensitive,
  statusRow = 'document_screening',
}: UjatVolunteerApplicantBasicInfoProps) {
  const contactDisplay = maskSensitive ? applicant.contact : applicant.contactRaw
  const emailDisplay = maskSensitive ? applicant.email : applicant.emailRaw
  const genderBirthDisplay = withProgramDetailTdDivider([
    applicant.gender,
    formatBirthDateAndAge(applicant.birthDate, applicant.age),
  ])
  const universityGradeDisplay = withProgramDetailTdDivider([
    applicant.universityName,
    applicant.grade,
  ])

  const nameCell =
    applicant.scheduleChangeCancelCount > 0 ? (
      <>
        {applicant.name}
        <ScheduleChangeHistoryBadge
          count={applicant.scheduleChangeCancelCount}
          className="ujat-volunteer-applicant-basic-info__name-badge"
        />
      </>
    ) : (
      applicant.name
    )

  const statusField = resolveStatusField(applicant, statusRow)

  return (
    <section className="ujat-volunteer-applicant-basic-info">
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
        <DetailInfoForm.NameBlock
          rows={[
            {
              subLabel: '한글',
              main: nameCell,
              sideLabel: '1365 ID',
              side: applicant.id1365,
            },
            {
              subLabel: '영문',
              main: applicant.englishName,
              sideLabel: '성별 및 생년월일',
              side: <ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>,
            },
          ]}
        />
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="연락처" readOnlyDisplay view={contactDisplay} />
          <DetailInfoForm.Field label="이메일" readOnlyDisplay view={emailDisplay} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="희망 교육 활동 지역"
            readOnlyDisplay
            view={applicant.preferredRegion}
          />
          <DetailInfoForm.Field
            label="지원 형태"
            readOnlyDisplay
            view={formatUjatVolunteerApplicationType(applicant.applicationType)}
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
            label="교육 진행 경험 여부"
            readOnlyDisplay
            view={applicant.hasEducationExperience ? '있음' : '없음'}
          />
          <DetailInfoForm.Field label="지원 경로" readOnlyDisplay view={applicant.applicationRoute} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
