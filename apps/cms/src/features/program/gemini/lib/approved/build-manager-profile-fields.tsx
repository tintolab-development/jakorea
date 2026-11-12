import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import {
  formatAccountDisplayContent,
  HomeAddressDisplay,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/instructor-basic-info-detail-form'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { SchoolTeacherEmploymentStatusBadge } from '@/features/user/detail/lib/school-teacher-employment-status'
import { formatBirthDisplayWithManAge } from '@/features/user/api/format-gender-birth-display'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import { mapGeminiApprovedEmploymentToSchoolStatus } from './employment-status'
import type { VerticalInfoTableItem } from './vertical-info-table'

function displayOptionalText(value: string): string {
  return value.trim() ? value : '-'
}

/**
 * 담당 교사 생년월일 — 상세 GET `yyyy-**-**`는 정책 표기 `yyyy.**.**`, 원문 조회 `yyyy-MM-dd`는
 * `yyyy. MM. dd (만 N세)`. 응답에 나이 필드가 없어 마스킹 표시에는 나이를 붙이지 않는다(날짜를 지어내지 않음).
 */
export function formatGeminiManagerBirthDisplay(birthDate: string): string {
  const trimmed = birthDate.trim()
  if (!trimmed) return ''
  const formatted = formatBirthDisplayWithManAge(trimmed)
  // 연도를 읽을 수 없는 값(전부 `*` 등)은 날짜를 만들지 않고 서버 값을 그대로 둔다.
  return formatted === '-' ? trimmed : formatted
}

export function buildGeminiApprovedManagerTableItems(
  detail: GeminiApprovedTrainingDetail,
  personalInfoRevealed = false,
  employmentStatusControl?: ReactNode
): VerticalInfoTableItem[] {
  const mask = !personalInfoRevealed
  const contact = detail.managerContact.trim()
  const email = detail.managerEmail.trim()
  const employmentStatus =
    detail.managerEmploymentStatus != null
      ? mapGeminiApprovedEmploymentToSchoolStatus(detail.managerEmploymentStatus)
      : null

  const nameCell = (
    <span className="gemini-approved-training-detail-info__manager-name-with-badge">
      {detail.managerNameKo}
      <ScheduleChangeHistoryBadge count={detail.managerScheduleChangeCount} />
    </span>
  )

  return [
    {
      key: 'name',
      label: '성명',
      children: nameCell,
    },
    {
      key: 'genderBirth',
      label: '성별 및 생년월일',
      children: (
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([
            detail.managerGender,
            formatGeminiManagerBirthDisplay(detail.managerBirthDate),
          ])}
        </ProgramDetailTdSegmentWrap>
      ),
    },
    {
      key: 'contact',
      label: '연락처',
      children: displayServerPiiAsIs(contact),
    },
    {
      key: 'email',
      label: '이메일',
      children: displayServerPiiAsIs(email),
    },
    {
      key: 'affiliation',
      label: '소속',
      children: (
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([
            detail.managerSchool,
            employmentStatusControl ??
              (employmentStatus != null ? (
                <SchoolTeacherEmploymentStatusBadge status={employmentStatus} />
              ) : null),
          ])}
        </ProgramDetailTdSegmentWrap>
      ),
    },
    {
      key: 'lectureExperience',
      label: '강사 경력',
      children: detail.managerLectureExperience || '-',
    },
    {
      key: 'homeAddress',
      label: '자택 주소지',
      children: <HomeAddressDisplay address={detail.managerHomeAddress} mask={mask} />,
    },
    {
      key: 'account',
      label: '정산 계좌 정보',
      children: (
        <ProgramDetailTdSegmentWrap>
          {formatAccountDisplayContent(
            {
              bankName: detail.managerAccountBank,
              accountNumber: detail.managerAccountNumber,
              accountHolder: detail.managerAccountHolder,
            },
            false
          )}
        </ProgramDetailTdSegmentWrap>
      ),
    },
    {
      key: 'position',
      label: '직급',
      children: displayOptionalText(detail.managerPosition),
    },
    {
      key: 'subject',
      label: '과목',
      children: displayOptionalText(detail.managerSubject),
    },
    {
      key: 'instructorFeeGrade',
      label: '강사비 등급',
      children: detail.managerInstructorFeeGrade || '-',
    },
    {
      key: 'businessIncome',
      label: '사업소득자 여부',
      children: detail.managerBusinessIncomeLabel || '-',
    },
    {
      key: 'oneLineIntro',
      label: '한 줄 소개',
      span: 2,
      children: detail.managerOneLineIntro || '-',
    },
  ]
}
