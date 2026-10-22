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

describe('dashboard shortcut contract', () => {
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
