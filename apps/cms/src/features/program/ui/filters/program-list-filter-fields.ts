import {
  programTypes,
  statusOptions,
  categoryOptions,
  businessAreaOptions,
  targetLevelOptions,
  economyParticipantTypeOptions,
  economyTargetLevelOptions,
} from '../constants/program-list-constants'

/** 참가자(강사/학생 등)용 필터 필드 */
export const participantFilterFields = [
  {
    key: 'search',
    type: 'search' as const,
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
  },
  {
    key: 'dateRange',
    type: 'dateRange' as const,
    label: '운영 기간',
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
  },
]

/** 경제 교육 프로그램용 관리자 필터 필드 */
export const economyFilterFields = [
  {
    key: 'title',
    type: 'search' as const,
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
  },
  {
    key: 'lifecycleStatusText',
    type: 'search' as const,
    label: '프로그램 진행 현황',
    placeholder: '프로그램 진행 현황을 입력하세요',
  },
  {
    key: 'category',
    type: 'select' as const,
    label: '참여자 유형',
    placeholder: '전체',
    options: economyParticipantTypeOptions,
  },
  {
    key: 'targetLevel',
    type: 'select' as const,
    label: '교육 대상',
    placeholder: '전체',
    options: economyTargetLevelOptions,
  },
]

/** 일반 프로그램용 관리자 필터 필드 */
export const programListFilterFields = [
  {
    key: 'lifecycleStatus',
    type: 'select' as const,
    label: '프로그램 진행현황',
    placeholder: '전체',
    options: statusOptions,
  },
  {
    key: 'category',
    type: 'select' as const,
    label: '수강자 유형',
    placeholder: '전체',
    options: categoryOptions,
  },
  {
    key: 'businessArea',
    type: 'select' as const,
    label: '교육 분야',
    placeholder: '전체',
    options: businessAreaOptions,
  },
  {
    key: 'targetLevel',
    type: 'select' as const,
    label: '교육 대상',
    placeholder: '전체',
    options: targetLevelOptions,
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
  },
  {
    key: 'operationPeriod',
    type: 'dateRange' as const,
    label: '운영기간',
  },
]
