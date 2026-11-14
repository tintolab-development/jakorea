/**
 * Me 대시보드 preferences ↔ zustand persist 구조
 */
import type { DashboardMePreferencesRequest } from '@/shared/api/generated/dashboard/schemas/dashboardMePreferencesRequest'
import type { DashboardMePreferencesResponse } from '@/shared/api/generated/dashboard/schemas/dashboardMePreferencesResponse'
import { parseAssignedProgramTypes } from '@/features/dashboard/model/program-schedule-keys'
import { sessionDashboardShortcutOptions } from '@/features/dashboard/lib/dashboard-shortcut-master'
import {
  normalizeShortcutVisibilityFromServer,
  restrictShortcutVisibilityToCatalog,
} from '@/features/dashboard/model/dashboard-shortcut-contract'
import {
  normalizeShortcutVisibilityForSave,
  useDashboardSettingsStore,
} from '@/features/dashboard/model/dashboard-settings-store'
import {
  stripRemovedDashboardWidgetIds,
  stripRemovedDashboardWidgetWidths,
  useDashboardWidgetOrderStore,
} from '@/features/dashboard/model/dashboard-widget-order-store'
import type { UserRole } from '@/types/user'

const ME_SCHEMA_VERSION = 1

let cachedRevision: number | undefined

export function getCachedMePreferencesRevision(): number | undefined {
  return cachedRevision
}

/** 409 재시도 시 GET layout을 덮어쓰지 않고 revision만 갱신 */
export function setCachedMePreferencesRevision(revision: number | undefined): void {
  cachedRevision = revision
}

function asBooleanRecord(value: unknown): Record<string, boolean> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'boolean') out[k] = v
  }
  return out
}

function asStringArrayRecord(value: unknown): Record<string, string[]> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(value)) {
    if (!Array.isArray(v)) continue
    if (v.every(item => typeof item === 'string' || typeof item === 'number')) {
      out[k] = v.map(item => String(item))
    }
  }
  return out
}

function asWidgetWidths(value: unknown): Record<string, 12 | 24> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, 12 | 24> = {}
  for (const [k, v] of Object.entries(value)) {
    if (v === 12 || v === 24) out[k] = v
  }
  return out
}

export function buildMeDashboardPreferencesRequest(
  layoutRole: UserRole,
  requestRole: string = layoutRole
): DashboardMePreferencesRequest {
  const settings = useDashboardSettingsStore.getState()
  const layout = useDashboardWidgetOrderStore.getState()

  return {
    schemaVersion: ME_SCHEMA_VERSION,
    role: requestRole,
    revision: cachedRevision,
    layout: {
      orderedWidgetIds: layout.orderByRole[layoutRole] ?? [],
      widgetWidths: layout.widthByRole[layoutRole] ?? {},
    },
    settings: {
      shortcutVisibility: normalizeShortcutVisibilityForSave(
        settings.shortcutEnabled,
        settings.shortcutCatalogKeys
      ),
      widgetProgramFilters: settings.widgetProgramIds,
      inquiryRowRead: settings.inquiryNotificationReadProgramKeys,
    },
  }
}

export function fingerprintMePreferencesRequest(body: DashboardMePreferencesRequest): string {
  const widths = body.layout?.widgetWidths ?? {}
  const sortedWidths: Record<string, unknown> = {}
  for (const key of Object.keys(widths).sort()) {
    sortedWidths[key] = widths[key]
  }
  const shortcutVisibility = body.settings?.shortcutVisibility ?? {}
  const sortedShortcut: Record<string, unknown> = {}
  for (const key of Object.keys(shortcutVisibility).sort()) {
    sortedShortcut[key] = shortcutVisibility[key]
  }
  const filters = body.settings?.widgetProgramFilters ?? {}
  const sortedFilters: Record<string, unknown> = {}
  for (const key of Object.keys(filters).sort()) {
    const value = filters[key]
    sortedFilters[key] = Array.isArray(value) ? [...value].map(String).sort() : value
  }
  const inquiry = body.settings?.inquiryRowRead ?? {}
  const sortedInquiry: Record<string, unknown> = {}
  for (const key of Object.keys(inquiry).sort()) {
    sortedInquiry[key] = inquiry[key]
  }
  return JSON.stringify({
    orderedWidgetIds: body.layout?.orderedWidgetIds ?? [],
    widgetWidths: sortedWidths,
    shortcutVisibility: sortedShortcut,
    widgetProgramFilters: sortedFilters,
    inquiryRowRead: sortedInquiry,
  })
}

export function fingerprintMePreferencesClient(
  layoutRole: UserRole,
  requestRole: string = layoutRole
): string {
  return fingerprintMePreferencesRequest(
    buildMeDashboardPreferencesRequest(layoutRole, requestRole)
  )
}

export function shouldApplyPreferencesSaveToClient(
  sentFingerprint: string,
  currentFingerprint: string
): boolean {
  return sentFingerprint === currentFingerprint
}

export interface ApplyMeDashboardPreferencesOptions {
  applyLayout?: boolean
  applySettings?: boolean
}

export function applyMeDashboardPreferencesResponse(
  dto: DashboardMePreferencesResponse,
  role: UserRole,
  options?: ApplyMeDashboardPreferencesOptions
): void {
  cachedRevision = dto.revision
  if (Object.prototype.hasOwnProperty.call(dto, 'assignedProgramTypes')) {
    useDashboardSettingsStore
      .getState()
      .setAssignedProgramTypes(parseAssignedProgramTypes(dto.assignedProgramTypes))
  }

  const applySettings = options?.applySettings !== false
  const applyLayout = options?.applyLayout !== false

  const settings = dto.settings
  if (applySettings && settings) {
    const serverShortcutVisibility = asBooleanRecord(settings.shortcutVisibility)
    useDashboardSettingsStore.setState(state => {
      const shortcutSession = sessionDashboardShortcutOptions()
      const normalized = normalizeShortcutVisibilityFromServer(serverShortcutVisibility, shortcutSession)
      const catalogKeys = state.shortcutCatalogKeys
      const shortcutEnabled =
        catalogKeys != null && catalogKeys.length > 0
          ? restrictShortcutVisibilityToCatalog(normalized, catalogKeys, shortcutSession)
          : normalized
      return {
        shortcutEnabled,
        widgetProgramIds: settings.widgetProgramFilters
          ? asStringArrayRecord(settings.widgetProgramFilters)
          : state.widgetProgramIds,
        inquiryNotificationReadProgramKeys: {
          ...state.inquiryNotificationReadProgramKeys,
          ...asBooleanRecord(settings.inquiryRowRead),
        },
      }
    })
  }

  const layout = dto.layout
  if (applyLayout && layout) {
    const orderedWidgetIds = stripRemovedDashboardWidgetIds(layout.orderedWidgetIds ?? [])
    const widgetWidths = stripRemovedDashboardWidgetWidths(asWidgetWidths(layout.widgetWidths)) ?? {}
    useDashboardWidgetOrderStore.setState(state => ({
      orderByRole: {
        ...state.orderByRole,
        [role]: orderedWidgetIds,
      },
      widthByRole: {
        ...state.widthByRole,
        [role]: stripRemovedDashboardWidgetWidths({
          ...(state.widthByRole[role] ?? {}),
          ...widgetWidths,
        }) ?? {},
      },
    }))
  }
}
