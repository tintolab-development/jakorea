import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

export const sponsorManagementFilterFields: FilterFieldConfig[] = [
  {
    key: 'organizationKind',
    type: 'select',
    label: '구분',
    placeholder: '전체',
    width: '25%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '기업', value: 'corporate' },
      { label: '재단', value: 'foundation' },
      { label: '기관', value: 'institution' },
    ],
  },
  {
    key: 'sponsorName',
    type: 'search',
    label: '후원사명',
    placeholder: '후원사명을 입력하세요',
    width: '25%',
  },
  {
    key: 'managerName',
    type: 'search',
    label: '주 담당자명',
    placeholder: '담당자명을 입력하세요',
    width: '25%',
  },
  {
    key: 'sponsorshipStatus',
    type: 'select',
    label: '후원 상태',
    placeholder: '전체',
    width: '25%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '진행 중', value: 'active' },
      { label: '후원 종료', value: 'ended' },
    ],
  },
]
