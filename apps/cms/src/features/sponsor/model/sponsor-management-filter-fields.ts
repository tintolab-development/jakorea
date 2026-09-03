import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

/** 시안: 구분(라디오) · 후원사명 · 후원 상태 · 주 담당자명 · 후원 시작일 */
export const sponsorManagementFilterFields: FilterFieldConfig[] = [
  {
    key: 'organizationKind',
    type: 'radio',
    label: '구분',
    width: '16%',
    defaultValue: 'corporate',
    options: [
      { label: '기업', value: 'corporate' },
      { label: '재단', value: 'foundation' },
    ],
  },
  {
    key: 'sponsorName',
    type: 'search',
    label: '후원사명',
    placeholder: '후원사명을 입력하세요',
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
      { label: '후원 종료', value: 'ended' },
    ],
  },
  {
    key: 'managerName',
    type: 'search',
    label: '주 담당자명',
    placeholder: '주 담당자명을 입력하세요',
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
