/**
 * 일반 프로그램 — 개인 유형 참여자 신청 상세
 * 스크린샷 시안: 기본 정보 / 자기소개 및 지원동기 / 팀 정보
 */

import type { ReactNode } from 'react'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import { ProgramApprovalStatusDetailValue } from '@/features/program/general/ui/applicant-detail/program-approval-status-detail-value'
import { GeneralIndividualTeamRoleDropdown } from '@/features/program/general/ui/applicant-detail/general-individual-team-role-dropdown'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-resume.css'
import './applicant-general-individual-basic-info.css'

export interface ApplicantGeneralIndividualBasicInfoProps {
  applicant: GeneralIndividualApplicantRow
  maskSensitive?: boolean
}

function formatBirthDateAndAge(birthDate?: string, age?: number): string {
  if (!birthDate && age == null) return '-'
  const formatted = birthDate ? birthDate.split('.').join('. ') : ''
  if (formatted && age != null) return `${formatted} (만 ${age}세)`
  if (formatted) return formatted
  if (age != null) return `만 ${age}세`
  return '-'
}

function maskId1365(id: string): string {
  if (id.length <= 4) return '*'.repeat(id.length)
  return `${id.slice(0, 4)}***`
}

function splitAddressAfterDong(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{2,12}동)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const dong = m[1]
  const i = address.indexOf(dong)
  if (i === -1) return null
  const end = i + dong.length
  return { head: address.slice(0, end), tail: address.slice(end) }
}

function splitAddressAfterGu(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{1,12}구)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const gu = m[1]
  const i = address.indexOf(gu)
  if (i === -1) return null
  const end = i + gu.length
  return { head: address.slice(0, end), tail: address.slice(end) }
}

function formatHomeAddressDisplay(address: string | undefined, mask: boolean): ReactNode {
  if (!address?.trim()) return '-'
  if (!mask) return address
  const split = splitAddressAfterDong(address) ?? splitAddressAfterGu(address)
  if (!split?.tail.trim()) {
    const parts = address.trim().split(/\s+/).filter(Boolean)
    if (parts.length <= 2) return parts.join(' ')
    return `${parts[0]} ${parts[1]} …`
  }
  return `${split.head} …`
}

function TableRowTwoCols({
  label1,
  value1,
  label2,
  value2,
}: {
  label1: string
  value1: ReactNode
  label2: string
  value2: ReactNode
}) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label2}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value2}
      </td>
    </tr>
  )
}

function TableRowFullWidth({ label, value }: { label: string; value: ReactNode }) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label}
      </td>
      <td
        colSpan={3}
        className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
      >
        {value}
      </td>
    </tr>
  )
}

function ProgramApprovalStatusValue({ applicant }: { applicant: GeneralIndividualApplicantRow }) {
  return (
    <ProgramApprovalStatusDetailValue
      status={applicant.approvalStatus}
      participationRejectionReason={applicant.participationRejectionReason}
      approvalNotificationSentAt={applicant.approvalNotificationSentAt}
    />
  )
}

export function ApplicantGeneralIndividualBasicInfo({
  applicant,
  maskSensitive = true,
}: ApplicantGeneralIndividualBasicInfoProps) {
  const detail = applicant.detail
  const shouldMask = maskSensitive && applicant.approvalStatus !== 'approved'

  const scheduleChangeCount =
    detail?.scheduleChangeCancelCount ?? 0

  const nameCell =
    scheduleChangeCount > 0 ? (
      <>
        {applicant.applicantName}
        <ScheduleChangeHistoryBadge
          count={scheduleChangeCount}
          className="applicant-general-individual-basic-info__name-badge"
        />
      </>
    ) : (
      applicant.applicantName
    )

  const genderBirthDisplay = withProgramDetailTdDivider([
    detail?.gender ?? '-',
    formatBirthDateAndAge(detail?.birthDate, detail?.age),
  ])

  const affiliationDisplay =
    detail?.affiliationSchool || detail?.affiliationGrade ? (
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider(
          [detail?.affiliationSchool ?? '-', detail?.affiliationGrade ?? '-'].filter(
            v => v !== '-'
          ).length > 0
            ? [detail?.affiliationSchool ?? '-', detail?.affiliationGrade ?? '-']
            : [applicant.affiliation, applicant.educationGrade]
        )}
      </ProgramDetailTdSegmentWrap>
    ) : (
      withProgramDetailTdDivider([applicant.affiliation, applicant.educationGrade])
    )

  const contactDisplay = detail?.contact
    ? shouldMask
      ? MASKING_POLICY.phone(detail.contact.replace(/\s/g, '')) || detail.contact
      : detail.contact
    : '-'

  const emailDisplay = detail?.email
    ? shouldMask
      ? MASKING_POLICY.email(detail.email)
      : detail.email
    : '-'

  const homeAddressDisplay = formatHomeAddressDisplay(
    detail?.homeAddressFull ?? applicant.homeAddress,
    shouldMask
  )

  const id1365Display = detail?.id1365
    ? shouldMask
      ? maskId1365(detail.id1365)
      : detail.id1365
    : '-'

  const teamMembersDisplay =
    detail?.teamName != null && detail.teamMemberCount != null
      ? withProgramDetailTdDivider([detail.teamName, `${detail.teamMemberCount}명`])
      : '-'

  const colgroup = (
    <colgroup>
      <col style={{ width: '200px' }} />
      <col />
      <col style={{ width: '200px' }} />
      <col />
    </colgroup>
  )

  return (
    <div className="applicant-general-individual-basic-info applicant-institution-basic-info">
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">기본 정보</h3>
        <div className="applicant-institution-basic-info__basic-info-fields">
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {colgroup}
              <tbody>
                <TableRowFullWidth
                  label="프로그램 승인 현황"
                  value={<ProgramApprovalStatusValue applicant={applicant} />}
                />
              </tbody>
            </table>
          </div>
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {colgroup}
              <tbody>
              <TableRowTwoCols
                label1="성명"
                value1={nameCell}
                label2="성별 및 생년월일"
                value2={<ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>}
              />
              <TableRowTwoCols
                label1="학교 재학 여부"
                value1={detail?.schoolEnrollmentStatus ?? '-'}
                label2="소속"
                value2={affiliationDisplay}
              />
              <TableRowTwoCols
                label1="연락처"
                value1={contactDisplay}
                label2="이메일"
                value2={emailDisplay}
              />
              <TableRowTwoCols
                label1="자택 주소지"
                value1={homeAddressDisplay}
                label2="1365 ID"
                value2={id1365Display}
              />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="instructor-resume-section instructor-resume-section--free-writing">
        <h3 className="instructor-resume-section-title instructor-resume-section-title--free-writing">
          자기소개 및 지원동기
        </h3>
        <div className="instructor-resume-free-writing-card">
          <p className="instructor-resume-free-writing-text">
            {detail?.selfIntroduction?.trim() || '-'}
          </p>
        </div>
      </section>

      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">팀 정보</h3>
        <div className="applicant-institution-basic-info__table-wrap applicant-general-individual-basic-info__team-table">
          <table className="applicant-institution-basic-info__table">
            {colgroup}
            <tbody>
              <TableRowFullWidth label="팀 명 및 팀원" value={teamMembersDisplay} />
              <TableRowFullWidth
                label="역할"
                value={
                  <GeneralIndividualTeamRoleDropdown
                    applicantId={applicant.id}
                    teamRole={detail?.teamRole}
                  />
                }
              />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
