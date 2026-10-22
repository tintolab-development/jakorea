/**
 * 대시보드 바로가기 — BE 카탈로그·preferences 계약 (설정 비활성 6건).
 * 라벨·URL·순서는 GET /api/admin/dashboard/shortcuts 정본.
 */

export const DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS = [
  'admin-permission-settings',
  'program-permission-settings',
  'member-login-history',
  'file-download-history',
  'privacy-query-history',
  'bug-issue-history',
] as const

export type DashboardSettingsDisabledShortcutKey =
  (typeof DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS)[number]

const SETTINGS_DISABLED_SET = new Set<string>(DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS)

export function isDashboardShortcutSettingsDisabled(shortcutKey: string): boolean {
  return SETTINGS_DISABLED_SET.has(shortcutKey)
}

export function isShortcutItemEnabled(
  shortcutEnabled: Record<string, boolean>,
  id: string
): boolean {
  return shortcutEnabled[id] !== false
}

/** preferences GET/PUT 응답 — disabled 6건 fail-closed */
export function normalizeShortcutVisibilityFromServer(
  server: Record<string, boolean>
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(server)) {
    if (typeof value !== 'boolean') continue
    next[key] = isDashboardShortcutSettingsDisabled(key) ? false : value
  }
  for (const key of DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(server, key)) {
      next[key] = false
    }
  }
  return next
}

/** 카탈로그 로드 후 visibility를 catalog shortcutKey만 유지 */
export function restrictShortcutVisibilityToCatalog(
  visibility: Record<string, boolean>,
  catalogKeys: readonly string[]
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const key of catalogKeys) {
    next[key] = isDashboardShortcutSettingsDisabled(key) ? false : visibility[key] !== false
  }
  return next
}

/** PUT settings.shortcutVisibility — catalog 키만, disabled 6건 항상 false */
export function buildShortcutVisibilityForSave(
  visibility: Record<string, boolean>,
  catalogKeys: readonly string[]
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const key of catalogKeys) {
    if (isDashboardShortcutSettingsDisabled(key)) {
      next[key] = false
      continue
    }
    next[key] = visibility[key] !== false
  }
  return next
}
