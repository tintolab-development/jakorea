import type {
  GnbMenuDoc,
  GnbSubMenu,
  GnbTopMenu,
  GnbTopMenuId,
} from '@/entities/gnb-menu/model/types'
import type { GnbGroupResponse } from '@/shared/api/generated/site/schemas/gnbGroupResponse'
import type { GnbMenuUpdateItem } from '@/shared/api/generated/site/schemas/gnbMenuUpdateItem'
import type { GnbUpdateRequest } from '@/shared/api/generated/site/schemas/gnbUpdateRequest'

/** FE seed id → API menuCode */
export const FE_ID_TO_MENU_CODE: Record<string, string> = {
  'ja-intro': 'JA_ORGANIZATION',
  'ja-transparency': 'JA_TRANSPARENCY',
  'ja-people': 'JA_PEOPLE',
  'ja-directions': 'JA_DIRECTIONS',
  'ja-notices': 'JA_NOTICE',
  'ja-history': 'JA_HISTORY',
  'ja-recruit': 'JA_RECRUIT',
  'impact-story': 'IMPACT_STORY',
  'edu-career': 'EDU_CAREER',
  'edu-finance': 'EDU_ECONOMY',
  'edu-entrepreneur': 'EDU_ENTREPRENEURSHIP',
  'edu-literacy': 'EDU_DIGITAL_LITERACY',
  'edu-textbook': 'EDU_MATERIAL',
  'part-program': 'PARTICIPATION_APPLY',
  'part-result': 'PARTICIPATION_RESULT',
  'part-online': 'PARTICIPATION_ONLINE',
  'part-alumni': 'PARTICIPATION_ALUMNI',
  'sp-individual': 'SPONSOR_PERSONAL',
  'sp-corporate': 'SPONSOR_CORPORATE',
  'sp-talent': 'SPONSOR_TALENT',
}

const MENU_CODE_TO_FE_ID: Record<string, string> = Object.fromEntries(
  Object.entries(FE_ID_TO_MENU_CODE).map(([feId, code]) => [code, feId]),
)

const GROUP_CODE_TO_FE: Record<string, { id: GnbTopMenuId; label: string }> = {
  JA_KOREA: { id: 'ja_korea', label: 'JA Korea' },
  IMPACT_STORY: { id: 'impact_story', label: '임팩트 스토리' },
  EDUCATION: { id: 'education', label: '교육 소개' },
  PARTICIPATION: { id: 'participate', label: '참여하기' },
  SPONSORSHIP: { id: 'sponsor', label: '후원하기' },
}

const GROUP_ORDER: GnbTopMenuId[] = [
  'ja_korea',
  'impact_story',
  'education',
  'participate',
  'sponsor',
]

export function toApiMenuCode(feId: string): string {
  const code = FE_ID_TO_MENU_CODE[feId]
  if (!code) throw new Error(`Unknown GNB menu id: ${feId}`)
  return code
}

export function toFeMenuId(menuCode: string | undefined): string | null {
  if (!menuCode) return null
  return MENU_CODE_TO_FE_ID[menuCode] ?? null
}

export function mapGnbGroupsToDomain(groups: GnbGroupResponse[]): GnbMenuDoc {
  const mapped: GnbTopMenu[] = []
  for (const group of groups ?? []) {
    const meta = group.groupCode ? GROUP_CODE_TO_FE[group.groupCode] : undefined
    if (!meta) continue
    const items: GnbSubMenu[] = (group.menus ?? [])
      .map(menu => {
        const id = toFeMenuId(menu.menuCode)
        if (!id) return null
        return {
          id,
          sortOrder: menu.displayOrder ?? 0,
          isActive: Boolean(menu.enabled),
          name: menu.displayName?.trim() || id,
          version: menu.version ?? 0,
        } satisfies GnbSubMenu
      })
      .filter((item): item is GnbSubMenu => item != null)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    mapped.push({
      id: meta.id,
      label: group.groupName?.trim() || meta.label,
      sortOrder: group.displayOrder ?? 0,
      items,
    })
  }
  mapped.sort(
    (a, b) => GROUP_ORDER.indexOf(a.id) - GROUP_ORDER.indexOf(b.id) || a.sortOrder - b.sortOrder,
  )
  return {
    groups: mapped,
    updatedAt: '',
  }
}

export function toGnbUpdateRequest(doc: GnbMenuDoc): GnbUpdateRequest {
  const menus: GnbMenuUpdateItem[] = []
  for (const group of doc.groups) {
    for (const item of group.items) {
      menus.push({
        menuCode: toApiMenuCode(item.id),
        displayName: item.name.trim(),
        enabled: item.isActive,
        displayOrder: item.sortOrder,
        version: item.version,
      })
    }
  }
  if (menus.length !== 20) {
    throw new Error(`GNB update requires exactly 20 menus, got ${menus.length}`)
  }
  return { menus }
}
