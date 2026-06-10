import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { APPROVAL_STATUS_LABELS } from '@/shared/components/textbook-status-badge'
import {
  INSTITUTION_SIDO_FILTER_OPTIONS,
  getInstitutionSigunguSelectOptions,
} from '@/shared/config/institution-address-region-data'

const GRADE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '1학년', value: '1학년' },
  { label: '2학년', value: '2학년' },
  { label: '3학년', value: '3학년' },
  { label: '4학년', value: '4학년' },
  { label: '5학년', value: '5학년' },
  { label: '6학년', value: '6학년' },
]

const APPROVAL_STATUS_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: APPROVAL_STATUS_LABELS.pending, value: 'pending' },
  { label: APPROVAL_STATUS_LABELS.rejected, value: 'rejected' },
  { label: APPROVAL_STATUS_LABELS.approved, value: 'approved' },
]

/** 시안 — 검색·셀렉트(신청 학년·프로그램 승인 현황 등) */
const GENERAL_APPLICATION_FILTER_CONTROL_WIDTH = 260
/** 시안 — 자택/기관 주소 시·도·시/군/구 각 셀렉트 */
const GENERAL_APPLICATION_FILTER_ADDRESS_SEGMENT_WIDTH = 120
/** 시·도 ↔ 시/군/구 사이 간격(칸 내부) */
const GENERAL_APPLICATION_FILTER_ADDRESS_PAIR_GAP = 12
const GENERAL_APPLICATION_FILTER_ADDRESS_REGION_WIDTH =
  GENERAL_APPLICATION_FILTER_ADDRESS_SEGMENT_WIDTH * 2 +
  GENERAL_APPLICATION_FILTER_ADDRESS_PAIR_GAP

const GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE = {
  width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
} as const

/** 일반 프로그램 상세 — 기관 신청 목록 필터 (스크린샷 라벨) */
export const generalOrganizationApplicationFilterFields: FilterFieldConfig[] = [
  {
    key: 'organizationName',
    type: 'search',
    label: '신청 기관명',
    placeholder: '신청 기관명을 입력하세요',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
  },
  {
    key: 'institutionAddress',
    type: 'addressRegion',
    label: '기관 소재지',
    width: GENERAL_APPLICATION_FILTER_ADDRESS_REGION_WIDTH,
    addressRegion: {
      sidoKey: 'institutionSido',
      sigunguKey: 'institutionSigungu',
      sidoOptions: INSTITUTION_SIDO_FILTER_OPTIONS,
      getSigunguOptions: getInstitutionSigunguSelectOptions,
      sidoPlaceholder: '시/도',
      sigunguPlaceholder: '시/군/구',
    },
  },
  {
    key: 'approvalStatus',
    type: 'select',
    label: '프로그램 승인 현황',
    placeholder: '전체',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
    style: GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE,
    options: APPROVAL_STATUS_OPTIONS,
  },
  {
    key: 'grade',
    type: 'select',
    label: '신청 학년',
    placeholder: '전체',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
    style: GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE,
    options: GRADE_OPTIONS,
  },
  {
    key: 'teacherName',
    type: 'search',
    label: '신청 교사명',
    placeholder: '신청 교사명을 입력하세요',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
  },
]

/** 일반 프로그램 상세 — 개인(참여자) 신청 목록 필터 */
export const generalIndividualApplicationFilterFields: FilterFieldConfig[] = [
  {
    key: 'applicantName',
    type: 'search',
    label: '신청자명',
    placeholder: '신청자명을 입력하세요',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
  },
  {
    key: 'affiliation',
    type: 'search',
    label: '소속',
    placeholder: '소속을 입력하세요',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
  },
  {
    key: 'grade',
    type: 'select',
    label: '신청 학년',
    placeholder: '전체',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
    style: GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE,
    options: GRADE_OPTIONS,
  },
  {
    key: 'homeAddress',
    type: 'addressRegion',
    label: '자택 주소지',
    width: GENERAL_APPLICATION_FILTER_ADDRESS_REGION_WIDTH,
    addressRegion: {
      sidoKey: 'homeSido',
      sigunguKey: 'homeSigungu',
      sidoOptions: INSTITUTION_SIDO_FILTER_OPTIONS,
      getSigunguOptions: getInstitutionSigunguSelectOptions,
      sidoPlaceholder: '시/도',
      sigunguPlaceholder: '시/군/구',
    },
  },
  {
    key: 'approvalStatus',
    type: 'select',
    label: '프로그램 승인 현황',
    placeholder: '전체',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
    style: GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE,
    options: APPROVAL_STATUS_OPTIONS,
  },
]

const INSTRUCTOR_EXPERIENCE_YEARS_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '1년', value: '1' },
  { label: '2년', value: '2' },
  { label: '3년', value: '3' },
  { label: '4년', value: '4' },
  { label: '5년', value: '5' },
  { label: '6년 이상', value: '6+' },
]

const INSTRUCTOR_EVALUATION_GRADE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: 'A등급', value: 'A' },
  { label: 'B등급', value: 'B' },
  { label: 'C등급', value: 'C' },
]

/** 일반 프로그램 상세 — 강사 신청 목록 필터 (스크린샷 라벨) */
export const generalInstructorApplicationFilterFields: FilterFieldConfig[] = [
  {
    key: 'instructorName',
    type: 'search',
    label: '신청 강사명',
    placeholder: '강사명을 입력하세요',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
  },
  {
    key: 'homeAddress',
    type: 'addressRegion',
    label: '자택 소재지',
    width: GENERAL_APPLICATION_FILTER_ADDRESS_REGION_WIDTH,
    addressRegion: {
      sidoKey: 'homeSido',
      sigunguKey: 'homeSigungu',
      sidoOptions: INSTITUTION_SIDO_FILTER_OPTIONS,
      getSigunguOptions: getInstitutionSigunguSelectOptions,
      sidoPlaceholder: '시/도',
      sigunguPlaceholder: '시/군/구',
    },
  },
  {
    key: 'experienceYears',
    type: 'select',
    label: 'JA 강의 경력',
    placeholder: '전체',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
    style: GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE,
    options: INSTRUCTOR_EXPERIENCE_YEARS_OPTIONS,
  },
  {
    key: 'evaluationGrade',
    type: 'select',
    label: 'JA 평가 등급',
    placeholder: '전체',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
    style: GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE,
    options: INSTRUCTOR_EVALUATION_GRADE_OPTIONS,
  },
  {
    key: 'approvalStatus',
    type: 'select',
    label: '프로그램 승인 현황',
    placeholder: '전체',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
    style: GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE,
    options: APPROVAL_STATUS_OPTIONS,
  },
]

/** 일반 프로그램 상세 — 강사 신청 목록 캘린더 뷰 필터 */
export const generalInstructorCalendarFilterFields: FilterFieldConfig[] = [
  {
    key: 'organizationName',
    type: 'search',
    label: '신청 기관명',
    placeholder: '신청 기관명을 입력하세요',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
  },
  {
    key: 'homeAddress',
    type: 'addressRegion',
    label: '자택 소재지',
    width: GENERAL_APPLICATION_FILTER_ADDRESS_REGION_WIDTH,
    addressRegion: {
      sidoKey: 'homeSido',
      sigunguKey: 'homeSigungu',
      sidoOptions: INSTITUTION_SIDO_FILTER_OPTIONS,
      getSigunguOptions: getInstitutionSigunguSelectOptions,
      sidoPlaceholder: '시/도',
      sigunguPlaceholder: '시/군/구',
    },
  },
  {
    key: 'approvalStatus',
    type: 'select',
    label: '프로그램 승인 현황',
    placeholder: '전체',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
    style: GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE,
    options: APPROVAL_STATUS_OPTIONS,
  },
  {
    key: 'grade',
    type: 'select',
    label: '신청 학년',
    placeholder: '전체',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
    style: GENERAL_APPLICATION_FILTER_SELECT_FIELD_STYLE,
    options: GRADE_OPTIONS,
  },
  {
    key: 'instructorName',
    type: 'search',
    label: '신청 강사명',
    placeholder: '강사명을 입력하세요',
    width: GENERAL_APPLICATION_FILTER_CONTROL_WIDTH,
  },
]
