import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { formatUjatVolunteerApplicationType } from '@/data/mock/ujat-volunteer-applicants-mock'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import type { UjatVolunteerPreferredRegion } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
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

function formatBirthDateAndAge(birthDate: string, age: number): string {
  if (!birthDate || birthDate === '—') return '—'
  const formatted = birthDate.replace(/\./g, '. ')
  if (!age) return formatted
  return `${formatted} (만 ${age}세)`
}

function formatUniversityDisplay(universityName: string, maskSensitive: boolean): string {
  if (!maskSensitive) return universityName
  if (universityName.startsWith('**')) return universityName
  if (universityName.includes('대학교')) {
    const idx = universityName.indexOf('대학교')
    return `**${universityName.slice(idx)}`
  }
  return `**${universityName}`
}

export function UjatEducationProgressVolunteerDetailBasicInfo({
  applicant,
  maskSensitive,
  isEditing = false,
  preferredRegionDraft,
  onPreferredRegionDraftChange,
}: {
  applicant: UjatVolunteerApplicantRow
  maskSensitive: boolean
  isEditing?: boolean
  preferredRegionDraft?: UjatVolunteerPreferredRegion
  onPreferredRegionDraftChange?: (next: UjatVolunteerPreferredRegion) => void
}) {
  const { labels: preferredRegionLabels } = useUjatEducationRegions()
  const preferredRegionSelectOptions = preferredRegionLabels.map(region => ({
    label: region,
    value: region,
  }))

  const contactDisplay = maskSensitive ? applicant.contact : applicant.contactRaw
  const emailDisplay = maskSensitive ? applicant.email : applicant.emailRaw
  const universityDisplay = formatUniversityDisplay(applicant.universityName, maskSensitive)
  const universityGradeDisplay = withProgramDetailTdDivider([universityDisplay, applicant.grade])
  const genderBirthDisplay = withProgramDetailTdDivider([
    applicant.gender,
    formatBirthDateAndAge(applicant.birthDate, applicant.age),
  ])

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

  const basicInfoItems = [
    { key: 'name', label: '성명', children: nameCell },
    { key: 'id1365', label: '1365 ID', children: applicant.id1365 },
    { key: 'contact', label: '연락처', children: contactDisplay },
    { key: 'email', label: '이메일', children: emailDisplay },
    {
      key: 'genderBirth',
      label: '성별 및 생년월일',
      children: <ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>,
    },
    {
      key: 'applicationType',
      label: '지원 형태',
      children: formatUjatVolunteerApplicationType(applicant.applicationType),
    },
    {
      key: 'educationExperience',
      label: '교육 진행 경험 여부',
      children: applicant.hasEducationExperience ? '있음' : '없음',
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
          value={preferredRegionDraft ?? applicant.preferredRegion}
          onChange={value =>
            onPreferredRegionDraftChange?.(String(value) as UjatVolunteerPreferredRegion)
          }
          options={preferredRegionSelectOptions}
          aria-label="희망 교육 활동 지역"
        />
      ) : (
        applicant.preferredRegion
      ),
    },
    {
      key: 'universityGrade',
      label: '대학교 및 학년',
      children: <ProgramDetailTdSegmentWrap>{universityGradeDisplay}</ProgramDetailTdSegmentWrap>,
    },
    { key: 'major', label: '대학 전공', children: applicant.major },
    { key: 'applicationRoute', label: '지원 경로', children: applicant.applicationRoute, span: 2 as const },
  ]

  return (
    <div className="program-detail-fullpage-modal__info-tab-block">
      <h3 className="program-detail-info-tab__section-title">봉사자 기본 정보</h3>
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
