/**
 * 대시보드 개인화 설정 ↔ API DTO (zustand persist 구조와 동일)
 */
import type { DashboardPreferencesResponse } from '@/shared/api/generated/dashboard/schemas/dashboardPreferencesResponse'
import type { DashboardPreferencesSaveRequest } from '@/shared/api/generated/dashboard/schemas/dashboardPreferencesSaveRequest'
import { useDashboardSettingsStore } from '@/features/dashboard/model/dashboard-settings-store'
import { useDashboardWidgetOrderStore } from '@/features/dashboard/model/dashboard-widget-order-store'

const SETTINGS_PERSIST_VERSION = 2
const WIDGET_ORDER_PERSIST_VERSION = 5

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function asStringRecord(value: unknown): Record<string, boolean> {
  const o = asRecord(value)
  if (!o) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'boolean') out[k] = v
  }
  return out
}

function asNumberRecord(value: unknown): Record<string, number> {
  const o = asRecord(value)
  if (!o) return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'number') out[k] = v
  }
  return out
}

function asStringArrayRecord(value: unknown): Record<string, string[]> {
  const o = asRecord(value)
  if (!o) return {}
  const out: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v) && v.every(item => typeof item === 'string')) {
      out[k] = v
    }
  }
  return out
}

function asOrderByRole(value: unknown): Record<string, string[]> {
  const o = asRecord(value)
  if (!o) return {}
  const out: Record<string, string[]> = {}
  for (const [role, ids] of Object.entries(o)) {
    if (Array.isArray(ids) && ids.every(id => typeof id === 'string')) {
      out[role] = ids
    }
  }
  return out
}

function asWidthByRole(value: unknown): Record<string, Record<string, 12 | 24>> {
  const o = asRecord(value)
  if (!o) return {}
  const out: Record<string, Record<string, 12 | 24>> = {}
  for (const [role, widths] of Object.entries(o)) {
    const w = asRecord(widths)
    if (!w) continue
    const mapped: Record<string, 12 | 24> = {}
    for (const [widgetId, col] of Object.entries(w)) {
      if (col === 12 || col === 24) mapped[widgetId] = col
    }
    out[role] = mapped
  }
  return out
}

export function buildDashboardPreferencesSaveRequest(): DashboardPreferencesSaveRequest {
  const settings = useDashboardSettingsStore.getState()
  const layout = useDashboardWidgetOrderStore.getState()

  return {
    dashboardSettings: {
      state: {
        shortcutEnabled: settings.shortcutEnabled,
        shortcutBadgeCounts: settings.shortcutBadgeCounts,
        widgetProgramIds: settings.widgetProgramIds,
        inquiryNotificationReadProgramKeys: settings.inquiryNotificationReadProgramKeys,
      },
      version: SETTINGS_PERSIST_VERSION,
    },
    dashboardWidgetOrder: {
      state: {
        orderByRole: layout.orderByRole,
        widthByRole: layout.widthByRole,
      },
      version: WIDGET_ORDER_PERSIST_VERSION,
    },
  }
}

export function applyDashboardPreferencesResponse(dto: DashboardPreferencesResponse): void {
  const settingsState = asRecord(dto.dashboardSettings?.state)
  if (settingsState) {
    useDashboardSettingsStore.setState({
      shortcutEnabled: {
        ...useDashboardSettingsStore.getState().shortcutEnabled,
        ...asStringRecord(settingsState.shortcutEnabled),
      },
      shortcutBadgeCounts: {
        ...useDashboardSettingsStore.getState().shortcutBadgeCounts,
        ...asNumberRecord(settingsState.shortcutBadgeCounts),
      },
      widgetProgramIds: {
        ...useDashboardSettingsStore.getState().widgetProgramIds,
        ...asStringArrayRecord(settingsState.widgetProgramIds),
      },
      inquiryNotificationReadProgramKeys: {
        ...useDashboardSettingsStore.getState().inquiryNotificationReadProgramKeys,
        ...asStringRecord(settingsState.inquiryNotificationReadProgramKeys),
      },
    })
  }

  const orderState = asRecord(dto.dashboardWidgetOrder?.state)
  if (orderState) {
    useDashboardWidgetOrderStore.setState({
      orderByRole: {
        ...useDashboardWidgetOrderStore.getState().orderByRole,
        ...asOrderByRole(orderState.orderByRole),
      },
      widthByRole: {
        ...useDashboardWidgetOrderStore.getState().widthByRole,
        ...asWidthByRole(orderState.widthByRole),
      },
    })
  }
}
