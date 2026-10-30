/** LNB selectedKeys 보조: 메뉴에 없는 하위 경로(예: /programs/general/enrollment)를 가장 가까운 메뉴 경로 키로 매핑 */

type MenuItemLike = { key?: unknown; children?: unknown } | null | undefined

/** antd Menu items 트리에서 경로형('/'로 시작) 키만 수집 */
export function collectMenuRouteKeys(items: readonly MenuItemLike[] | undefined): string[] {
  const keys: string[] = []
  const walk = (list: readonly MenuItemLike[] | undefined) => {
    if (!list) return
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      if (typeof item.key === 'string' && item.key.startsWith('/')) keys.push(item.key)
      if (Array.isArray(item.children)) walk(item.children as MenuItemLike[])
    }
  }
  walk(items)
  return keys
}

/**
 * 경로와 정확히 같은 메뉴 키가 있으면 그대로, 없으면 `${key}/` 로 시작하는 가장 긴 메뉴 키.
 * 매칭되는 키가 없으면 원래 경로를 반환(기존 동작 유지). 루트 '/'는 접두 매칭하지 않음.
 */
export function resolveSidebarSelectedKey(path: string, menuRouteKeys: readonly string[]): string {
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path
  if (menuRouteKeys.includes(normalized)) return normalized
  let best: string | null = null
  for (const key of menuRouteKeys) {
    if (key === '/' || !normalized.startsWith(`${key}/`)) continue
    if (!best || key.length > best.length) best = key
  }
  return best ?? path
}
