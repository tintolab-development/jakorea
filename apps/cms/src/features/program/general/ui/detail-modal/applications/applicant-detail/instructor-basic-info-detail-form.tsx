/**
 * 일반 프로그램 — 강사 기본 정보 격자 (DetailInfoForm)
 * 강사 신청 상세·참여 강사 신청 정보 탭 공통 프로필 블록
 */

import { formatBirthWithOptionalAge } from '@/features/user/api/format-gender-birth-display'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'
import { useCmsAlert } from '@/shared/ui'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { updateTeacherEmploymentStatusRemote } from '@/features/user/api/members-api-client'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { StatusDropdownCell } from '@/shared/components'
import { getEmploymentStatusTag } from '@/shared/lib/status-tag-specs'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import { SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS } from '@/features/user/detail/lib/school-teacher-employment-status'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { HomeAddressDisplay } from '@/features/program/shared/lib/program-pii-display'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'

export { HomeAddressDisplay }

export function formatBirthDateAndAge(birthDate?: string, age?: number): string {
  return formatBirthWithOptionalAge(birthDate, age)
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

/**
 * 강사 신청 상세 GET `settlement` 표시.
 * 서버 마스킹 수준(일반 GET=마스킹, 원문 조회=원문) 그대로 렌더링하며 FE 재마스킹·placeholder 생성을 하지 않는다.
 */
export function formatServerAccountDisplayContent(fields: AccountDisplayFields): ReactNode {
  const left = [fields.bankName, fields.accountNumber].filter(Boolean).join(' ')
  const holder = fields.accountHolder
  if (!left && !holder) return null
  if (!holder) return left
  if (!left) return holder
  return withProgramDetailTdDivider([left, holder])
}

export function AffiliationEmploymentStatusField({
  instructorId,
  affiliation,
  employmentStatus: initialEmploymentStatus,
  affiliationOrganizationId,
  instructorMemberId,
  persistRemote = false,
  onEmploymentStatusSaved,
}: {
  instructorId: string
  affiliation?: string
  employmentStatus: SchoolTeacherEmploymentStatus | null
  affiliationOrganizationId?: number | null
  instructorMemberId?: number
  persistRemote?: boolean
  onEmploymentStatusSaved?: (status: SchoolTeacherEmploymentStatus) => void
}) {
  const { showAlert } = useCmsAlert()
  const [employmentStatus, setEmploymentStatus] = useState<SchoolTeacherEmploymentStatus | null>(
    () => initialEmploymentStatus
  )
  const [employmentDropdownOpen, setEmploymentDropdownOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEmploymentStatus(initialEmploymentStatus)
  }, [instructorId, affiliation, initialEmploymentStatus])

  const handleEmploymentStatusChange = useCallback(
    async (next: SchoolTeacherEmploymentStatus) => {
      if (!persistRemote) {
        setEmploymentStatus(next)
        setEmploymentDropdownOpen(false)
        return
      }

      const organizationId =
        affiliationOrganizationId != null && Number.isFinite(affiliationOrganizationId)
          ? affiliationOrganizationId
          : null
      const teacherMemberId =
        instructorMemberId != null && Number.isFinite(instructorMemberId)
          ? instructorMemberId
          : null

      if (!isMembersRemoteEnabled() || organizationId == null || teacherMemberId == null) {
        notifyProgramApiUnavailable(
          'general-instructor-affiliation-employment',
          '일반 프로그램 · 강사 소속 재직 현황'
        )
        setEmploymentDropdownOpen(false)
        return
      }

      setSaving(true)
      try {
        await updateTeacherEmploymentStatusRemote(organizationId, teacherMemberId, next)
        setEmploymentStatus(next)
        onEmploymentStatusSaved?.(next)
      } catch (error) {
        void showAlert({
          title: '재직 현황 저장 실패',
          content: extractApiErrorMessage(error) || '재직 현황을 저장하지 못했습니다.',
        })
      } finally {
        setSaving(false)
        setEmploymentDropdownOpen(false)
      }
    },
    [
      affiliationOrganizationId,
      instructorMemberId,
      onEmploymentStatusSaved,
      persistRemote,
      showAlert,
    ]
  )

  if (employmentStatus == null) {
    return null
  }

  return (
    <span className="applicant-general-instructor-basic-info__employment-dropdown">
      <StatusDropdownCell<SchoolTeacherEmploymentStatus>
        status={employmentStatus}
        statusOptions={SCHOOL_TEACHER_EMPLOYMENT_STATUS_DROPDOWN_OPTIONS}
        getTag={getEmploymentStatusTag}
        isItemDisabled={(cur, opt) => cur === opt}
        onChange={handleEmploymentStatusChange}
        isUpdating={saving}
        isOpen={employmentDropdownOpen}
        onOpenChange={setEmploymentDropdownOpen}
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

export function InstructorBasicInfoProfileGrid({
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
        <DetailInfoForm.Field label="연락처" view={profile.contactDisplay} readOnlyDisplay />
        <DetailInfoForm.Field label="이메일" view={profile.emailDisplay} readOnlyDisplay />
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
