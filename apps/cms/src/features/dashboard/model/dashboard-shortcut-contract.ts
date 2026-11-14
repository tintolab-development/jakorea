/**
 * 대시보드 바로가기 — BE 카탈로그·preferences 계약 (설정 비활성 6건).
 * 라벨·URL·순서는 GET /api/admin/dashboard/shortcuts 정본.
 * 6건은 마스터 세션에서만 설정할 수 있다(기획 확정 2026-11-14). 마스터의 활성 여부는 BE permissionAllowed로만 판정한다.
 */

/** 마스터 세션 여부 — 계약 함수는 세션을 직접 읽지 않고 호출부에서 받는다 */
export interface DashboardShortcutSessionOptions {
  isMaster?: boolean
}

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

export function isDashboardShortcutSettingsDisabled(
  shortcutKey: string,
  options?: DashboardShortcutSessionOptions
): boolean {
  if (options?.isMaster === true) return false
  return SETTINGS_DISABLED_SET.has(shortcutKey)
}

export function isShortcutItemEnabled(
  shortcutEnabled: Record<string, boolean>,
  id: string
): boolean {
  return shortcutEnabled[id] !== false
}

/** preferences GET/PUT 응답 — disabled 6건 fail-closed(마스터 제외) */
export function normalizeShortcutVisibilityFromServer(
  server: Record<string, boolean>,
  options?: DashboardShortcutSessionOptions
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(server)) {
    if (typeof value !== 'boolean') continue
    next[key] = isDashboardShortcutSettingsDisabled(key, options) ? false : value
  }
  if (options?.isMaster !== true) {
    for (const key of DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS) {
      if (Object.prototype.hasOwnProperty.call(server, key)) {
        next[key] = false
      }
    }
  }
  return next
}

/** 카탈로그 로드 후 visibility를 catalog shortcutKey만 유지 */
export function restrictShortcutVisibilityToCatalog(
  visibility: Record<string, boolean>,
  catalogKeys: readonly string[],
  options?: DashboardShortcutSessionOptions
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const key of catalogKeys) {
    next[key] = isDashboardShortcutSettingsDisabled(key, options)
      ? false
      : visibility[key] !== false
  }
  return next
}

/** PUT settings.shortcutVisibility — catalog 키만, disabled 6건 항상 false(마스터 제외) */
export function buildShortcutVisibilityForSave(
  visibility: Record<string, boolean>,
  catalogKeys: readonly string[],
  options?: DashboardShortcutSessionOptions
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const key of catalogKeys) {
    if (isDashboardShortcutSettingsDisabled(key, options)) {
      next[key] = false
      continue
    }
    next[key] = visibility[key] !== false
  }
  return next
}
