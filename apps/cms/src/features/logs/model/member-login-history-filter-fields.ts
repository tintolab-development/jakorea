import { isMemberLoginHistoryDateDisabled } from '@/features/logs/lib/member-login-retention'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

export const memberLoginHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'adminName',
    type: 'search',
    label: '관리자명',
    placeholder: '관리자명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'loginId',
    type: 'search',
    label: '아이디',
    placeholder: '아이디를 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '로그인 일시',
    defaultValue: null,
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    // 노션: 수집일로부터 1개월 보관 — 시안 예시 기간(수개월)과 불일치 → 노션 정책 우선
    disabledDate: isMemberLoginHistoryDateDisabled,
  },
]
