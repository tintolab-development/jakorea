import {
  gnbFallbackGroups,
  isKnownGnbGroupCode,
  isKnownGnbMenuCode,
  GNB_MENU_ROUTES,
  GNB_DESIGN_GROUP_LABEL_OVERRIDES,
  GNB_DESIGN_LABEL_OVERRIDES,
  type GnbNavGroup,
  type GnbNavItem,
} from './menu-routes.ts'

export type SiteGnbView = {
  source: 'fallback' | 'remote'
  groups: readonly GnbNavGroup[]
}

export const SITE_GNB_FALLBACK: SiteGnbView = {
  source: 'fallback',
  groups: gnbFallbackGroups,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function readOrder(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER
}

function sortByDisplayOrder<T extends { displayOrder?: unknown }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const order = readOrder(a.item.displayOrder) - readOrder(b.item.displayOrder)
      if (order !== 0) return order
      return a.index - b.index
    })
    .map(entry => entry.item)
}

const FALLBACK_BY_CODE = new Map<string, GnbNavGroup>(
  gnbFallbackGroups.map(group => [group.groupCode, group]),
)

function overlayMenu(menuCode: string, label: string): GnbNavItem | null {
  if (!isKnownGnbMenuCode(menuCode)) return null
  const route = GNB_MENU_ROUTES[menuCode]
  if ('external' in route && route.external) {
    return { menuCode, label, external: true }
  }
  if ('href' in route && route.href) {
    return { menuCode, label, href: route.href }
  }
  return { menuCode, label }
}

function applyDesignMenuOrder(groupCode: string, children: GnbNavItem[]): GnbNavItem[] {
  if (groupCode !== 'JA_KOREA') return children

  const historyIndex = children.findIndex(item => item.menuCode === 'JA_HISTORY')
  if (historyIndex < 0) return children

  const orderedChildren = children.filter(item => item.menuCode !== 'JA_HISTORY')
  const organizationIndex = orderedChildren.findIndex(
    item => item.menuCode === 'JA_ORGANIZATION',
  )
  if (organizationIndex < 0) return children

  orderedChildren.splice(organizationIndex + 1, 0, children[historyIndex]!)
  return orderedChildren
}

/**
 * `{ success, data }` 래퍼는 벗긴다. 배열이 아니면 null. 호출측이 fallback을 쓴다.
 * 배열이면 원격이 SSOT. 빈 배열은 빈 GNB다.
 */
export function mapPublicGnb(remote: unknown): SiteGnbView | null {
  const body = unwrapPayload(remote)
  if (!Array.isArray(body)) return null

  const seenGroups = new Set<string>()
  const groups: GnbNavGroup[] = []

  for (const rawGroup of sortByDisplayOrder(body)) {
    if (!isRecord(rawGroup)) continue
    const groupCode = typeof rawGroup.groupCode === 'string' ? rawGroup.groupCode : ''
    if (!isKnownGnbGroupCode(groupCode) || seenGroups.has(groupCode)) continue
    const fallbackGroup = FALLBACK_BY_CODE.get(groupCode)
    if (!fallbackGroup) continue

    const groupName = readLabel(rawGroup.groupName)
    const canonicalGroupLabel = GNB_DESIGN_GROUP_LABEL_OVERRIDES[groupCode]
    const displayGroupName = canonicalGroupLabel ?? groupName
    if (!displayGroupName || !Array.isArray(rawGroup.menus)) continue

    const fallbackMenus = new Set<string>(fallbackGroup.children.map(menu => menu.menuCode))
    const seenMenus = new Set<string>()
    const children: GnbNavItem[] = []

    for (const rawMenu of sortByDisplayOrder(rawGroup.menus)) {
      if (!isRecord(rawMenu)) continue
      const menuCode = typeof rawMenu.menuCode === 'string' ? rawMenu.menuCode : ''
      if (!fallbackMenus.has(menuCode) || seenMenus.has(menuCode)) continue
      const displayName = readLabel(rawMenu.displayName)
      if (!displayName) continue
      const canonicalLabel = isKnownGnbMenuCode(menuCode)
        ? GNB_DESIGN_LABEL_OVERRIDES[menuCode]
        : undefined
      const menu = overlayMenu(menuCode, canonicalLabel ?? displayName)
      if (!menu) continue
      seenMenus.add(menuCode)
      children.push(menu)
    }

    if (children.length === 0) continue
    seenGroups.add(groupCode)
    const href = 'href' in fallbackGroup ? fallbackGroup.href : undefined
    const orderedChildren = applyDesignMenuOrder(groupCode, children)
    groups.push({
      groupCode,
      label: displayGroupName,
      ...(href ? { href } : {}),
      children: orderedChildren,
    })
  }

  return { source: 'remote', groups }
}

function unwrapPayload(payload: unknown): unknown {
  let current = payload
  for (let depth = 0; depth < 3; depth += 1) {
    if (!isRecord(current) || current.success !== true || !('data' in current)) return current
    current = current.data
  }
  return current
}
