import {
  programListTargetLevelOptions,
  programProgressPhaseFilterOptions,
} from '@/features/program/general/ui/constants/program-list-constants'
import type { ProgramListView } from '@/features/program/general/ui/table/program-table-column-resolver'
import type { FilterFieldConfig } from '@/shared/ui'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

/**
 * 「전체 프로그램」— 프로그램명 / 프로그램 진행 현황 / 교육 대상
 * 시안: 참여자 유형 없음
 */
export const trainedTeachersOverviewFilterFields: FilterFieldConfig[] = [
  {
    key: 'title',
    type: 'search',
    label: '프로그램명',
    placeholder: '프로그램명을 입력해 주세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'lifecycleStatus',
    type: 'select',
    label: '프로그램 진행 현황',
    placeholder: '전체',
    options: programProgressPhaseFilterOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'targetLevel',
    type: 'select',
    label: '교육 대상',
    placeholder: '전체',
    options: programListTargetLevelOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
]

/** 「예정 프로그램」— 프로그램명 / 교육 대상 / 사업 운영 기간 */
export const trainedTeachersScheduledFilterFields: FilterFieldConfig[] = [
  {
    key: 'title',
    type: 'search',
    label: '프로그램명',
    placeholder: '프로그램명을 입력해 주세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'targetLevel',
    type: 'select',
    label: '교육 대상',
    placeholder: '전체',
    options: programListTargetLevelOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'operationPeriod',
    type: 'dateRange',
    label: '사업 운영 기간',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]

/** 「진행 중인 프로그램」「완료 프로그램」— 프로그램명 / 교육 대상 */
export const trainedTeachersInProgressFilterFields: FilterFieldConfig[] = [
  {
    key: 'title',
    type: 'search',
    label: '프로그램명',
    placeholder: '프로그램명을 입력해 주세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'targetLevel',
    type: 'select',
    label: '교육 대상',
    placeholder: '전체',
    options: programListTargetLevelOptions,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
]

export function resolveTrainedTeachersListFilterFields(view: ProgramListView): FilterFieldConfig[] {
  if (view === 'SCHEDULED') return trainedTeachersScheduledFilterFields
  if (view === 'IN_PROGRESS' || view === 'COMPLETED') {
    return trainedTeachersInProgressFilterFields
  }
  return trainedTeachersOverviewFilterFields
}
