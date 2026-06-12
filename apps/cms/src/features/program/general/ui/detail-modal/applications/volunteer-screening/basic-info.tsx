import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { formatGeneralVolunteerApplicationType } from '@/features/program/general/lib/volunteer-screening-constants'
import { resolveGeneralEffectiveSecondInterviewStatus } from '@/features/program/general/lib/general-volunteer-interview2-display'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  GeneralDocumentScreeningStatusText,
  GeneralInterviewAssignmentStatusText,
  GeneralSecondInterviewStatusText,
} from './status-text'

export type GeneralVolunteerApplicantBasicInfoStatusRow =
  | 'document_screening'
  | 'interview_assignment'
  | 'second_interview'

function formatBirthDateAndAge(birthDate: string, age: number): string {
  const formatted = birthDate.replace(/\./g, '. ')
  return `${formatted} (만 ${age}세)`
}

export interface GeneralVolunteerApplicantBasicInfoProps {
  applicant: GeneralVolunteerApplicantRow
  maskSensitive: boolean
  statusRow?: GeneralVolunteerApplicantBasicInfoStatusRow
}

function resolveStatusField(
  applicant: GeneralVolunteerApplicantRow,
  statusRow: GeneralVolunteerApplicantBasicInfoStatusRow
): { label: string; value: ReactNode } {
  if (statusRow === 'second_interview') {
    const effectiveStatus = resolveGeneralEffectiveSecondInterviewStatus(applicant)
    return {
      label: '2차 면접 심사 현황',
      value:
        effectiveStatus === 'withdrawn' ? (
          <GeneralInterviewAssignmentStatusText status="withdrawn" />
        ) : (
          <GeneralSecondInterviewStatusText status={effectiveStatus} />
        ),
    }
  }

  if (statusRow === 'interview_assignment') {
    return {
      label: '면접일 배정 현황',
      value: <GeneralInterviewAssignmentStatusText status={applicant.interviewAssignmentStatus} />,
    }
  }

  return {
    label: '1차 서류 심사 현황',
    value: <GeneralDocumentScreeningStatusText status={applicant.documentScreeningStatus} />,
  }
}

export function GeneralVolunteerApplicantBasicInfo({
  applicant,
  maskSensitive,
  statusRow = 'document_screening',
}: GeneralVolunteerApplicantBasicInfoProps) {
  const contactDisplay = maskSensitive ? applicant.contact : applicant.contactRaw
  const emailDisplay = maskSensitive ? applicant.email : applicant.emailRaw
  const genderBirthDisplay = withProgramDetailTdDivider([
    applicant.gender,
    formatBirthDateAndAge(applicant.birthDate, applicant.age),
  ])

  const nameCell =
    applicant.scheduleChangeCancelCount > 0 ? (
      <>
        {applicant.name}
        <ScheduleChangeHistoryBadge
          count={applicant.scheduleChangeCancelCount}
          className="applicant-instructor-basic-info__name-badge"
        />
      </>
    ) : (
      applicant.name
    )

  const statusField = resolveStatusField(applicant, statusRow)

  return (
    <section className="general-volunteer-applicant-basic-info">
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
          <DetailInfoForm.Field label="1365 ID" readOnlyDisplay view={applicant.id1365} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="연락처" readOnlyDisplay view={contactDisplay} />
          <DetailInfoForm.Field label="이메일" readOnlyDisplay view={emailDisplay} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="성별 및 생년월일"
            readOnlyDisplay
            view={<ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>}
          />
          <DetailInfoForm.Field
            label="지원 형태"
            readOnlyDisplay
            view={formatGeneralVolunteerApplicationType(applicant.applicationType)}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
