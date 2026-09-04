import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'
import {
  ALIMTALK_BROADCAST_TIMING_OPTIONS,
  ALIMTALK_RECEIVE_STATUS_OPTIONS,
  ALIMTALK_SEND_STATUS_OPTIONS,
} from './types'

const SELECT_ALL = '전체'

/** 검색·셀렉트 240 · dateRange 500 · 칸 갭 12. 너비에 따라 flex-wrap으로 2~3줄. */
export const SEND_HISTORY_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'requestDateRange',
    type: 'dateRange',
    label: '요청일',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    defaultValue: null,
  },
  {
    key: 'templateName',
    type: 'search',
    label: '템플릿명',
    placeholder: '템플릿명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'senderInfo',
    type: 'search',
    label: '발신자 정보',
    placeholder: '발신자 정보를 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'receiverInfo',
    type: 'search',
    label: '수신자 정보',
    placeholder: '수신자 정보를 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'broadcastTiming',
    type: 'select',
    label: '발송 시점',
    placeholder: SELECT_ALL,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: ALIMTALK_BROADCAST_TIMING_OPTIONS.map(value => ({ label: value, value })),
  },
  {
    key: 'sendStatus',
    type: 'select',
    label: '발송 상태',
    placeholder: SELECT_ALL,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: ALIMTALK_SEND_STATUS_OPTIONS.map(value => ({ label: value, value })),
  },
  {
    key: 'receiveStatus',
    type: 'select',
    label: '수신 상태',
    placeholder: SELECT_ALL,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: ALIMTALK_RECEIVE_STATUS_OPTIONS.map(value => ({ label: value, value })),
  },
  {
    key: 'sendDateRange',
    type: 'dateRange',
    label: '발송일',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    defaultValue: null,
  },
  {
    key: 'receiveDateRange',
    type: 'dateRange',
    label: '수신일',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    defaultValue: null,
  },
  {
    key: 'reserveDateRange',
    type: 'dateRange',
    label: '예약일',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    defaultValue: null,
  },
]
