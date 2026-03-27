/**
 * 신청 강사 상세 - 기본 정보 테이블
 * 학력사항 위에 배치, 이미지 시안과 동일한 4열 그리드(성명 한글/영문, 프로그램 승인 현황, 성별 및 생년월일 등)
 */

import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { SendNotiButton } from '@/features/program/ui/detail-modal/components/send-noti-button'
import './applicant-instructor-basic-info.css'

const APPROVAL_STATUS_LABELS: Record<ApplicantInstructorRow['approvalStatus'], string> = {
  pending: '대기 중',
  approved: '승인 완료',
  rejected: '참여 반려',
}

function ProgramApprovalStatusValue({ instructor }: { instructor: ApplicantInstructorRow }) {
  const status = instructor.approvalStatus
  if (status === 'pending') {
    return <>{APPROVAL_STATUS_LABELS.pending}</>
  }
  if (status === 'approved') {
    return (
      <div className="applicant-instructor-basic-info__approval-status-row">
        <span>{APPROVAL_STATUS_LABELS.approved}</span>
        <span className="applicant-instructor-basic-info__approval-status-vbar" aria-hidden />
        <SendNotiButton />
      </div>
    )
  }
  if (status === 'rejected') {
    const reason = instructor.rejectionReason ?? '-'
    return (
      <div className="applicant-instructor-basic-info__approval-status-row">
        <span>{APPROVAL_STATUS_LABELS.rejected}</span>
        <span className="applicant-instructor-basic-info__approval-status-vbar" aria-hidden />
        <span>사유 : {reason}</span>
        <span className="applicant-instructor-basic-info__approval-status-vbar" aria-hidden />
        <SendNotiButton />
      </div>
    )
  }
  return <>-</>
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
    const maskedHolder = holder ? MASKING_POLICY.accountHolderName(holder) : ''
    return [bank, maskedNum].filter(Boolean).join(' ') + (maskedHolder ? ` | ${maskedHolder}` : '')
  }
  return [bank, num].filter(Boolean).join(' ') + (holder ? ` | ${holder}` : '')
}

/** 읍·면·동 단위까지 노출, 그 이후는 블러(마스킹 모드). 'OO동' 형태만 매칭(동작구 등 제외). */
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

/** 최종 학력 학교명: 접미사(대학교·고등학교 등)만 남기고 앞은 *** (예: 동서울대학교 → ***대학교) */
function maskEducationSchoolName(name: string): string {
  const suffixes = [
    '교육대학교',
    '전문대학교',
    '초등학교',
    '고등학교',
    '중학교',
    '대학교',
    '대학원',
    '대학',
    '전문대',
  ].sort((a, b) => b.length - a.length)
  for (const suf of suffixes) {
    if (name.endsWith(suf)) {
      return `***${suf}`
    }
  }
  if (name.length <= 2) return '**'
  return `***${name.slice(-2)}`
}

function AddressDisplay({ address, mask }: { address: string; mask: boolean }) {
  if (!address) return <>-</>
  if (!mask) return <>{address}</>
  const split = splitAddressAfterDong(address)
  if (!split) {
    return <>{MASKING_POLICY.address(address)}</>
  }
  const { head, tail } = split
  if (!tail.trim()) {
    return <>{head}</>
  }
  return (
    <>
      {head}
      <span className="applicant-instructor-basic-info__address-blur" aria-hidden="true">
        {tail}
      </span>
    </>
  )
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
  const managerComment = instructor.managerComment
  const showManagerComment = instructor.approvalStatus === 'approved' && !!managerComment
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
  const accountDisplay = formatAccountDisplay(instructor, mask)
  const birthDisplay = formatBirthDateAndAge(instructor.birthDate, instructor.age)
  const genderBirthDisplay = [instructor.gender, birthDisplay].filter(Boolean).join(' | ') || '-'
  const schoolPart = instructor.educationSchoolName
    ? mask
      ? maskEducationSchoolName(instructor.educationSchoolName)
      : instructor.educationSchoolName
    : ''
  const educationDisplay =
    [instructor.educationLevel, schoolPart].filter(Boolean).join(' | ') || '-'
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

  return (
    <section className="applicant-instructor-basic-info">
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
      <div className="applicant-instructor-basic-info__title">기본 정보</div>
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
                <ProgramApprovalStatusValue instructor={instructor} />
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
                {instructor.address ? (
                  <AddressDisplay address={instructor.address} mask={mask} />
                ) : (
                  '-'
                )}
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
