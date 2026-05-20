import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES } from '../education-schedule'
import {
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL,
  type UjatInstitutionScheduleConfirmStatus,
} from './types'

export const UJAT_SCHEDULE_CONFIRM_FILTER_ALL = ''

const scheduleConfirmStatusOptions = [
  { label: '전체', value: UJAT_SCHEDULE_CONFIRM_FILTER_ALL },
  ...(
    Object.entries(UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL) as [
      UjatInstitutionScheduleConfirmStatus,
      string,
    ][]
  ).map(([value, label]) => ({ label, value })),
]

const confirmedScheduleOptions = [
  { label: '전체', value: UJAT_SCHEDULE_CONFIRM_FILTER_ALL },
  ...UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES.map(({ isoDate, title }) => ({
    label: title,
    value: isoDate,
  })),
]

export const UJAT_SCHEDULE_CONFIRM_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'institutionName',
    type: 'search',
    label: '참여 기관명',
    placeholder: '기관명을 입력하세요',
    width: '25%',
  },
  {
    key: 'scheduleConfirmStatus',
    type: 'select',
    label: '일정 확인 현황',
    placeholder: '전체',
    options: scheduleConfirmStatusOptions,
    width: '25%',
  },
  {
    key: 'confirmedScheduleIso',
    type: 'select',
    label: '교육 진행 확정 일정',
    placeholder: '전체',
    options: confirmedScheduleOptions,
    width: '25%',
  },
  {
    key: 'teacherName',
    type: 'search',
    label: '담당 교사명',
    placeholder: '교사명을 입력하세요',
    width: '25%',
  },
]
