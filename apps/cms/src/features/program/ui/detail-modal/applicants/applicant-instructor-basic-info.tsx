/**
 * 신청 강사 상세 - 기본 정보 테이블
 * 학력사항 위에 배치, 이미지 시안과 동일한 4열 그리드(성명 한글/영문, 프로그램 승인 현황, 성별 및 생년월일 등)
 */

import { type ReactNode } from 'react'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { SendNotiButton } from '@/features/program/ui/detail-modal/components/send-noti-button'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/ui/program-detail-td-divider'
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
        <SendNotiButton mode="resend" />
        {instructor.approvalNotificationSentAt ? (
          <>
            <span className="applicant-instructor-basic-info__approval-status-vbar" aria-hidden />
            <span className="applicant-instructor-basic-info__approval-notification-sent-at">
              {instructor.approvalNotificationSentAt}
            </span>
          </>
        ) : null}
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

function formatAccountDisplayContent(instructor: ApplicantInstructorRow, mask: boolean): ReactNode {
  const bank = instructor.bankName ?? ''
  const num = instructor.accountNumber ?? ''
  const holder = instructor.accountHolder ?? ''
  if (!bank && !num && !holder) return '-'
  if (mask) {
    const maskedNum = num ? MASKING_POLICY.accountNumber(num) : ''
    const maskedHolder = holder ? MASKING_POLICY.accountHolderName(holder) : ''
    const left = [bank, maskedNum].filter(Boolean).join(' ')
    if (!maskedHolder) return left || '-'
    if (!left) return maskedHolder
    return withProgramDetailTdDivider([left, maskedHolder])
  }
  const left = [bank, num].filter(Boolean).join(' ')
  if (!holder) return left || '-'
  if (!left) return holder
  return withProgramDetailTdDivider([left, holder])
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

/** 동 미매칭 시: 행정구(OO구)까지 노출, 그 이후 블러 */
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

function splitAddressForPrivacyBlur(address: string): { head: string; tail: string } | null {
  return splitAddressAfterDong(address) ?? splitAddressAfterGu(address)
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
  const split = splitAddressForPrivacyBlur(address)
  if (!split) {
    return (
      <span className="applicant-instructor-basic-info__address-blur" aria-hidden="true">
        {address}
      </span>
    )
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
  /** 승인 상태 행(프로그램 승인 현황) 표시 여부 */
  showApprovalStatus?: boolean
  /** 한 줄 소개 행 표시 여부 */
  showOneLineIntro?: boolean
  /** 승인 완료 하단 테이블(강의비/사업소득자) 표시 여부. 미지정 시 승인 완료일 때만 표시 */
  showPostApprovalFields?: boolean
  /** 회원 관리 강사 상세 등: 기본 정보 테이블 맨 아래 가입일·연동 소셜 행 */
  memberBasicInfoFooter?: {
    joinDate: string
    linkedSocial: string
  }
  /**
   * 승인 완료 등으로 신청 맥락 마스킹이 꺼져 있어도 주소만 읍·면·동 이후 블러 처리
   * (개인정보 미공개 시 회원 상세 강사 탭)
   */
  privacyMaskAddress?: boolean
}

export function ApplicantInstructorBasicInfo({
  instructor,
  maskSensitive = true,
  showApprovalStatus = true,
  showOneLineIntro = true,
  showPostApprovalFields,
  memberBasicInfoFooter,
  privacyMaskAddress = false,
}: ApplicantInstructorBasicInfoProps) {
  const managerComment = instructor.managerComment
  const showManagerComment = instructor.approvalStatus === 'approved' && !!managerComment
  const mask = maskSensitive && instructor.approvalStatus !== 'approved'
  const addressMask = mask || privacyMaskAddress
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
  const accountDisplay = formatAccountDisplayContent(instructor, mask)
  const birthDisplay = formatBirthDateAndAge(instructor.birthDate, instructor.age)
  const genderBirthDisplay = withProgramDetailTdDivider(
    [instructor.gender, birthDisplay].filter(Boolean) as string[]
  )
  const schoolPart = instructor.educationSchoolName
    ? mask
      ? maskEducationSchoolName(instructor.educationSchoolName)
      : instructor.educationSchoolName
    : ''
  const educationDisplay = withProgramDetailTdDivider(
    [instructor.educationLevel, schoolPart].filter(Boolean) as string[]
  )
  const affiliationDisplay = withProgramDetailTdDivider(
    [
      instructor.affiliation ?? '',
      instructor.lectureExperienceYears != null ? `${instructor.lectureExperienceYears}년` : '',
      instructor.evaluationGrade ? `${instructor.evaluationGrade}등급` : '',
    ].filter(Boolean) as string[]
  )

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

  const shouldShowPostApprovalFields = showPostApprovalFields ?? instructor.approvalStatus === 'approved'

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
              {showApprovalStatus ? (
                <>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    프로그램 승인 현황
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    <ProgramApprovalStatusValue instructor={instructor} />
                  </td>
                </>
              ) : (
                <>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    정산 현황
                  </td>
                  <td
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value applicant-instructor-basic-info__cell--settlement-status"
                  >
                    {instructor.settlementStatusLabel?.trim() || '-'}
                  </td>
                </>
              )}
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
                자택 주소
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                {instructor.address ? (
                  <AddressDisplay address={instructor.address} mask={addressMask} />
                ) : (
                  '-'
                )}
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                정산 계좌 정보
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                <ProgramDetailTdSegmentWrap>{accountDisplay}</ProgramDetailTdSegmentWrap>
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
                <ProgramDetailTdSegmentWrap>{educationDisplay}</ProgramDetailTdSegmentWrap>
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                소속 및 강사 경력
              </td>
              <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                <ProgramDetailTdSegmentWrap>{affiliationDisplay}</ProgramDetailTdSegmentWrap>
              </td>
            </tr>
            {showOneLineIntro ? (
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
            ) : null}
            {memberBasicInfoFooter ? (
              <tr>
                <td
                  colSpan={2}
                  className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                >
                  가입일
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {memberBasicInfoFooter.joinDate}
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                  연동된 소셜 계정
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {memberBasicInfoFooter.linkedSocial}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {shouldShowPostApprovalFields ? (
        <div className="applicant-instructor-basic-info__table-wrap applicant-instructor-basic-info__post-approval-wrap">
          <table
            className="applicant-instructor-basic-info__table applicant-instructor-basic-info__table--post-approval"
          >
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                  강의비 책정 기준
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {instructor.lectureFeeBasisDisplay ?? '-'}
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                  사업소득자 여부
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {instructor.businessIncomeEarnerStatus ?? '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
