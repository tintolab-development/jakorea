import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

export const fileDownloadHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'fileName',
    type: 'search',
    label: '다운로드 파일명',
    placeholder: '다운로드 파일명을 입력해 주세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'userName',
    type: 'search',
    label: '사용자',
    placeholder: '사용자명을 입력해 주세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '다운로드일',
    defaultValue: null,
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]
