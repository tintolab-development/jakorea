import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
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
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

export type GeneralVolunteerApplicantBasicInfoStatusRow =
  | 'document_screening'
  | 'interview_assignment'
  | 'second_interview'

function formatBirthDateAndAge(birthDate: string, age: number): string {
  const formatted = birthDate.replace(/\./g, '. ')
  return `${formatted} (만 ${age}세)`
}

function DetailSubsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="general-volunteer-applicant-detail__subsection">
      <h3 className="general-volunteer-applicant-detail__subsection-title">{title}</h3>
      {children}
    </div>
  )
}

export interface GeneralVolunteerApplicantBasicInfoProps {
  applicant: GeneralVolunteerApplicantRow
  maskSensitive: boolean
  statusRow?: GeneralVolunteerApplicantBasicInfoStatusRow
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

  const statusLabel =
    statusRow === 'second_interview'
      ? '2차 면접 심사 현황'
      : statusRow === 'interview_assignment'
        ? '면접일 배정 현황'
        : '1차 서류 심사 현황'

  const statusValue =
    statusRow === 'second_interview' ? (
      (() => {
        const effectiveStatus = resolveGeneralEffectiveSecondInterviewStatus(applicant)
        if (effectiveStatus === 'withdrawn') {
          return <GeneralInterviewAssignmentStatusText status="withdrawn" />
        }
        return <GeneralSecondInterviewStatusText status={effectiveStatus} />
      })()
    ) : statusRow === 'interview_assignment' ? (
      <GeneralInterviewAssignmentStatusText status={applicant.interviewAssignmentStatus} />
    ) : (
      <GeneralDocumentScreeningStatusText status={applicant.documentScreeningStatus} />
    )

  return (
    <section className="general-volunteer-applicant-basic-info">
      <DetailSubsection title="기본 정보">
        <div className="general-volunteer-applicant-basic-info__tables">
          <div className="program-detail-info-tab__table-wrapper general-volunteer-applicant-detail__table-wrapper--vertical">
            <table className="program-detail-info-tab__table program-detail-info-tab__table--basic general-volunteer-applicant-detail__table--vertical">
              <tbody>
                <tr>
                  <th scope="row">{statusLabel}</th>
                  <td>{statusValue}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="applicant-instructor-basic-info__table-wrap general-volunteer-applicant-detail__grid-table-wrap">
            <table className="applicant-instructor-basic-info__table general-volunteer-applicant-detail__table--grid">
              <colgroup>
                <col className="col-pair-label" />
                <col />
                <col className="col-pair-label" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    성명
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {nameCell}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    1365 ID
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {applicant.id1365}
                  </td>
                </tr>
                <tr>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    연락처
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {contactDisplay}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    이메일
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {emailDisplay}
                  </td>
                </tr>
                <tr>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    성별 및 생년월일
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    <ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    지원 형태
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {formatGeneralVolunteerApplicationType(applicant.applicationType)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DetailSubsection>
    </section>
  )
}
