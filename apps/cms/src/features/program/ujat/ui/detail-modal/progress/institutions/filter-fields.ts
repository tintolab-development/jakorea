import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import { getUjatEducationProgressScheduleFilterOptions } from '@/data/mock/ujat-education-progress-institutions-mock'
import type { EducationProgressHalfKey } from '../tabs'

export const UJAT_EDU_PROGRESS_INSTITUTION_FILTER_ALL = ''

export function buildUjatEducationProgressInstitutionFilterFields(
  half: EducationProgressHalfKey
): FilterFieldConfig[] {
  const regionOptions = [
    { label: '전체', value: UJAT_EDU_PROGRESS_INSTITUTION_FILTER_ALL },
    ...listUjatEducationRegionsActive().map(({ key, label }) => ({
      label,
      value: key,
    })),
  ]

  const scheduleOptions = [
    { label: '전체', value: UJAT_EDU_PROGRESS_INSTITUTION_FILTER_ALL },
    ...getUjatEducationProgressScheduleFilterOptions(half),
  ]

  return [
    {
      key: 'institutionName',
      type: 'search',
      label: '참여 기관명',
      placeholder: '기관명을 입력하세요',
      width: '25%',
    },
    {
      key: 'educationRegion',
      type: 'select',
      label: '교육 지역',
      placeholder: '전체',
      options: regionOptions,
      width: '25%',
    },
    {
      key: 'educationScheduleIso',
      type: 'select',
      label: '교육 진행 일정',
      placeholder: '전체',
      options: scheduleOptions,
      width: '25%',
    },
    {
      key: 'teacherName',
      type: 'search',
      label: '담당 교사명',
      placeholder: '교사명을 입력하세요',
      width: '25%',
    },
  ]
}
