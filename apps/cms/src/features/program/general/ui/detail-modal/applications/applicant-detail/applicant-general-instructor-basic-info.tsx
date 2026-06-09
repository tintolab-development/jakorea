/**
 * 일반 프로그램 — 강사 유형 신청 상세 (신청 정보 탭)
 * 스크린샷 시안: 기본 정보 + ApplicantInstructorResume(학력/경력/Q&A)
 */

import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { ApplicantAdminCommentSection } from './applicant-admin-comment-section'
import { ProgramApprovalStatusDetailValue } from './program-approval-status-detail-value'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { StatusDropdownCell } from '@/shared/components'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import {
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE,
  SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS,
  SchoolTeacherEmploymentStatusBadge,
} from '@/features/user/detail/lib/school-teacher-employment-status'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import type { ApplicantInstructorEditDraft } from '@/features/program/general/lib/applicant-instructor-detail-edit'
import {
  BusinessIncomeEditField,
  BusinessIncomeView,
  InstructorFeeGradeEditField,
  InstructorFeeGradeView,
  LectureFeeBasisEditField,
  LectureFeeBasisView,
} from './applicant-general-instructor-fee-fields'
import './applicant-general-instructor-basic-info.css'

const AFFILIATION_EMPLOYMENT_BADGE_CELL_STYLE = {
  ...SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE,
  maxWidth: 200,
} as const

function resolveAffiliationEmploymentStatus(
  instructor: ApplicantInstructorRow
): SchoolTeacherEmploymentStatus | null {
  if (!instructor.affiliation?.trim()) return null
  if (instructor.affiliationEmploymentStatus) {
    return instructor.affiliationEmploymentStatus
  }
  if (instructor.affiliationIsCurrentlyEmployed) return 'ACTIVE'
  return null
}

function AffiliationEmploymentStatusField({
  instructorId,
  instructor,
}: {
  instructorId: string
  instructor: ApplicantInstructorRow
}) {
  const [employmentStatus, setEmploymentStatus] = useState<SchoolTeacherEmploymentStatus | null>(() =>
    resolveAffiliationEmploymentStatus(instructor)
  )
  const [employmentDropdownOpen, setEmploymentDropdownOpen] = useState(false)

  useEffect(() => {
    setEmploymentStatus(resolveAffiliationEmploymentStatus(instructor))
  }, [instructorId, instructor.affiliationEmploymentStatus, instructor.affiliationIsCurrentlyEmployed, instructor.affiliation])

  const handleEmploymentStatusChange = useCallback((next: SchoolTeacherEmploymentStatus) => {
    setEmploymentStatus(next)
    setEmploymentDropdownOpen(false)
  }, [])

  if (employmentStatus == null) {
    return null
  }

  return (
    <span className="applicant-general-instructor-basic-info__employment-dropdown">
      <StatusDropdownCell<SchoolTeacherEmploymentStatus>
        status={employmentStatus}
        statusOptions={SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS}
        renderBadge={status => <SchoolTeacherEmploymentStatusBadge status={status} />}
        isItemDisabled={(cur, opt) => cur === opt}
        onChange={handleEmploymentStatusChange}
        isOpen={employmentDropdownOpen}
        onOpenChange={setEmploymentDropdownOpen}
        style={AFFILIATION_EMPLOYMENT_BADGE_CELL_STYLE}
      />
    </span>
  )
}

export interface ApplicantGeneralInstructorBasicInfoProps {
  instructor: ApplicantInstructorRow
  maskSensitive?: boolean
  mode?: 'view' | 'edit'
  draft?: ApplicantInstructorEditDraft
  onDraftChange?: (partial: Partial<ApplicantInstructorEditDraft>) => void
  validationErrors?: Record<string, string>
  onResendNotificationClick?: () => void
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

function splitAddressForPrivacyBlur(address: string): { head: string; tail: string } | null {
  return splitAddressAfterDong(address) ?? splitAddressAfterGu(address)
}

function HomeAddressDisplay({ address, mask }: { address: string | undefined; mask: boolean }) {
  if (!address?.trim()) return <>-</>
  if (!mask) return <>{address}</>

  const split = splitAddressForPrivacyBlur(address)
  if (!split) {
    return (
      <span className="applicant-general-instructor-basic-info__address-blur" aria-hidden="true">
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
      <span className="applicant-general-instructor-basic-info__address-blur" aria-hidden="true">
        {tail}
      </span>
    </>
  )
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

function ProgramApprovalStatusValue({
  instructor,
  onResendNotificationClick,
}: {
  instructor: ApplicantInstructorRow
  onResendNotificationClick?: () => void
}) {
  return (
    <ProgramApprovalStatusDetailValue
      status={instructor.approvalStatus}
      participationRejectionReason={instructor.rejectionReason}
      approvalNotificationSentAt={instructor.approvalNotificationSentAt}
      onResendNotificationClick={onResendNotificationClick}
    />
  )
}

export function ApplicantGeneralInstructorBasicInfo({
  instructor,
  maskSensitive = true,
  mode = 'view',
  draft,
  onDraftChange,
  validationErrors,
  onResendNotificationClick,
}: ApplicantGeneralInstructorBasicInfoProps) {
  const shouldMask = maskSensitive && instructor.approvalStatus !== 'approved'
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  const showAdminComment = instructor.approvalStatus === 'approved'
  const showPostApprovalFields = instructor.approvalStatus === 'approved'

  const scheduleChangeCount = instructor.scheduleChangeCancelCount ?? 0
  const nameCell =
    scheduleChangeCount > 0 ? (
      <>
        {instructor.instructorName}
        <ScheduleChangeHistoryBadge
          count={scheduleChangeCount}
          className="applicant-general-instructor-basic-info__name-badge"
        />
      </>
    ) : (
      instructor.instructorName
    )

  const genderBirthDisplay = withProgramDetailTdDivider([
    instructor.gender ?? '-',
    formatBirthDateAndAge(instructor.birthDate, instructor.age),
  ])

  const affiliationEmploymentBadge =
    resolveAffiliationEmploymentStatus(instructor) != null ? (
      <AffiliationEmploymentStatusField instructorId={instructor.id} instructor={instructor} />
    ) : null

  const affiliationCell = instructor.affiliation?.trim() ? (
    <ProgramDetailTdSegmentWrap>
      {affiliationEmploymentBadge
        ? withProgramDetailTdDivider([instructor.affiliation, affiliationEmploymentBadge])
        : instructor.affiliation}
    </ProgramDetailTdSegmentWrap>
  ) : (
    '-'
  )

  const lectureExperienceDisplay =
    instructor.lectureExperienceYears != null ? `${instructor.lectureExperienceYears}년` : '-'

  const contactDisplay = instructor.contact
    ? shouldMask
      ? MASKING_POLICY.phone(instructor.contact.replace(/\s/g, '')) || instructor.contact
      : instructor.contact
    : '-'

  const emailDisplay = instructor.email
    ? shouldMask
      ? MASKING_POLICY.email(instructor.email)
      : instructor.email
    : '-'

  const homeAddressDisplay = (
    <HomeAddressDisplay address={instructor.address} mask={shouldMask} />
  )

  const accountDisplay = formatAccountDisplayContent(instructor, shouldMask)

  const evaluationGradeDisplay = instructor.evaluationGrade
    ? `${instructor.evaluationGrade}등급`
    : '-'

  const instructorFeeGradeCell =
    isEditMode && draft && onDraftChange ? (
      <InstructorFeeGradeEditField
        draft={draft}
        onDraftChange={onDraftChange}
        validationError={validationErrors?.instructorFeeGrade}
      />
    ) : (
      <InstructorFeeGradeView instructor={instructor} />
    )

  const businessIncomeCell =
    isEditMode && draft && onDraftChange ? (
      <BusinessIncomeEditField draft={draft} onDraftChange={onDraftChange} />
    ) : (
      <BusinessIncomeView instructor={instructor} />
    )

  const lectureFeeBasisCell =
    isEditMode && draft && onDraftChange ? (
      <LectureFeeBasisEditField
        draft={draft}
        onDraftChange={onDraftChange}
        validationError={validationErrors?.lectureFeeAmount}
      />
    ) : (
      <LectureFeeBasisView instructor={instructor} />
    )

  const colgroup = (
    <colgroup>
      <col style={{ width: '200px' }} />
      <col />
      <col style={{ width: '200px' }} />
      <col />
    </colgroup>
  )

  return (
    <div className="applicant-general-instructor-basic-info applicant-institution-basic-info">
      {validationErrors?.form ? (
        <div className="applicant-general-instructor-basic-info__form-error">{validationErrors.form}</div>
      ) : null}
      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={isEditMode && draft ? draft.adminComment : instructor.managerComment}
          mode={isEditMode ? 'edit' : 'view'}
          draftValue={draft?.adminComment ?? ''}
          onDraftChange={
            isEditMode && onDraftChange
              ? value => onDraftChange({ adminComment: value })
              : undefined
          }
          validationError={validationErrors?.adminComment}
        />
      ) : null}
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">기본 정보</h3>
        <div className="applicant-institution-basic-info__basic-info-fields">
          <div className="applicant-general-instructor-basic-info__approval-block">
            <div className="applicant-institution-basic-info__table-wrap">
              <table className="applicant-institution-basic-info__table">
                {colgroup}
                <tbody>
                  <TableRowTwoCols
                    label1="프로그램 승인 현황"
                    value1={<ProgramApprovalStatusValue instructor={instructor} onResendNotificationClick={onResendNotificationClick} />}
                    label2="JA 평가 등급"
                    value2={evaluationGradeDisplay}
                  />
                </tbody>
              </table>
            </div>
            {showPostApprovalFields ? (
              <div className="applicant-institution-basic-info__table-wrap applicant-general-instructor-basic-info__post-approval-wrap">
                <table className="applicant-institution-basic-info__table applicant-general-instructor-basic-info__post-approval-table">
                  {colgroup}
                  <tbody>
                    <TableRowFullWidth label="강의비 책정 기준" value={lectureFeeBasisCell} />
                  </tbody>
                </table>
              </div>
            ) : null}
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
                  label1="소속"
                  value1={affiliationCell}
                  label2="강사 경력"
                  value2={lectureExperienceDisplay}
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
                  label2="정산 계좌 정보"
                  value2={<ProgramDetailTdSegmentWrap>{accountDisplay}</ProgramDetailTdSegmentWrap>}
                />
                <TableRowTwoCols
                  label1="강사비 등급"
                  value1={instructorFeeGradeCell}
                  label2="사업소득자 여부"
                  value2={businessIncomeCell}
                />
                <TableRowFullWidth
                  label="한 줄 소개"
                  value={instructor.oneLineIntro?.trim() || '-'}
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
