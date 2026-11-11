import { mask1365IdForDisplay } from '@/features/user/api/map-external-identifiers'
import type { ReactNode } from 'react'
import type { Program } from '@/types/domain'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { formatUjatVolunteerApplicationType } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import {
  formatUjatVolunteerApplicationRoute,
  formatUjatVolunteerBirthDateAndAge,
  formatUjatVolunteerUniversityDisplay,
  type UjatVolunteerPreferredRegion,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { UjatProgramListProgressCell } from '@/features/program/ujat/ui/list/ujat-program-list-progress-cell'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './detail.css'

function toTableRows(
  items: Array<{ key: string; label: string; children: ReactNode; span?: number }>
) {
  const rows: ReactNode[] = []
  let i = 0
  while (i < items.length) {
    const item = items[i]
    if (item.span === 2) {
      rows.push(
        <tr key={item.key}>
          <th>{item.label}</th>
          <td colSpan={3}>{item.children}</td>
        </tr>
      )
      i += 1
      continue
    }

    const next = items[i + 1]
    if (next && next.span !== 2) {
      rows.push(
        <tr key={item.key}>
          <th>{item.label}</th>
          <td>{item.children}</td>
          <th>{next.label}</th>
          <td>{next.children}</td>
        </tr>
      )
      i += 2
      continue
    }

    rows.push(
      <tr key={item.key}>
        <th>{item.label}</th>
        <td colSpan={3}>{item.children}</td>
      </tr>
    )
    i += 1
  }
  return rows
}

/** 1365 ID: 정책 §4-1 뒤 2자리 마스킹(공통 mask1365IdForDisplay). 이미 마스킹된 값은 그대로. */
function maskId1365(id: string): string {
  if (!id || id === '—' || id === '-') return id || '-'
  return mask1365IdForDisplay(id)
}

function displayOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

export function UjatEducationProgressVolunteerDetailBasicInfo({
  program,
  applicant,
  maskSensitive,
  isEditing = false,
  preferredRegionDraft,
  onPreferredRegionDraftChange,
}: {
  program: Program
  applicant: UjatVolunteerApplicantRow
  maskSensitive: boolean
  isEditing?: boolean
  preferredRegionDraft?: UjatVolunteerPreferredRegion
  onPreferredRegionDraftChange?: (next: UjatVolunteerPreferredRegion) => void
}) {
  const { regions } = useUjatEducationRegions()
  const preferredRegionSelectOptions = regions.map(region => ({
    label: region.label,
    value: region.key,
  }))

  const contactDisplay = maskSensitive ? applicant.contact : applicant.contactRaw
  const emailDisplay = maskSensitive ? applicant.email : applicant.emailRaw
  const id1365Display = maskSensitive ? maskId1365(applicant.id1365) : applicant.id1365
  const universityDisplay = formatUjatVolunteerUniversityDisplay(
    applicant.universityName,
    maskSensitive
  )
  const universityGradeDisplay = withProgramDetailTdDivider([universityDisplay, applicant.grade])
  const genderBirthDisplay = withProgramDetailTdDivider([
    applicant.gender,
    formatUjatVolunteerBirthDateAndAge(applicant.birthDate, applicant.age),
  ])
  const hasAffiliation =
    Boolean(applicant.affiliationSchool.trim()) || Boolean(applicant.affiliationGrade.trim())
  const affiliationDisplay = hasAffiliation
    ? withProgramDetailTdDivider([applicant.affiliationSchool, applicant.affiliationGrade])
    : '-'
  const applicationRouteDisplay = formatUjatVolunteerApplicationRoute(
    applicant.applicationRoute,
    applicant.applicationRouteOther
  )

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

  /** Figma 4082:109120 — 참여 봉사자 상세 · 신청 정보 필드 순서 */
  const basicInfoItems = [
    {
      key: 'programProgress',
      label: '프로그램 진행 현황',
      children: <UjatProgramListProgressCell program={program} />,
      span: 2 as const,
    },
    { key: 'name', label: '성명', children: nameCell },
    {
      key: 'genderBirth',
      label: '성별 및 생년월일',
      children: <ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>,
    },
    {
      key: 'schoolEnrollment',
      label: '학교 재학 여부',
      children: displayOrDash(applicant.schoolEnrollmentStatus),
    },
    {
      key: 'affiliation',
      label: '소속',
      children: <ProgramDetailTdSegmentWrap>{affiliationDisplay}</ProgramDetailTdSegmentWrap>,
    },
    { key: 'contact', label: '연락처', children: displayOrDash(contactDisplay) },
    { key: 'email', label: '이메일', children: displayOrDash(emailDisplay) },
    {
      key: 'homeAddress',
      label: '자택 주소지',
      children: displayOrDash(applicant.homeAddress),
    },
    { key: 'id1365', label: '1365 ID', children: displayOrDash(id1365Display) },
    {
      key: 'educationExperience',
      label: '교육 진행 경험 여부',
      children:
        applicant.hasEducationExperience == null
          ? '-'
          : applicant.hasEducationExperience
            ? '있음'
            : '없음',
    },
    {
      key: 'preferredRegion',
      label: '희망 교육 활동 지역',
      children: isEditing ? (
        <CmsSelect
          className="ujat-education-progress-volunteer-detail__preferred-region-select"
          inputSize="medium"
          width={240}
          withAllOption={false}
          placeholder="지역 선택"
          value={preferredRegionDraft ?? applicant.preferredRegionCode ?? ''}
          onChange={value =>
            onPreferredRegionDraftChange?.(String(value) as UjatVolunteerPreferredRegion)
          }
          options={preferredRegionSelectOptions}
          aria-label="희망 교육 활동 지역"
        />
      ) : (
        displayOrDash(applicant.preferredRegion)
      ),
    },
    {
      key: 'universityGrade',
      label: '대학교 및 학년',
      children: <ProgramDetailTdSegmentWrap>{universityGradeDisplay}</ProgramDetailTdSegmentWrap>,
    },
    { key: 'major', label: '대학 전공', children: displayOrDash(applicant.major) },
    {
      key: 'applicationType',
      label: '지원 형태',
      children: formatUjatVolunteerApplicationType(applicant.applicationType),
    },
    {
      key: 'applicationRoute',
      label: '지원 경로',
      children: displayOrDash(applicationRouteDisplay),
    },
  ]

  return (
    <div className="program-detail-fullpage-modal__info-tab-block">
      <h3 className="program-detail-info-tab__section-title">기본 정보</h3>
      <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>{toTableRows(basicInfoItems)}</tbody>
        </table>
      </div>
    </div>
  )
}
