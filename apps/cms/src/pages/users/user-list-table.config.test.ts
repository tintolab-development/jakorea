import { describe, expect, it } from 'vitest'
import {
  applyUserListSearchToParams,
  buildListQueryApiFilters,
  pendingRoleFromParams,
} from './user-list-table.config'

describe('buildListQueryApiFilters', () => {
  it('강사 탭 — rolesExactAnyOf 와 서버 필터를 넣는다', () => {
    const api = buildListQueryApiFilters({
      kind: 'instructors',
      search: '홍길동',
      jaEvaluationGrade: 'A',
      settlementStatus: '계좌 지급 완료',
      createdAtFrom: '2026-01-01',
      createdAtTo: '2026-01-31',
    })
    expect(api.role).toBe('INSTRUCTOR')
    expect(api.rolesExactAnyOf).toBe('general+instructor,instructor+school_teacher')
    expect(api.jaEvaluationGrade).toBe('A')
    expect(api.settlementStatus).toBe('계좌 지급 완료')
    expect(api.search).toBe('홍길동')
  })

  it('학교 탭 — regionSido/regionSigungu 를 넣고 role=SCHOOL', () => {
    const api = buildListQueryApiFilters({
      kind: 'institutions',
      search: '테스트고',
      institutionSido: '서울특별시',
      institutionSigungu: '중구',
      createdAtFrom: '2026-02-01',
      createdAtTo: '2026-02-28',
    })
    expect(api.role).toBe('SCHOOL')
    expect(api.regionSido).toBe('서울특별시')
    expect(api.regionSigungu).toBe('중구')
    expect(api.createdAtFrom).toBe('2026-02-01')
  })

  it('전체 탭(역할 필터 없음) — listAllAccounts', () => {
    expect(buildListQueryApiFilters({ kind: 'all' }).listAllAccounts).toBe(true)
    expect(buildListQueryApiFilters({ kind: 'admins' }).listAllAccounts).toBeUndefined()
    expect(buildListQueryApiFilters({ kind: 'all', role: 'INDIVIDUAL' }).listAllAccounts).toBe(true)
  })

  it('전체 탭 — 검색·가입일·회원 유형을 디렉터리 필터에 넣는다', () => {
    const api = buildListQueryApiFilters({
      kind: 'all',
      search: '김교사',
      role: 'INSTRUCTOR',
      createdAtFrom: '2026-03-01',
      createdAtTo: '2026-03-31',
    })
    expect(api.listAllAccounts).toBe(true)
    expect(api.search).toBe('김교사')
    expect(api.role).toBeUndefined()
    expect(api.allTabRoleFilter).toBe('INSTRUCTOR')
    expect(api.accountType).toBe('MEMBER')
    expect(api.rolesExactAnyOf).toBeUndefined()
    expect(api.createdAtFrom).toBe('2026-03-01')
    expect(api.createdAtTo).toBe('2026-03-31')
  })

  it('전체 탭 — 학교(교사)·겸직·권한박탈·관리자 유형을 allTabRoleFilter로 넣는다', () => {
    expect(buildListQueryApiFilters({ kind: 'all', role: 'SCHOOL_TEACHER' })).toMatchObject({
      listAllAccounts: true,
      allTabRoleFilter: 'SCHOOL_TEACHER',
      accountType: 'MEMBER',
    })
    expect(buildListQueryApiFilters({ kind: 'all', role: 'INSTRUCTOR_DUAL' })).toMatchObject({
      listAllAccounts: true,
      allTabRoleFilter: 'INSTRUCTOR_DUAL',
      accountType: 'MEMBER',
    })
    expect(buildListQueryApiFilters({ kind: 'all', role: 'INSTRUCTOR_REVOKED' })).toMatchObject({
      listAllAccounts: true,
      allTabRoleFilter: 'INSTRUCTOR_REVOKED',
      accountType: 'MEMBER',
    })
    expect(buildListQueryApiFilters({ kind: 'all', role: 'ADMIN' })).toMatchObject({
      listAllAccounts: true,
      allTabRoleFilter: 'ADMIN',
      accountType: 'ADMIN_ACCOUNT',
    })
  })
})

describe('pendingRoleFromParams', () => {
  it('전체 탭은 role 쿼리로 회원 유형 필터를 복원한다', () => {
    expect(pendingRoleFromParams({ kind: 'all' })).toBe('ALL')
    expect(pendingRoleFromParams({ kind: 'all', role: 'INDIVIDUAL' })).toBe('INDIVIDUAL')
    expect(pendingRoleFromParams({ kind: 'all', role: 'ADMIN' })).toBe('ADMIN')
    expect(pendingRoleFromParams({ kind: 'all', role: 'SCHOOL_TEACHER' })).toBe('SCHOOL_TEACHER')
    expect(pendingRoleFromParams({ kind: 'all', role: 'INSTRUCTOR_DUAL' })).toBe('INSTRUCTOR_DUAL')
    expect(pendingRoleFromParams({ kind: 'all', role: 'INSTRUCTOR_REVOKED' })).toBe(
      'INSTRUCTOR_REVOKED'
    )
  })

  it('전용 탭은 kind가 회원 유형을 결정한다', () => {
    expect(pendingRoleFromParams({ kind: 'instructors', role: 'INDIVIDUAL' })).toBe('INSTRUCTOR')
  })
})

describe('applyUserListSearchToParams', () => {
  it('전체 회원 목록에서 회원 유형 필터는 kind를 바꾸지 않고 role만 넣는다', () => {
    const params = new URLSearchParams('kind=all')
    applyUserListSearchToParams(params, {
      search: '홍길동',
      role: 'INDIVIDUAL',
      institutionSido: '',
      institutionSigungu: '',
      jaEvaluationGrade: '',
      settlementStatus: '',
      adminPermissionVariant: '',
      createdAtRange: null,
    })
    expect(params.get('kind')).toBe('all')
    expect(params.get('role')).toBe('INDIVIDUAL')
    expect(params.get('search')).toBe('홍길동')
  })

  it('전체 회원 목록에서 학교(교사) 유형은 kind=all&role=SCHOOL_TEACHER 로 남긴다', () => {
    const params = new URLSearchParams('kind=all')
    applyUserListSearchToParams(params, {
      search: '',
      role: 'SCHOOL_TEACHER',
      institutionSido: '',
      institutionSigungu: '',
      jaEvaluationGrade: '',
      settlementStatus: '',
      adminPermissionVariant: '',
      createdAtRange: null,
    })
    expect(params.get('kind')).toBe('all')
    expect(params.get('role')).toBe('SCHOOL_TEACHER')
  })

  it('전체 회원 목록에서 유형 전체가 되면 role 쿼리를 제거한다', () => {
    const params = new URLSearchParams('kind=all&role=INSTRUCTOR')
    applyUserListSearchToParams(params, {
      search: '',
      role: 'ALL',
      institutionSido: '',
      institutionSigungu: '',
      jaEvaluationGrade: '',
      settlementStatus: '',
      adminPermissionVariant: '',
      createdAtRange: null,
    })
    expect(params.get('kind')).toBe('all')
    expect(params.get('role')).toBeNull()
  })
})
