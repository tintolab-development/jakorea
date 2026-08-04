import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  formatAccountDisplayContent,
  HomeAddressDisplay,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/instructor-basic-info-detail-form'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { SchoolTeacherEmploymentStatusBadge } from '@/features/user/detail/lib/school-teacher-employment-status'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import type {
  GeminiApprovedTrainingDetail,
  GeminiApprovedTrainingEmploymentStatus,
} from '../../model/approved/detail-types'
import type { VerticalInfoTableItem } from './vertical-info-table'

function mapEmploymentStatus(
  status: GeminiApprovedTrainingEmploymentStatus
): SchoolTeacherEmploymentStatus {
  if (status === 'LEAVE') return 'ON_LEAVE'
  if (status === 'TRANSFER') return 'TRANSFERRED'
  return 'ACTIVE'
}

export function buildGeminiApprovedManagerTableItems(
  detail: GeminiApprovedTrainingDetail,
  personalInfoRevealed: boolean
): VerticalInfoTableItem[] {
  const mask = !personalInfoRevealed
  const contact = detail.managerContact.trim()
  const email = detail.managerEmail.trim()
  const employmentStatus = mapEmploymentStatus(detail.managerEmploymentStatus)

  const nameCell =
    detail.managerScheduleChangeCount > 0 ? (
      <span className="gemini-approved-training-detail-info__manager-name-with-badge">
        {detail.managerNameKo}
        <ScheduleChangeHistoryBadge count={detail.managerScheduleChangeCount} />
      </span>
    ) : (
      detail.managerNameKo
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
          {withProgramDetailTdDivider([detail.managerGender, detail.managerBirthDate])}
        </ProgramDetailTdSegmentWrap>
      ),
    },
    {
      key: 'contact',
      label: '연락처',
      children: contact ? (mask ? MASKING_POLICY.phone(contact) : contact) : '-',
    },
    {
      key: 'email',
      label: '이메일',
      children: email ? (mask ? MASKING_POLICY.email(email) : email) : '-',
    },
    {
      key: 'affiliation',
      label: '소속',
      children: (
        <span className="gemini-approved-training-detail-info__affiliation-with-badge">
          {detail.managerSchool}
          <SchoolTeacherEmploymentStatusBadge status={employmentStatus} />
        </span>
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
            mask
          )}
        </ProgramDetailTdSegmentWrap>
      ),
    },
    {
      key: 'position',
      label: '직급',
      children: detail.managerPosition,
    },
    {
      key: 'subject',
      label: '과목',
      children: detail.managerSubject,
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
