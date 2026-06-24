import {
  programTypes,
  statusOptions,
  programProgressPhaseFilterOptions,
  categoryOptions,
  businessAreaOptions,
  targetLevelOptions,
  programListTargetLevelOptions,
} from '../constants/program-list-constants'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

/**
 * 「전체 프로그램」「완료 프로그램」위젯 탭
 * 프로그램명 / 진행 현황 / 교육 대상
 */
export const programListOverviewFilterFields = [
  {
    key: 'title',
    type: 'search' as const,
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'lifecycleStatus',
    type: 'select' as const,
    label: '프로그램 진행 현황',
    placeholder: '전체',
    options: programProgressPhaseFilterOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'targetLevel',
    type: 'select' as const,
    label: '교육 대상',
    placeholder: '전체',
    options: programListTargetLevelOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
]

/** 「예정 프로그램」위젯 탭 */
export const programListScheduledFilterFields = [
  {
    key: 'title',
    type: 'search' as const,
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'targetLevel',
    type: 'select' as const,
    label: '교육 대상',
    placeholder: '전체',
    options: programListTargetLevelOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'operationPeriod',
    type: 'dateRange' as const,
    label: '사업 운영 기간',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]

/** 「진행 중인 프로그램」위젯 탭 */
export const programListInProgressFilterFields = [
  {
    key: 'title',
    type: 'search' as const,
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'targetLevel',
    type: 'select' as const,
    label: '교육 대상',
    placeholder: '전체',
    options: programListTargetLevelOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
]

/** 참가자(강사/학생 등)용 필터 필드 */
export const participantFilterFields = [
  {
    key: 'search',
    type: 'search' as const,
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    width: '20%',
  },
  {
    key: 'dateRange',
    type: 'dateRange' as const,
    label: '운영 기간',
    width: '24%',
  },
  {
    key: 'target',
    type: 'select' as const,
    label: '수강 대상',
    placeholder: '전체',
    options: [
      { value: 'all', label: '전체' },
      { value: 'individual', label: '개인 학생' },
      { value: 'school', label: '학교(선생님)' },
    ],
    width: '19%',
  },
  {
    key: 'type',
    type: 'select' as const,
    label: '교육 유형',
    placeholder: '전체',
    options: [
      { value: 'all', label: '전체' },
      ...programTypes.map(type => ({ value: type.value, label: type.label })),
    ],
    width: '19%',
  },
  {
    key: 'status',
    type: 'select' as const,
    label: '진행 상태',
    placeholder: '전체',
    options: [
      { value: 'all', label: '전체' },
      ...statusOptions.map(status => ({ value: status.value, label: status.label })),
    ],
    width: '18%',
  },
]

export interface ResolveProgramListFilterFieldsParams {
  scheduledViewActive: boolean
  inProgressViewActive: boolean
  completedViewActive: boolean
}

/** ProgramStatusWidget 4탭에 맞는 필터 필드 */
export function resolveProgramListFilterFields({
  scheduledViewActive,
  inProgressViewActive,
  completedViewActive,
}: ResolveProgramListFilterFieldsParams) {
  if (scheduledViewActive) return programListScheduledFilterFields
  if (inProgressViewActive || completedViewActive) return programListInProgressFilterFields
  return programListOverviewFilterFields
}

/** 교육 프로그램(7단계 위젯) 관리자 필터 필드 */
export const programListFilterFields = [
  {
    key: 'lifecycleStatus',
    type: 'select' as const,
    label: '프로그램 진행현황',
    placeholder: '전체',
    options: statusOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'category',
    type: 'select' as const,
    label: '수강자 유형',
    placeholder: '전체',
    options: categoryOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'businessArea',
    type: 'select' as const,
    label: '교육 분야',
    placeholder: '전체',
    options: businessAreaOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'targetLevel',
    type: 'select' as const,
    label: '교육 대상',
    placeholder: '전체',
    options: targetLevelOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'type',
    type: 'select' as const,
    label: '진행방식',
    placeholder: '전체',
    options: [
      { value: 'all', label: '전체' },
      ...programTypes.map(t => ({ value: t.value, label: t.label })),
    ],
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'operationPeriod',
    type: 'dateRange' as const,
    label: '운영기간',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]
