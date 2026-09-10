import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  SHORTCUT_ITEMS,
  buildDefaultShortcutEnabled,
} from '../model/dashboard-settings-store'

const seedPayload = JSON.parse(
  readFileSync(
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../docs/api/dashboard-settings-seed.payload.json'
    ),
    'utf8'
  )
) as {
  assignedProgramTypes?: string[]
  layout: {
    orderedWidgetIds: string[]
    widgetWidths: Record<string, number>
  }
  settings: {
    shortcutVisibility: Record<string, boolean>
    widgetProgramFilters: Record<string, string[]>
  }
  shortcutCatalog: Array<{ shortcutKey: string; useYn: boolean }>
  settingsDisabledShortcutKeys: string[]
}

describe('dashboard settings seed payload', () => {
  it('shortcutVisibility keys match SHORTCUT_ITEMS defaults', () => {
    expect(seedPayload.settings.shortcutVisibility).toEqual(buildDefaultShortcutEnabled())
  })

  it('shortcut catalog keys cover SHORTCUT_ITEMS with useYn true', () => {
    const catalogKeys = seedPayload.shortcutCatalog.map(item => item.shortcutKey)
    expect(catalogKeys).toEqual(SHORTCUT_ITEMS.map(item => item.id))
    expect(seedPayload.shortcutCatalog.every(item => item.useYn)).toBe(true)
  })

  it('settingsDisabled keys match SHORTCUT_ITEMS.settingsDisabled', () => {
    const expected = SHORTCUT_ITEMS.filter(item => item.settingsDisabled).map(item => item.id)
    expect(seedPayload.settingsDisabledShortcutKeys).toEqual(expected)
  })

  it('default MASTER layout is full-width home widgets including assigned schedule types', () => {
    expect(seedPayload.assignedProgramTypes).toEqual([
      'general',
      'company_school',
      'ujat',
      'gemini',
    ])
    expect(seedPayload.layout.orderedWidgetIds).toEqual([
      'menu-shortcut-widget',
      'program-schedule-general-widget',
      'program-schedule-company-school-widget',
      'program-schedule-ujat-widget',
      'program-schedule-gemini-widget',
      'recruitment-status-widget',
      'customer-inquiry-status-widget',
      'kpi-achievement-widget',
    ])
    expect(seedPayload.settings.widgetProgramFilters).toEqual({})
    expect(Object.values(seedPayload.layout.widgetWidths).every(width => width === 24)).toBe(true)
  })
})
