import { describe, expect, it } from 'vitest'
import { applyAdminMeToSessionUser, normalizeAdminDate } from './apply-admin-me-to-session-user'
import type { User } from '@/types/user'

const current: Omit<User, 'password'> = {
  id: 'social-sso-pending',
  email: '',
  name: '관리자',
  role: 'ADMIN',
  roleCode: 'VIEWER',
  adminLevel: 'GENERAL',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('applyAdminMeToSessionUser', () => {
  it('관리자 날짜는 유효한 ISO-8601 원본을 그대로 유지한다', () => {
    expect(normalizeAdminDate('2026-10-16T08:00:00Z')).toBe('2026-10-16T08:00:00Z')
    expect(normalizeAdminDate('2026-10-16T08:00:00.123Z')).toBe('2026-10-16T08:00:00.123Z')
  })

  it('null·빈 값·잘못된 값·숫자 timestamp는 null로 처리한다', () => {
    expect(normalizeAdminDate(null)).toBeNull()
    expect(normalizeAdminDate('')).toBeNull()
    expect(normalizeAdminDate('not-a-date')).toBeNull()
    expect(normalizeAdminDate('2026-02-30T08:00:00Z')).toBeNull()
    expect(normalizeAdminDate(1792137600000 as unknown as string)).toBeNull()
  })

  it('GET /api/admin/me의 null·빈 createdAt·updatedAt는 기존 세션 날짜로 fallback하지 않는다', () => {
    const emptyDates = applyAdminMeToSessionUser(current, {
      createdAt: '',
      updatedAt: '',
    })
    const nullDates = applyAdminMeToSessionUser(current, {
      createdAt: null,
      updatedAt: null,
    } as unknown as import('@/shared/api/generated/members/schemas/adminMeResponse').AdminMeResponse)

    expect(emptyDates.createdAt).toBeNull()
    expect(emptyDates.updatedAt).toBeNull()
    expect(nullDates.createdAt).toBeNull()
    expect(nullDates.updatedAt).toBeNull()
  })

  it('GET /api/admin/me에 createdAt·updatedAt가 없으면 기존 세션 날짜를 유지한다', () => {
    const next = applyAdminMeToSessionUser(current, {
      uuid: 'admin-uuid',
      email: 'pm@jakorea.org',
    })
    expect(next.createdAt).toBe(current.createdAt)
    expect(next.updatedAt).toBe(current.updatedAt)
  })

  it('GET /api/admin/me roleCode를 세션에 반영하고 MASTER로 올리지 않는다', () => {
    const next = applyAdminMeToSessionUser(current, {
      uuid: 'admin-uuid',
      email: 'pm@jakorea.org',
      name: 'PM관리',
      roleCode: 'PM',
      permissionCodes: ['dashboard.view'],
    })
    expect(next.roleCode).toBe('PM')
    expect(next.adminLevel).toBe('ADMIN')
    expect(next.listMetrics?.adminPermissionVariant).toBe('partner')
    expect(next.email).toBe('pm@jakorea.org')
    expect(next.permissionCodes).toEqual(['dashboard.view'])
  })

  it('VIEWER는 GENERAL로 매핑한다', () => {
    const next = applyAdminMeToSessionUser(current, { roleCode: 'VIEWER' })
    expect(next.roleCode).toBe('VIEWER')
    expect(next.adminLevel).toBe('GENERAL')
    expect(next.listMetrics?.adminPermissionVariant).toBe('viewer')
  })

  it('MASTER roleCode는 마스터 권한 유형으로 반영한다', () => {
    const next = applyAdminMeToSessionUser(current, { roleCode: 'MASTER' })
    expect(next.roleCode).toBe('MASTER')
    expect(next.listMetrics?.adminPermissionVariant).toBe('manager')
  })

  it('gender·birthDate를 세션에 반영한다', () => {
    const next = applyAdminMeToSessionUser(current, {
      gender: 'FEMALE',
      birthDate: '1990-09-15',
    })
    expect(next.gender).toBe('F')
    expect(next.birthDate).toBe('1990-09-15')
  })

  it('약관과 담당 프로그램 수를 GET /api/admin/me 응답에서 반영한다', () => {
    const next = applyAdminMeToSessionUser(current, {
      activeManagedProgramCount: 2,
      totalManagedProgramCount: 5,
      termsAgreements: [
        {
          consentType: 'MARKETING',
          version: '1.0',
          required: false,
          agreed: false,
          agreedAt: undefined,
        },
      ],
    })

    expect(next.listMetrics?.managedProgramInProgressCount).toBe(2)
    expect(next.listMetrics?.managedProgramCount).toBe(5)
    expect(next.termsAgreements).toEqual([
      {
        termsType: 'MARKETING',
        termsVersion: '1.0',
        required: false,
        agreed: false,
        agreedAt: undefined,
        sourceFlow: undefined,
      },
    ])
  })
})
