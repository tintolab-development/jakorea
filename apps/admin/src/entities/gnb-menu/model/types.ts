/**
 * GNB 메뉴 — 홈페이지 대메뉴(고정)별 하위 메뉴
 * 어드민 LNB 메뉴명과는 무관
 */

export type GnbTopMenuId =
  | 'ja_korea'
  | 'impact_story'
  | 'education'
  | 'participate'
  | 'sponsor'

export type GnbSubMenu = {
  id: string
  /** 1-based within group */
  sortOrder: number
  isActive: boolean
  name: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}

export type GnbTopMenu = {
  id: GnbTopMenuId
  /** 고정 대메뉴 라벨 (관리 화면 섹션 타이틀, 미편집) */
  label: string
  sortOrder: number
  items: GnbSubMenu[]
}

export type GnbMenuDoc = {
  groups: GnbTopMenu[]
  updatedAt: string
}
