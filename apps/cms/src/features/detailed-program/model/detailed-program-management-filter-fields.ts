import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

export const detailedProgramManagementFilterFields: FilterFieldConfig[] = [
  {
    key: 'programName',
    type: 'search',
    label: '세부 프로그램명',
    placeholder: '세부 프로그램명을 입력하세요',
    width: '50%',
  },
  {
    key: 'usageStatus',
    type: 'select',
    label: '사용 여부',
    placeholder: '전체',
    width: '50%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '사용', value: 'active' },
      { label: '미사용', value: 'inactive' },
    ],
  },
]
