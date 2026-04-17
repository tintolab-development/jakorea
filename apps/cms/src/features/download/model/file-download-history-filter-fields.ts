import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

/**
 * TableFilterGroup width 합 100%
 */
export const fileDownloadHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'fileName',
    type: 'search',
    label: '다운로드 파일명',
    placeholder: '파일명을 입력하세요',
    width: '34%',
  },
  {
    key: 'userName',
    type: 'search',
    label: '사용자',
    placeholder: '사용자를 입력하세요',
    width: '26%',
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '다운로드 기간',
    defaultValue: null,
    width: '40%',
  },
]
