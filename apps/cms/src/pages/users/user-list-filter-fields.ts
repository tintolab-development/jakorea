/**
 * 회원 목록(`/users/list`) 상단 필터 필드 정의 — kind별 분기
 */
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import type { MemberListKind } from '@/shared/config/member-list-kinds'
import { createInstitutionAddressRegionFilterField } from '@/shared/config/institution-address-region-filter-field'
import {
  INSTRUCTOR_JA_EVALUATION_GRADE_FILTER_OPTIONS,
  INSTRUCTOR_SETTLEMENT_FILTER_OPTIONS,
} from '@/shared/config/instructor-list-filter-options'
import { ADMIN_PERMISSION_FILTER_OPTIONS } from '@/shared/config/admin-permission-filter-options'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

function searchField(label: string, placeholder: string): FilterFieldConfig {
  return {
    key: 'search',
    type: 'search',
    label,
    placeholder,
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  }
}

function dateRangeField(label: string): FilterFieldConfig {
  return {
    key: 'createdAtRange',
    type: 'dateRange',
    label,
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    defaultValue: null,
  }
}

const MEMBER_ROLE_SELECT_FIELD: FilterFieldConfig = {
  key: 'role',
  type: 'select',
  label: '회원 유형',
  placeholder: '전체',
  width: FILTER_CONTROL_MAX_WIDTH_PX,
  options: [
    { label: '전체', value: 'ALL' },
    { label: '개인', value: 'INDIVIDUAL' },
    { label: '강사', value: 'INSTRUCTOR' },
    { label: '관리자', value: 'ADMIN' },
  ],
}

const INSTITUTION_FIELDS: FilterFieldConfig[] = [
  searchField('기관명', '기관명을 입력하세요'),
  createInstitutionAddressRegionFilterField(),
  dateRangeField('등록 시기'),
]

/** 강사 회원 — 강사명 · JA 평가 등급 · 정산 현황 · 가입 시기 */
const INSTRUCTOR_FIELDS: FilterFieldConfig[] = [
  searchField('강사명', '강사명을 입력하세요'),
  {
    key: 'jaEvaluationGrade',
    type: 'select',
    label: 'JA 평가 등급',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: INSTRUCTOR_JA_EVALUATION_GRADE_FILTER_OPTIONS,
  },
  {
    key: 'settlementStatus',
    type: 'select',
    label: '정산 현황',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: INSTRUCTOR_SETTLEMENT_FILTER_OPTIONS,
  },
  dateRangeField('가입 시기'),
]

const ADMIN_FIELDS: FilterFieldConfig[] = [
  searchField('관리자명', '관리자명을 입력하세요'),
  {
    key: 'adminPermissionVariant',
    type: 'select',
    label: '권한 유형',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: ADMIN_PERMISSION_FILTER_OPTIONS,
  },
  dateRangeField('가입 시기'),
]

/** 전체·개인 등 일반 회원 목록 (회원 유형 셀렉트 + 가입일) */
const DEFAULT_MEMBER_FIELDS: FilterFieldConfig[] = [
  searchField('회원명', '회원명을 입력하세요'),
  MEMBER_ROLE_SELECT_FIELD,
  dateRangeField('가입 시기'),
]

export function getUserListFilterFields(kind: MemberListKind): FilterFieldConfig[] {
  switch (kind) {
    case 'institutions':
      return INSTITUTION_FIELDS
    case 'instructors':
      return INSTRUCTOR_FIELDS
    case 'admins':
      return ADMIN_FIELDS
    default:
      return DEFAULT_MEMBER_FIELDS
  }
}
