/**
 * Me 대시보드 preferences ↔ zustand persist 구조
 */
import type { DashboardMePreferencesRequest } from '@/shared/api/generated/dashboard/schemas/dashboardMePreferencesRequest'
import type { DashboardMePreferencesResponse } from '@/shared/api/generated/dashboard/schemas/dashboardMePreferencesResponse'
import { useDashboardSettingsStore } from '@/features/dashboard/model/dashboard-settings-store'
import { useDashboardWidgetOrderStore } from '@/features/dashboard/model/dashboard-widget-order-store'
import type { UserRole } from '@/types/user'

const ME_SCHEMA_VERSION = 1

let cachedRevision: number | undefined

export function getCachedMePreferencesRevision(): number | undefined {
  return cachedRevision
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
    if (Array.isArray(v) && v.every(item => typeof item === 'string')) out[k] = v
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

export function buildMeDashboardPreferencesRequest(role: UserRole): DashboardMePreferencesRequest {
  const settings = useDashboardSettingsStore.getState()
  const layout = useDashboardWidgetOrderStore.getState()

  return {
    schemaVersion: ME_SCHEMA_VERSION,
    role,
    revision: cachedRevision,
    layout: {
      orderedWidgetIds: layout.orderByRole[role] ?? [],
      widgetWidths: layout.widthByRole[role] ?? {},
    },
    settings: {
      shortcutVisibility: settings.shortcutEnabled,
      widgetProgramFilters: settings.widgetProgramIds,
      inquiryRowRead: settings.inquiryNotificationReadProgramKeys,
    },
  }
}

export function applyMeDashboardPreferencesResponse(
  dto: DashboardMePreferencesResponse,
  role: UserRole
): void {
  cachedRevision = dto.revision

  const settings = dto.settings
  if (settings) {
    useDashboardSettingsStore.setState(state => ({
      shortcutEnabled: {
        ...state.shortcutEnabled,
        ...asBooleanRecord(settings.shortcutVisibility),
      },
      widgetProgramIds: {
        ...state.widgetProgramIds,
        ...asStringArrayRecord(settings.widgetProgramFilters),
      },
      inquiryNotificationReadProgramKeys: {
        ...state.inquiryNotificationReadProgramKeys,
        ...asBooleanRecord(settings.inquiryRowRead),
      },
    }))
  }

  const layout = dto.layout
  if (layout) {
    const orderedWidgetIds = layout.orderedWidgetIds ?? []
    const widgetWidths = asWidgetWidths(layout.widgetWidths)
    useDashboardWidgetOrderStore.setState(state => ({
      orderByRole: {
        ...state.orderByRole,
        [role]: orderedWidgetIds,
      },
      widthByRole: {
        ...state.widthByRole,
        [role]: {
          ...(state.widthByRole[role] ?? {}),
          ...widgetWidths,
        },
      },
    }))
  }
}
