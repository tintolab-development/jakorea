/**
 * 신청 강사 상세 - 기본 정보 테이블
 * 학력사항 위에 배치, 이미지 시안과 동일한 4열 그리드(성명 한글/영문, 프로그램 승인 현황, 성별 및 생년월일 등)
 */

import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import './applicant-instructor-basic-info.css'

const APPROVAL_STATUS_LABELS: Record<ApplicantInstructorRow['approvalStatus'], string> = {
  pending: '대기 중',
  approved: '승인 완료',
  rejected: '참여 반려',
}

function formatBirthDateAndAge(birthDate?: string, age?: number): string {
  if (!birthDate && age == null) return '-'
  const formatted = birthDate ? birthDate.split('.').join('. ') : ''
  if (formatted && age != null) return `${formatted} (만 ${age}세)`
  if (formatted) return formatted
  if (age != null) return `만 ${age}세`
  return '-'
}

function formatAccountDisplay(instructor: ApplicantInstructorRow, mask: boolean): string {
  const bank = instructor.bankName ?? ''
  const num = instructor.accountNumber ?? ''
  const holder = instructor.accountHolder ?? ''
  if (!bank && !num && !holder) return '-'
  if (mask) {
    const maskedNum = num ? MASKING_POLICY.accountNumber(num) : ''
    const maskedHolder = holder ? MASKING_POLICY.name(holder) : ''
    return [bank, maskedNum].filter(Boolean).join(' ') + (maskedHolder ? ` | ${maskedHolder}` : '')
  }
  return [bank, num].filter(Boolean).join(' ') + (holder ? ` | ${holder}` : '')
}

export interface ApplicantInstructorBasicInfoProps {
  instructor: ApplicantInstructorRow
  /** true면 연락처·이메일·주소·정산 계좌 마스킹 (승인 완료가 아닐 때) */
  maskSensitive?: boolean
}

export function ApplicantInstructorBasicInfo({
  instructor,
  maskSensitive = true,
}: ApplicantInstructorBasicInfoProps) {
  const mask = maskSensitive && instructor.approvalStatus !== 'approved'
  const contactDisplay = instructor.contact
    ? mask
      ? MASKING_POLICY.phone(instructor.contact)
      : instructor.contact
    : '-'
  const emailDisplay = instructor.email
    ? mask
      ? MASKING_POLICY.email(instructor.email)
      : instructor.email
    : '-'
  const addressDisplay = instructor.address
    ? mask
      ? MASKING_POLICY.address(instructor.address)
      : instructor.address
    : '-'
  const accountDisplay = formatAccountDisplay(instructor, mask)
  const birthDisplay = formatBirthDateAndAge(instructor.birthDate, instructor.age)
  const genderBirthDisplay = [instructor.gender, birthDisplay].filter(Boolean).join(' | ') || '-'
  const educationDisplay =
    [instructor.educationLevel, instructor.educationSchoolName].filter(Boolean).join(' | ') || '-'
  const affiliationDisplay =
    [
      instructor.affiliation ?? '',
      instructor.lectureExperienceYears != null ? `${instructor.lectureExperienceYears}년` : '',
      instructor.evaluationGrade ? `${instructor.evaluationGrade}등급` : '',
    ]
      .filter(Boolean)
      .join(' | ') || '-'

  const nameKoreanCell =
    instructor.scheduleChangeCancelCount != null && instructor.scheduleChangeCancelCount > 0 ? (
      <>
        {instructor.instructorName}
        <ScheduleChangeHistoryBadge
          count={instructor.scheduleChangeCancelCount}
          className="applicant-instructor-basic-info__name-badge"
        />
      </>
    ) : (
      instructor.instructorName
    )

  const approvalStatusLabel = APPROVAL_STATUS_LABELS[instructor.approvalStatus] ?? '-'

  return (
    <section className="applicant-instructor-basic-info">
      <h3 className="applicant-instructor-basic-info__title">기본 정보</h3>
      <div className="applicant-instructor-basic-info__table-wrap">
        <table className="applicant-instructor-basic-info__table">
          <colgroup>
            <col style={{ width: '140px' }} />
            <col style={{ width: '80px' }} />
            <col />
            <col style={{ width: '160px' }} />
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
                {nameKoreanCell}
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                프로그램 승인 현황
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {approvalStatusLabel}
              </td>
            </tr>
            <tr>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                영문
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {instructor.nameEnglish ?? '-'}
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                성별 및 생년월일
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {genderBirthDisplay}
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
                자택 주소
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {addressDisplay}
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                정산 계좌 정보
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {accountDisplay}
              </td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
              >
                최종 학력
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {educationDisplay}
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                소속 및 강사 경력
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {affiliationDisplay}
              </td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
              >
                한 줄 소개
              </td>
              <td
                colSpan={3}
                className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value applicant-instructor-basic-info__cell--one-line"
              >
                {instructor.oneLineIntro ?? '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
