import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

/** 시안: 구분(선택 박스) · 후원사 · 후원 상태 · 주 담당자 · 후원 시작일 — 조회 버튼까지 한 줄 */
export const sponsorManagementFilterFields: FilterFieldConfig[] = [
  {
    key: 'organizationKind',
    type: 'select',
    label: '구분',
    placeholder: '전체',
    width: '16%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '기업', value: 'corporate' },
      { label: '재단', value: 'foundation' },
    ],
  },
  {
    key: 'sponsorName',
    type: 'search',
    label: '후원사',
    placeholder: '후원사명을 입력해 주세요',
    width: '20%',
  },
  {
    key: 'sponsorshipStatus',
    type: 'select',
    label: '후원 상태',
    placeholder: '전체',
    width: '16%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '후원 중', value: 'active' },
      { label: '후원 논의중', value: 'discussing' },
      { label: '후원 휴면', value: 'dormant' },
      { label: '후원 종료', value: 'ended' },
    ],
  },
  {
    key: 'managerName',
    type: 'search',
    label: '주 담당자',
    placeholder: '주 담당자명을 입력해 주세요',
    width: '20%',
  },
  {
    key: 'sponsorshipStartDateRange',
    type: 'dateRange',
    label: '후원 시작일',
    /** 빈 구간 유지 — 이번 달 자동 시드 금지 */
    defaultValue: null,
    width: '28%',
  },
]
