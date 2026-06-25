import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

export const ALIMTALK_TEMPLATE_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'kakaoApprovalStatus',
    type: 'select',
    label: '카카오 승인 현황',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: [
      { label: '전체', value: 'ALL' },
      { label: '등록', value: 'REGISTERED' },
      { label: '요청', value: 'REQUESTED' },
      { label: '승인', value: 'APPROVED' },
      { label: '반려', value: 'REJECTED' },
    ],
  },
  {
    key: 'templateUsageStatus',
    type: 'select',
    label: '템플릿 사용 현황',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: [
      { label: '전체', value: 'ALL' },
      { label: '대기', value: 'WAITING' },
      { label: '정상', value: 'NORMAL' },
      { label: '중단', value: 'SUSPENDED' },
      { label: '휴면', value: 'DORMANT' },
      { label: '차단', value: 'BLOCKED' },
    ],
  },
  {
    key: 'channelName',
    type: 'search',
    label: '카카오 채널명(검색 아이디)',
    placeholder: '카카오 채널명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'templateName',
    type: 'search',
    label: '템플릿명',
    placeholder: '템플릿명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '최종 등록일',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]
