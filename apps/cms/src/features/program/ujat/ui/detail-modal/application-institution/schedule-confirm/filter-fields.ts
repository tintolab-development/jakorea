import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES } from '../education-schedule'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { getUjatScheduleAssignRegionState } from '../schedule-assign/store'
import {
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL,
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_ORDER,
} from './types'

export const UJAT_SCHEDULE_CONFIRM_FILTER_ALL = ''

const scheduleConfirmStatusOptions = [
  { label: '전체', value: UJAT_SCHEDULE_CONFIRM_FILTER_ALL },
  ...UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_ORDER.map(status => ({
    label: UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL[status],
    value: status,
  })),
]

/** 해당 지역 임시 배정 store에 등록된 교육 일정만 — 미등록 날짜 제외 */
export function listRegisteredConfirmScheduleFilterOptions(
  regionKey: UjatInstitutionApplicationRegionKey
): CmsSelectMultipleOption[] {
  const state = getUjatScheduleAssignRegionState(regionKey)

  return UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES.flatMap(({ isoDate, title }) => {
    const day = state.days[isoDate]
    const hasAssignment = day?.rows.some(
      row => row.institutionRowId != null && row.gradeValues.length > 0
    )
    if (!hasAssignment) return []
    return [{ label: title, value: isoDate }]
  })
}

export function buildUjatScheduleConfirmFilterFields(
  regionKey: UjatInstitutionApplicationRegionKey
): FilterFieldConfig[] {
  return [
    {
      key: 'institutionName',
      type: 'search',
      label: '참여 기관명',
      placeholder: '기관명을 입력하세요',
      width: '25%',
    },
    {
      key: 'scheduleConfirmStatus',
      type: 'select',
      label: '일정 확인 현황',
      placeholder: '전체',
      options: scheduleConfirmStatusOptions,
      width: '25%',
    },
    {
      key: 'confirmedScheduleIsoDates',
      type: 'multiSelect',
      label: '교육 진행 확정 일정',
      placeholder: '일정을 선택하세요',
      multiSelectOptions: listRegisteredConfirmScheduleFilterOptions(regionKey),
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
