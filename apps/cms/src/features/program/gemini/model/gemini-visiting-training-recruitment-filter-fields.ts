import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

/** TableFilterGroup `width` % — 합 100%. 연수 요청 가능기간은 dateRange 비중 확대 */
export const geminiVisitingTrainingRecruitmentFilterFields: FilterFieldConfig[] = [
  {
    key: 'title',
    type: 'search',
    label: '공고명',
    placeholder: '공고명을 입력하세요',
    width: '28%',
  },
  {
    key: 'status',
    type: 'select',
    label: '상태',
    placeholder: '전체',
    width: '20%',
    options: [
      { label: '전체', value: 'ALL' },
      { label: '예정', value: 'SCHEDULED' },
      { label: '진행 중', value: 'IN_PROGRESS' },
      { label: '종료', value: 'ENDED' },
    ],
  },
  {
    key: 'trainingRequestPeriodRange',
    type: 'dateRange',
    label: '연수 요청 가능기간',
    defaultValue: null,
    width: '52%',
  },
]
