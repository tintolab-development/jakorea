import { describe, expect, it } from 'vitest'
import {
  buildShortcutVisibilityForSave,
  normalizeShortcutVisibilityFromServer,
  restrictShortcutVisibilityToCatalog,
} from './dashboard-shortcut-contract'

const CATALOG = [
  'programs-general-education',
  'admin-permission-settings',
  'notices',
  'member-login-history',
] as const

/** OpenAPI dashboardShortcutBadgesResponseCounts — FE는 재집계하지 않고 BE 이 매핑을 대조한다. */
const SHORTCUT_BADGE_DOMAIN_LIST = {
  'programs-general-education': { path: '/api/admin/programs', programType: 'GENERAL' },
  'programs-economy': { path: '/api/admin/programs', programType: 'COMPANY_SCHOOL' },
  'programs-ujat': { path: '/api/admin/programs', programType: 'UJAT' },
  'programs-gemini': { path: '/api/admin/programs', programType: 'GEMINI' },
  'programs-detail': { path: '/api/admin/programs', programType: null },
  'users-all': { path: '/api/admin/users', programType: null },
  'users-school': { path: '/api/admin/users', role: 'TEACHER' },
  'users-instructor': { path: '/api/admin/users', role: 'INSTRUCTOR' },
  'users-admin': { path: '/api/admin/admin-accounts', programType: null },
} as const

describe('dashboard shortcut contract', () => {
  it('바로가기 배지 키는 유형별 목록 API와 1:1이며 전체 programCount 복제가 아니다', () => {
    const programKeys = [
      'programs-general-education',
      'programs-economy',
      'programs-ujat',
      'programs-gemini',
    ] as const
    const types = programKeys.map(key => SHORTCUT_BADGE_DOMAIN_LIST[key].programType)
    expect(new Set(types).size).toBe(programKeys.length)
    expect(SHORTCUT_BADGE_DOMAIN_LIST['programs-detail'].programType).toBeNull()
  })

  it('normalizeShortcutVisibilityFromServer forces disabled keys to false', () => {
    const out = normalizeShortcutVisibilityFromServer({
      notices: true,
      'admin-permission-settings': true,
      'member-login-history': true,
    })
    expect(out.notices).toBe(true)
    expect(out['admin-permission-settings']).toBe(false)
    expect(out['member-login-history']).toBe(false)
  })

  it('restrictShortcutVisibilityToCatalog keeps only catalog keys', () => {
    const out = restrictShortcutVisibilityToCatalog(
      { notices: false, 'unknown-key': true, 'programs-general-education': true },
      CATALOG
    )
    expect(out).toEqual({
      'programs-general-education': true,
      'admin-permission-settings': false,
      notices: false,
      'member-login-history': false,
    })
    expect(out).not.toHaveProperty('unknown-key')
  })

  it('buildShortcutVisibilityForSave never sends disabled keys as true', () => {
    const out = buildShortcutVisibilityForSave(
      {
        notices: true,
        'admin-permission-settings': true,
        'programs-general-education': false,
      },
      CATALOG
    )
    expect(out['admin-permission-settings']).toBe(false)
    expect(out['member-login-history']).toBe(false)
    expect(out.notices).toBe(true)
    expect(out['programs-general-education']).toBe(false)
  })
})
