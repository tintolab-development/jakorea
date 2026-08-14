/**
 * 운영원칙 관리 도메인 타입
 * 운영 원칙 항목은 고정 5종 — 신규 추가/삭제 없음, 아이콘 변경 없음
 */

export type PrincipleIconKey = 'p1' | 'p2' | 'p3' | 'p4' | 'p5'

export type OperatingPrinciplesIntro = {
  topSubText: string
  mainText: string
}

export type OperatingPrinciple = {
  id: string
  iconKey: PrincipleIconKey
  /** 1-based 노출 순서 */
  sortOrder: number
  isActive: boolean
  title: string
  subText: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
  updatedAt: string
}

export type OperatingPrinciplesDoc = {
  intro: OperatingPrinciplesIntro
  /** intro(setting) 낙관적 잠금 */
  settingVersion: number
  principles: OperatingPrinciple[]
  updatedAt: string
}

export type OperatingPrincipleTextPatch = {
  id: string
  title: string
  subText: string
}

export type OperatingPrinciplesSavePayload = {
  intro: OperatingPrinciplesIntro
  principles: OperatingPrincipleTextPatch[]
}
