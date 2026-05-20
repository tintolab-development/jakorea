import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import {
  formatUjatVolunteerApplicationType,
  type UjatVolunteerApplicantRow,
} from '@/data/mock/ujat-volunteer-applicants-mock'
import { DocumentScreeningStatusText } from './document-screening-status-text'
import { InterviewAssignmentStatusText } from './interview-assignment-status-text'

export type UjatVolunteerApplicantBasicInfoStatusRow =
  | 'document_screening'
  | 'interview_assignment'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

function formatBirthDateAndAge(birthDate: string, age: number): string {
  const formatted = birthDate.replace(/\./g, '. ')
  return `${formatted} (만 ${age}세)`
}

function DetailSubsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ujat-volunteer-applicant-detail__subsection">
      <h3 className="ujat-volunteer-applicant-detail__subsection-title">{title}</h3>
      {children}
    </div>
  )
}

export interface UjatVolunteerApplicantBasicInfoProps {
  applicant: UjatVolunteerApplicantRow
  maskSensitive: boolean
  statusRow?: UjatVolunteerApplicantBasicInfoStatusRow
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
          className="applicant-instructor-basic-info__name-badge"
        />
      </>
    ) : (
      applicant.name
    )

  return (
    <section className="ujat-volunteer-applicant-basic-info">
      <DetailSubsection title="기본 정보">
        <BasicInfoTables>
          <div className="program-detail-info-tab__table-wrapper ujat-volunteer-applicant-detail__table-wrapper--vertical">
            <table className="program-detail-info-tab__table program-detail-info-tab__table--basic ujat-volunteer-applicant-detail__table--vertical">
              <tbody>
                <tr>
                  <th scope="row">
                    {statusRow === 'interview_assignment'
                      ? '면접일 배정 현황'
                      : '1차 서류 심사 현황'}
                  </th>
                  <td>
                    {statusRow === 'interview_assignment' ? (
                      <InterviewAssignmentStatusText
                        status={applicant.interviewAssignmentStatus}
                      />
                    ) : (
                      <DocumentScreeningStatusText status={applicant.documentScreeningStatus} />
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="applicant-instructor-basic-info__table-wrap ujat-volunteer-applicant-detail__grid-table-wrap">
            <table className="applicant-instructor-basic-info__table ujat-volunteer-applicant-detail__table--grid">
              <colgroup>
                <col className="col-name-group" />
                <col className="col-name-sub" />
                <col />
                <col className="col-pair-label" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td
                    rowSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label applicant-instructor-basic-info__cell--name"
                  >
                    성명
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    한글
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
                    영문
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {applicant.englishName}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    성별 및 생년월일
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    <ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
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
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
                    희망 교육 활동 지역
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {applicant.preferredRegion}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    지원 형태
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {formatUjatVolunteerApplicationType(applicant.applicationType)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
                    대학교 및 학년
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    <ProgramDetailTdSegmentWrap>{universityGradeDisplay}</ProgramDetailTdSegmentWrap>
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    대학 전공
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {applicant.major}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
                    교육 진행 경험 여부
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {applicant.hasEducationExperience ? '있음' : '없음'}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    지원 경로
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {applicant.applicationRoute}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BasicInfoTables>
      </DetailSubsection>
    </section>
  )
}

function BasicInfoTables({ children }: { children: ReactNode }) {
  return <div className="ujat-volunteer-applicant-basic-info__tables">{children}</div>
}
