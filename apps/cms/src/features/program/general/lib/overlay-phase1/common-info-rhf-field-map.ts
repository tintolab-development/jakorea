/**
 * CommonInfoFormValues ↔ 향후 RHF 입력 대응표.
 * 화면은 수정하지 않는다. present/persist/명시적 빈값의 UI 의미를 고정한다.
 */
import type { CommonInfoFormValues } from './common-info-form-values'

export type CommonInfoRhfPresenceRule =
  | 'trim-empty-falls-back'
  | 'has-own-key'
  | 'null-present-becomes-zero-on-draft'
  | 'array-present-even-if-empty'
  | 'maps-always-object'

export type CommonInfoRhfFieldMapEntry = {
  formValueKey: keyof CommonInfoFormValues
  ui: string
  presence: CommonInfoRhfPresenceRule
  notes: string
}

export const COMMON_INFO_RHF_FIELD_MAP: readonly CommonInfoRhfFieldMapEntry[] = [
  {
    formValueKey: 'programTitleKo',
    ui: '기본정보 · 프로그램명 CmsInput',
    presence: 'trim-empty-falls-back',
    notes: '빈 문자열은 baseline mainTitle/title로 fallback',
  },
  {
    formValueKey: 'programTitleEn',
    ui: '기본정보 · 영문명',
    presence: 'trim-empty-falls-back',
    notes: '빈 값은 baseline titleEn, 출력 시 빈 문자열은 undefined',
  },
  {
    formValueKey: 'publicProgramTitle',
    ui: '기본정보 · 공고용명',
    presence: 'trim-empty-falls-back',
    notes: '명시적 빈값은 apply fallback(known-diff). persist는 원본 raw 유지',
  },
  {
    formValueKey: 'detailedProgramId',
    ui: '기본정보 · 세부프로그램 select',
    presence: 'trim-empty-falls-back',
    notes: '일정형+비교사 잠금 시 마스터 id 제거. 해당없음 sentinel',
  },
  {
    formValueKey: 'detailedProgramName',
    ui: '기본정보 · 세부프로그램명',
    presence: 'trim-empty-falls-back',
    notes: '일정형은 scheduleDetails 라벨 파생',
  },
  {
    formValueKey: 'businessField',
    ui: '기본정보 · 사업분야 select',
    presence: 'trim-empty-falls-back',
    notes: '빈 값은 baseline businessArea 유지',
  },
  {
    formValueKey: 'partnerInvolvement',
    ui: '기본정보 · 후원사 참여 여부',
    presence: 'has-own-key',
    notes: '키 부재 시 기존 partnerInvolvement. yes/no 문자열',
  },
  {
    formValueKey: 'educationVenueKind',
    ui: '기본정보 · 교육장소 종류',
    presence: 'trim-empty-falls-back',
    notes: 'outside/other/inside 외는 inside',
  },
  {
    formValueKey: 'educationVenueDetail',
    ui: '기본정보 · 교육장소 상세',
    presence: 'trim-empty-falls-back',
    notes: 'other일 때만 venue로 승격',
  },
  {
    formValueKey: 'educationCourse',
    ui: '기본정보 · 교육과정',
    presence: 'trim-empty-falls-back',
    notes: '옵션 value → 라벨',
  },
  {
    formValueKey: 'ipOwned',
    ui: '기본정보 · IP 소유',
    presence: 'trim-empty-falls-back',
    notes: 'JA/Jointly/Partner',
  },
  {
    formValueKey: 'courseDeliveredBy',
    ui: '기본정보 · 과정 제공',
    presence: 'trim-empty-falls-back',
    notes: 'ipOwned와 동일 라벨 규칙',
  },
  {
    formValueKey: 'operationRangeSeal',
    ui: '기본정보 · 사업기간 DateRange',
    presence: 'has-own-key',
    notes: 'date-only → KST startOf/endOf day ISO. 키 부재 시 baseline 기간',
  },
  {
    formValueKey: 'surveyItems',
    ui: '기타 · 설문 체크 3종',
    presence: 'has-own-key',
    notes: '키 부재는 빈 survey menu. true만 키로 승격',
  },
  {
    formValueKey: 'sponsorIds',
    ui: '기본정보 · 후원사 다중 선택',
    presence: 'array-present-even-if-empty',
    notes: '배열 키가 있으면 단건 fallback 안 함',
  },
  {
    formValueKey: 'sponsorId',
    ui: '기본정보 · 후원사 단건 레거시',
    presence: 'trim-empty-falls-back',
    notes: 'ids 배열이 없을 때만 사용',
  },
  {
    formValueKey: 'managerContactIds',
    ui: '기본정보 · 후원 담당자 다중 선택',
    presence: 'array-present-even-if-empty',
    notes: '미선택 토큰은 contact id에서 제거. 가입 자체는 가능',
  },
  {
    formValueKey: 'managerContactId',
    ui: '기본정보 · 후원 담당자 단건 레거시',
    presence: 'trim-empty-falls-back',
    notes: '미선택 토큰 필터 후 빈 배열이면 baseline contact 유지',
  },
  {
    formValueKey: 'sponsorManagerLine',
    ui: '기본정보 · 담당자 표시 문구',
    presence: 'trim-empty-falls-back',
    notes: 'ref(::)가 있으면 표시 문구로 쓰지 않음',
  },
  {
    formValueKey: 'kpiParticipantCount',
    ui: '기타 · KPI 참여자',
    presence: 'null-present-becomes-zero-on-draft',
    notes: 'present(null) → draft 0, update persist null 유지',
  },
  {
    formValueKey: 'kpiInstructor',
    ui: '기타 · KPI 강사',
    presence: 'null-present-becomes-zero-on-draft',
    notes: '동일',
  },
  {
    formValueKey: 'kpiVolunteer',
    ui: '기타 · KPI 봉사자',
    presence: 'null-present-becomes-zero-on-draft',
    notes: '동일',
  },
  {
    formValueKey: 'kpiDispatchedSchool',
    ui: '기타 · KPI 파견 학교 (조회 전용)',
    presence: 'null-present-becomes-zero-on-draft',
    notes: 'seed persist는 항상 null (known-diff)',
  },
  {
    formValueKey: 'kpiDispatchedClass',
    ui: '기타 · KPI 파견 학급 (조회 전용)',
    presence: 'null-present-becomes-zero-on-draft',
    notes: 'seed persist는 항상 null',
  },
  {
    formValueKey: 'wageGrade1Fee',
    ui: '기타 · 1급 강사비',
    presence: 'has-own-key',
    notes: '부재 시 pricing "-". 미변경 PATCH strip은 Mapper',
  },
  {
    formValueKey: 'wageGrade2Fee',
    ui: '기타 · 2급 강사비',
    presence: 'has-own-key',
    notes: '동일',
  },
  {
    formValueKey: 'wageGrade3Fee',
    ui: '기타 · 3급 강사비',
    presence: 'has-own-key',
    notes: '동일',
  },
  {
    formValueKey: 'paymentItemValues',
    ui: '기타 · 지급항목 id 다중 선택',
    presence: 'array-present-even-if-empty',
    notes: 'labels가 있으면 labels 우선',
  },
  {
    formValueKey: 'paymentItemLabels',
    ui: '기타 · 지급항목 라벨',
    presence: 'trim-empty-falls-back',
    notes: '둘 다 없으면 해당없음',
  },
  {
    formValueKey: 'singleEducationForm',
    ui: '교육정보 · 단일 회차 교육형태',
    presence: 'trim-empty-falls-back',
    notes: 'multiCommon || single || online',
  },
  {
    formValueKey: 'multiCommonEducationForm',
    ui: '교육정보 · 복수 회차 공통 교육형태',
    presence: 'trim-empty-falls-back',
    notes: '우선순위가 single보다 높음',
  },
  {
    formValueKey: 'legacyEducationForm',
    ui: '교육정보 · 레거시 educationForm',
    presence: 'trim-empty-falls-back',
    notes: '공통 해석 후 추가 fallback',
  },
  {
    formValueKey: 'singleParticipation',
    ui: '교육정보 · 단일 참여방식',
    presence: 'trim-empty-falls-back',
    notes: '기관 대상이면 숨김',
  },
  {
    formValueKey: 'multiCommonParticipation',
    ui: '교육정보 · 복수 공통 참여방식',
    presence: 'trim-empty-falls-back',
    notes: '우선순위가 single보다 높음',
  },
  {
    formValueKey: 'ipsType',
    ui: '교육정보 · IPS category/detail',
    presence: 'has-own-key',
    notes: '키 부재는 빈 category',
  },
  {
    formValueKey: 'scheduleLines',
    ui: '교육정보 · 교육 일정 라인',
    presence: 'array-present-even-if-empty',
    notes: '빈 배열은 기존 nested 라인 유지',
  },
  {
    formValueKey: 'curriculum',
    ui: '교육정보 · 커리큘럼 세션 맵',
    presence: 'maps-always-object',
    notes: 'RHF 배열/맵 sidecar. 일정형이면 행을 비움',
  },
  {
    formValueKey: 'schedule',
    ui: '교육정보 · 일정형 상세 맵',
    presence: 'maps-always-object',
    notes: '커리큘럼형이면 행을 비움',
  },
] as const

export function commonInfoRhfFieldMapCoversAllKeys(): boolean {
  const mapped = new Set(COMMON_INFO_RHF_FIELD_MAP.map(entry => entry.formValueKey))
  const keys: Array<keyof CommonInfoFormValues> = [
    'programTitleKo',
    'programTitleEn',
    'publicProgramTitle',
    'detailedProgramId',
    'detailedProgramName',
    'businessField',
    'partnerInvolvement',
    'educationVenueKind',
    'educationVenueDetail',
    'educationCourse',
    'ipOwned',
    'courseDeliveredBy',
    'operationRangeSeal',
    'surveyItems',
    'sponsorIds',
    'sponsorId',
    'managerContactIds',
    'managerContactId',
    'sponsorManagerLine',
    'kpiParticipantCount',
    'kpiInstructor',
    'kpiVolunteer',
    'kpiDispatchedSchool',
    'kpiDispatchedClass',
    'wageGrade1Fee',
    'wageGrade2Fee',
    'wageGrade3Fee',
    'paymentItemValues',
    'paymentItemLabels',
    'singleEducationForm',
    'multiCommonEducationForm',
    'legacyEducationForm',
    'singleParticipation',
    'multiCommonParticipation',
    'ipsType',
    'scheduleLines',
    'curriculum',
    'schedule',
  ]
  return keys.every(key => mapped.has(key)) && mapped.size === keys.length
}
