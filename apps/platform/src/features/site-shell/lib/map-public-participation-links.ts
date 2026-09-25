/**
 * Admin 참여하기 관리(`/api/public/participation/links`) → Platform GNB/푸터 외부 URL.
 * GNB menuCode(PARTICIPATION_*)와 links menuCode(ONLINE_LEARNING/ALUMNI)를 맞춘다.
 */

import type { SiteGnbView } from './map-public-gnb'
import type { SiteFooterMenu, SiteFooterView } from './map-public-footer'

export type ParticipationExternalHrefs = {
  /** GNB 온라인 학습 · 푸터 온라인 학습관리 */
  onlineLearning: string | null
  /** GNB Alumni */
  alumni: string | null
}

export const EMPTY_PARTICIPATION_EXTERNAL_HREFS: ParticipationExternalHrefs = {
  onlineLearning: null,
  alumni: null,
}

const LINK_MENU_TO_FIELD = {
  ONLINE_LEARNING: 'onlineLearning',
  ALUMNI: 'alumni',
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const url = value.trim()
  if (!url || !/^https?:\/\//i.test(url)) return null
  return url
}

function unwrapPayload(payload: unknown): unknown {
  let current = payload
  for (let depth = 0; depth < 3; depth += 1) {
    if (!isRecord(current) || current.success !== true || !('data' in current)) return current
    current = current.data
  }
  return current
}

/** GET /api/public/participation/links → 외부 http(s) URL만. 빈·상대 경로는 null. */
export function mapPublicParticipationLinks(remote: unknown): ParticipationExternalHrefs {
  const body = unwrapPayload(remote)
  if (!Array.isArray(body)) return EMPTY_PARTICIPATION_EXTERNAL_HREFS

  const next: ParticipationExternalHrefs = { ...EMPTY_PARTICIPATION_EXTERNAL_HREFS }
  for (const row of body) {
    if (!isRecord(row)) continue
    const menuCode = typeof row.menuCode === 'string' ? row.menuCode.trim() : ''
    const field = LINK_MENU_TO_FIELD[menuCode as keyof typeof LINK_MENU_TO_FIELD]
    if (!field) continue
    const url = readHttpUrl(row.externalUrl)
    // 빈·비http는 null로 반영. 단 이미 채운 뒤 잘못된 중복 행이 오면 덮어쓰지 않는다.
    if (url) {
      next[field] = url
    } else if (next[field] == null) {
      next[field] = null
    }
  }
  return next
}

export function applyParticipationLinksToGnb(
  gnb: SiteGnbView,
  links: ParticipationExternalHrefs,
): SiteGnbView {
  if (!links.onlineLearning && !links.alumni) return gnb

  return {
    ...gnb,
    groups: gnb.groups.map(group => ({
      ...group,
      children: group.children.map(child => {
        if (child.menuCode === 'PARTICIPATION_ONLINE' && links.onlineLearning) {
          return { ...child, external: true as const, href: links.onlineLearning }
        }
        if (child.menuCode === 'PARTICIPATION_ALUMNI' && links.alumni) {
          return { ...child, external: true as const, href: links.alumni }
        }
        return child
      }),
    })),
  }
}

export function applyParticipationLinksToFooter(
  footer: SiteFooterView,
  links: ParticipationExternalHrefs,
): SiteFooterView {
  if (!links.onlineLearning) return footer

  return {
    ...footer,
    menus: footer.menus.map((menu): SiteFooterMenu => {
      if (menu.key !== 'LOCAL_ONLINE_LEARNING') return menu
      return {
        key: menu.key,
        label: menu.label,
        kind: 'external',
        href: links.onlineLearning!,
      }
    }),
  }
}
