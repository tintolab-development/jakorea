/**
 * 회원 목록(`/users/list`) 상단 필터 필드 정의 — kind별 분기
 */
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import type { MemberListKind } from '@/shared/config/member-list-kinds'
import { createInstitutionAddressRegionFilterField } from '@/shared/config/institution-address-region-filter-field'
import {
  INSTRUCTOR_SETTLEMENT_FILTER_OPTIONS,
  INSTRUCTOR_TYPE_FILTER_OPTIONS,
} from '@/shared/config/instructor-list-filter-options'
import { ADMIN_PERMISSION_FILTER_OPTIONS } from '@/shared/config/admin-permission-filter-options'

function searchField(label: string, placeholder: string, width: string): FilterFieldConfig {
  return {
    key: 'search',
    type: 'search',
    label,
    placeholder,
    width,
  }
}

function dateRangeField(label: string, width: string): FilterFieldConfig {
  return {
    key: 'createdAtRange',
    type: 'dateRange',
    label,
    width,
    defaultValue: null,
  }
}

const MEMBER_ROLE_SELECT_FIELD: FilterFieldConfig = {
  key: 'role',
  type: 'select',
  label: '회원 유형',
  placeholder: '전체',
  width: '30%',
  options: [
    { label: '전체', value: 'ALL' },
    { label: '개인', value: 'INDIVIDUAL' },
    { label: '학교(교사)', value: 'SCHOOL' },
    { label: '강사', value: 'INSTRUCTOR' },
    { label: '관리자', value: 'ADMIN' },
  ],
}

const INSTITUTION_FIELDS: FilterFieldConfig[] = [
  searchField('기관명', '기관명을 입력하세요', '34%'),
  createInstitutionAddressRegionFilterField(),
  dateRangeField('등록 시기', '44%'),
]

const INSTRUCTOR_FIELDS: FilterFieldConfig[] = [
  searchField('강사명', '강사명을 입력하세요', '20%'),
  {
    key: 'instructorType',
    type: 'select',
    label: '강사 유형',
    placeholder: '전체',
    width: '18%',
    options: INSTRUCTOR_TYPE_FILTER_OPTIONS,
  },
  {
    key: 'settlementStatus',
    type: 'select',
    label: '정산 현황',
    placeholder: '전체',
    width: '18%',
    options: INSTRUCTOR_SETTLEMENT_FILTER_OPTIONS,
  },
  dateRangeField('가입 시기', '44%'),
]

const ADMIN_FIELDS: FilterFieldConfig[] = [
  searchField('관리자명', '관리자명을 입력하세요', '30%'),
  {
    key: 'adminPermissionVariant',
    type: 'select',
    label: '권한 유형',
    placeholder: '전체',
    width: '30%',
    options: ADMIN_PERMISSION_FILTER_OPTIONS,
  },
  dateRangeField('가입 시기', '40%'),
]

/** 전체·개인 등 일반 회원 목록 (회원 유형 셀렉트 + 가입일) */
const DEFAULT_MEMBER_FIELDS: FilterFieldConfig[] = [
  searchField('회원명', '회원명을 입력하세요', '30%'),
  MEMBER_ROLE_SELECT_FIELD,
  dateRangeField('가입 시기', '40%'),
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
