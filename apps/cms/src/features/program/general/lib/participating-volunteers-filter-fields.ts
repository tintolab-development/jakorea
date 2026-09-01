import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

const FILTER_CONTROL_WIDTH = 260

/** 참여 봉사자 목록 필터 */
export const participatingVolunteersFilterFields: FilterFieldConfig[] = [
  {
    key: 'volunteerName',
    type: 'search',
    label: '참여 봉사자명',
    placeholder: '봉사자명을 입력하세요',
    width: FILTER_CONTROL_WIDTH,
  },
  {
    key: 'id1365',
    type: 'search',
    label: '1365 ID',
    placeholder: '1365 ID를 입력하세요',
    width: FILTER_CONTROL_WIDTH,
  },
]
