import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

export const detailedProgramManagementFilterFields: FilterFieldConfig[] = [
  {
    key: 'usageStatus',
    type: 'radio',
    label: '사용 여부',
    width: '30%',
    defaultValue: 'active',
    options: [
      { label: '사용', value: 'active' },
      { label: '미사용', value: 'inactive' },
    ],
  },
  {
    key: 'programName',
    type: 'search',
    label: '세부 프로그램명',
    placeholder: '세부 프로그램명을 입력하세요',
    width: '70%',
  },
]
