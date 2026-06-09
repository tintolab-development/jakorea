/**
 * 일반 프로그램 — 강사 기본 정보 격자 (DetailInfoForm)
 * 강사 신청 상세·참여 강사 신청 정보 탭 공통 프로필 블록
 */

import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { StatusDropdownCell } from '@/shared/components'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import {
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE,
  SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS,
  SchoolTeacherEmploymentStatusBadge,
} from '@/features/user/detail/lib/school-teacher-employment-status'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'

const AFFILIATION_EMPLOYMENT_BADGE_CELL_STYLE = {
  ...SCHOOL_TEACHER_EMPLOYMENT_BADGE_CELL_STYLE,
  maxWidth: 200,
} as const

export function formatBirthDateAndAge(birthDate?: string, age?: number): string {
  if (!birthDate && age == null) return '-'
  const formatted = birthDate ? birthDate.split('.').join('. ') : ''
  if (formatted && age != null) return `${formatted} (만 ${age}세)`
  if (formatted) return formatted
  if (age != null) return `만 ${age}세`
  return '-'
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

export function HomeAddressDisplay({ address, mask }: { address: string | undefined; mask: boolean }) {
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

export type AccountDisplayFields = {
  bankName?: string
  accountNumber?: string
  accountHolder?: string
}

export function formatAccountDisplayContent(fields: AccountDisplayFields, mask: boolean): ReactNode {
  const bank = fields.bankName ?? ''
  const num = fields.accountNumber ?? ''
  const holder = fields.accountHolder ?? ''
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

export function AffiliationEmploymentStatusField({
  instructorId,
  affiliation,
  employmentStatus: initialEmploymentStatus,
}: {
  instructorId: string
  affiliation?: string
  employmentStatus: SchoolTeacherEmploymentStatus | null
}) {
  const [employmentStatus, setEmploymentStatus] = useState<SchoolTeacherEmploymentStatus | null>(
    () => initialEmploymentStatus
  )
  const [employmentDropdownOpen, setEmploymentDropdownOpen] = useState(false)

  useEffect(() => {
    setEmploymentStatus(initialEmploymentStatus)
  }, [instructorId, affiliation, initialEmploymentStatus])

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

export interface InstructorBasicInfoProfileFields {
  nameCell: ReactNode
  genderBirthDisplay: ReactNode
  affiliationCell: ReactNode
  lectureExperienceDisplay: ReactNode
  contactDisplay: ReactNode
  emailDisplay: ReactNode
  homeAddressDisplay: ReactNode
  accountDisplay: ReactNode
  instructorFeeGradeView: ReactNode
  instructorFeeGradeEdit?: ReactNode
  businessIncomeView: ReactNode
  businessIncomeEdit?: ReactNode
  oneLineIntro: ReactNode
}

export interface InstructorBasicInfoDetailFormProps {
  mode?: 'view' | 'edit'
  className?: string
  /** 프로그램 승인·진행 현황 등 상단 상태 격자 */
  statusRows: ReactNode
  profile: InstructorBasicInfoProfileFields
}

function InstructorBasicInfoProfileGrid({
  profile,
}: {
  profile: InstructorBasicInfoProfileFields
}) {
  return (
    <>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="성명" view={profile.nameCell} readOnlyDisplay />
        <DetailInfoForm.Field
          label="성별 및 생년월일"
          view={<ProgramDetailTdSegmentWrap>{profile.genderBirthDisplay}</ProgramDetailTdSegmentWrap>}
          readOnlyDisplay
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="소속" view={profile.affiliationCell} readOnlyDisplay />
        <DetailInfoForm.Field
          label="강사 경력"
          view={profile.lectureExperienceDisplay}
          readOnlyDisplay
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="연락처" view={profile.contactDisplay} readOnlyDisplay />
        <DetailInfoForm.Field label="이메일" view={profile.emailDisplay} readOnlyDisplay />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="자택 주소지" view={profile.homeAddressDisplay} readOnlyDisplay />
        <DetailInfoForm.Field
          label="정산 계좌 정보"
          view={<ProgramDetailTdSegmentWrap>{profile.accountDisplay}</ProgramDetailTdSegmentWrap>}
          readOnlyDisplay
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="강사비 등급"
          view={profile.instructorFeeGradeView}
          edit={profile.instructorFeeGradeEdit}
        />
        <DetailInfoForm.Field
          label="사업소득자 여부"
          view={profile.businessIncomeView}
          edit={profile.businessIncomeEdit}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="한 줄 소개"
          fullRow
          view={profile.oneLineIntro}
          readOnlyDisplay
        />
      </DetailInfoForm.Row>
    </>
  )
}

export function InstructorBasicInfoDetailForm({
  mode = 'view',
  className,
  statusRows,
  profile,
}: InstructorBasicInfoDetailFormProps) {
  const rootClass = ['applicant-instructor-basic-info', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <DetailInfoForm title="기본 정보" mode={mode}>
        {statusRows}
      </DetailInfoForm>
      <DetailInfoForm title="기본 정보" hideHeader mode={mode}>
        <InstructorBasicInfoProfileGrid profile={profile} />
      </DetailInfoForm>
    </div>
  )
}
