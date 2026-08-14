import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'

export const ALIMTALK_TEMPLATE_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'categoryName',
    type: 'search',
    label: '카테고리명',
    placeholder: '카테고리명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'templateName',
    type: 'search',
    label: '템플릿명',
    placeholder: '템플릿명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
]
