/**
 * Me 대시보드 preferences ↔ zustand persist 구조
 */
import type { DashboardMePreferencesRequest } from '@/shared/api/generated/dashboard/schemas/dashboardMePreferencesRequest'
import type { DashboardMePreferencesResponse } from '@/shared/api/generated/dashboard/schemas/dashboardMePreferencesResponse'
import { parseAssignedProgramTypes } from '@/data/mock/program-schedule-keys'
import { useDashboardSettingsStore } from '@/features/dashboard/model/dashboard-settings-store'
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
  if (Object.prototype.hasOwnProperty.call(dto, 'assignedProgramTypes')) {
    useDashboardSettingsStore
      .getState()
      .setAssignedProgramTypes(parseAssignedProgramTypes(dto.assignedProgramTypes))
  }

  const settings = dto.settings
  if (settings) {
    useDashboardSettingsStore.setState(state => ({
      shortcutEnabled: {
        ...state.shortcutEnabled,
        ...asBooleanRecord(settings.shortcutVisibility),
      },
      widgetProgramIds: settings.widgetProgramFilters
        ? asStringArrayRecord(settings.widgetProgramFilters)
        : state.widgetProgramIds,
      inquiryNotificationReadProgramKeys: {
        ...state.inquiryNotificationReadProgramKeys,
        ...asBooleanRecord(settings.inquiryRowRead),
      },
    }))
  }

  const layout = dto.layout
  if (layout) {
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
