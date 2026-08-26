import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SHORTCUT_ITEMS } from '../model/dashboard-settings-store'

const seedPayload = JSON.parse(
  readFileSync(
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../docs/api/dashboard-settings-seed.payload.json'
    ),
    'utf8'
  )
) as {
  layout: {
    orderedWidgetIds: string[]
    widgetWidths: Record<string, number>
  }
  settings: {
    shortcutVisibility: Record<string, boolean>
    widgetProgramFilters: Record<string, string[]>
  }
  shortcutCatalog: Array<{ shortcutKey: string; useYn: boolean }>
}

describe('dashboard settings seed payload', () => {
  it('shortcutVisibility keys match SHORTCUT_ITEMS and are all enabled', () => {
    const expected = Object.fromEntries(SHORTCUT_ITEMS.map(item => [item.id, true]))
    expect(seedPayload.settings.shortcutVisibility).toEqual(expected)
  })

  it('shortcut catalog keys cover SHORTCUT_ITEMS with useYn true', () => {
    const catalogKeys = seedPayload.shortcutCatalog.map(item => item.shortcutKey)
    expect(catalogKeys).toEqual(SHORTCUT_ITEMS.map(item => item.id))
    expect(seedPayload.shortcutCatalog.every(item => item.useYn)).toBe(true)
  })

  it('default MASTER layout is full-width mock home widgets', () => {
    expect(seedPayload.layout.orderedWidgetIds).toEqual([
      'menu-shortcut-widget',
      'program-schedule-general-widget',
      'recruitment-status-widget',
      'customer-inquiry-status-widget',
      'kpi-achievement-widget',
    ])
    expect(seedPayload.settings.widgetProgramFilters).toEqual({})
    expect(Object.values(seedPayload.layout.widgetWidths).every(width => width === 24)).toBe(true)
  })
})
