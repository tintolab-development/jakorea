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

/** 경제 교육 프로그램용 관리자 필터 필드 */
export const economyFilterFields = [
  {
    key: 'title',
    type: 'search' as const,
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    width: '28%',
  },
  {
    key: 'lifecycleStatus',
    type: 'select' as const,
    label: '프로그램 진행 현황',
    placeholder: '전체',
    options: statusOptions,
    width: '28%',
  },
  {
    key: 'category',
    type: 'select' as const,
    label: '참여자 유형',
    placeholder: '전체',
    options: economyParticipantTypeOptions,
    width: '22%',
  },
  {
    key: 'targetLevel',
    type: 'select' as const,
    label: '교육 대상',
    placeholder: '전체',
    options: economyTargetLevelOptions,
    width: '22%',
  },
]

/** 경제 교육 · 위젯 「예정·진행 중·완료 프로그램」 선택 시 — 진행 현황 필터 없음 */
export const economyScheduledFilterFields = [
  {
    key: 'title',
    type: 'search' as const,
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    width: '25%',
  },
  {
    key: 'operationPeriod',
    type: 'dateRange' as const,
    label: '사업 운영 기간',
    width: '25%',
  },
  {
    key: 'category',
    type: 'select' as const,
    label: '참여자 유형',
    placeholder: '전체',
    options: economyParticipantTypeOptions,
    width: '25%',
  },
  {
    key: 'targetLevel',
    type: 'select' as const,
    label: '교육 대상',
    placeholder: '전체',
    options: economyTargetLevelOptions,
    width: '25%',
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
    width: '15%',
  },
  {
    key: 'category',
    type: 'select' as const,
    label: '수강자 유형',
    placeholder: '전체',
    options: categoryOptions,
    width: '15%',
  },
  {
    key: 'businessArea',
    type: 'select' as const,
    label: '교육 분야',
    placeholder: '전체',
    options: businessAreaOptions,
    width: '15%',
  },
  {
    key: 'targetLevel',
    type: 'select' as const,
    label: '교육 대상',
    placeholder: '전체',
    options: targetLevelOptions,
    width: '15%',
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
    width: '15%',
  },
  {
    key: 'operationPeriod',
    type: 'dateRange' as const,
    label: '운영기간',
    width: '25%',
  },
]
