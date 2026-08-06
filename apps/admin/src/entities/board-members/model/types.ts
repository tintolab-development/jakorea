/**
 * 이사회 구성원 관리 도메인 타입
 */

export type BoardRoleGroup =
  | 'board_chair_president'
  | 'fiduciary_board_member'
  | 'board_chair'

export type BoardMember = {
  id: string
  roleGroup: BoardRoleGroup
  sortOrder: number
  isPublic: boolean
  nameKo: string
  nameEn: string
  position: string
  affiliation: string
}

export type BoardMemberCreateInput = {
  roleGroup: BoardRoleGroup
  isPublic: boolean
  nameKo: string
  nameEn: string
  position: string
  affiliation: string
}

export type BoardMemberTextPatch = {
  id: string
  nameKo: string
  nameEn: string
  position: string
  affiliation: string
}

export const BOARD_ROLE_GROUP_ORDER: readonly BoardRoleGroup[] = [
  'board_chair_president',
  'fiduciary_board_member',
  'board_chair',
] as const

export const BOARD_ROLE_GROUP_LABELS: Record<BoardRoleGroup, string> = {
  board_chair_president: 'Board Chair & President',
  fiduciary_board_member: 'Fiduciary Board Member',
  board_chair: 'Board Chair',
}
