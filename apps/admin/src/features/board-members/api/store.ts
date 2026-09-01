/**
 * 이사회 구성원 — localStorage mock (API 연동 전)
 */

import type {
  BoardMember,
  BoardMemberCreateInput,
  BoardMemberTextPatch,
  BoardRoleGroup,
} from '@/entities/board-members/model/types'
import { BOARD_ROLE_GROUP_ORDER } from '@/entities/board-members/model/types'

const STORAGE_KEY = 'admin.jakorea.board-members.v1'

export const BOARD_MEMBERS_CHANGED_EVENT = 'jakorea:board-members-changed' as const

type BoardMembersFile = {
  version: 1
  items: BoardMember[]
}

type SeedRow = Omit<BoardMember, 'id' | 'sortOrder' | 'version'>

const SEED_ROWS: readonly SeedRow[] = [
  {
    roleGroup: 'board_chair_president',
    isPublic: true,
    nameKo: '신철식',
    nameEn: 'Cheulsik Shin',
    position: '이사장',
    affiliation: 'Board Chair of JA Korea, Professor Emeritus, KAIST',
  },
  {
    roleGroup: 'board_chair_president',
    isPublic: true,
    nameKo: '이은형',
    nameEn: 'Eunhyung Lee',
    position: '회장',
    affiliation: 'President of JA Korea, Professor, Kookmin University',
  },
  {
    roleGroup: 'fiduciary_board_member',
    isPublic: true,
    nameKo: '윤종록',
    nameEn: 'Jongrok Yoon',
    position: '이사',
    affiliation: 'Chairman, BluePoint Partners',
  },
  {
    roleGroup: 'fiduciary_board_member',
    isPublic: true,
    nameKo: '이존',
    nameEn: 'John Lee',
    position: '이사',
    affiliation: 'Vice President & CFO of Samsung Electronics Device Solutions',
  },
  {
    roleGroup: 'fiduciary_board_member',
    isPublic: true,
    nameKo: '방경인',
    nameEn: 'Kyungin Pang',
    position: '이사',
    affiliation: 'Chairman of Darakwon Publishing Company',
  },
  {
    roleGroup: 'board_chair',
    isPublic: true,
    nameKo: '류혁선',
    nameEn: 'Hyuksun Rhu',
    position: '이사',
    affiliation: 'Professor, School of Business and Technology Management, KAIST',
  },
  {
    roleGroup: 'board_chair',
    isPublic: true,
    nameKo: '김소연',
    nameEn: 'Soyeon Kim',
    position: '이사',
    affiliation: 'Representative of Disney Korea',
  },
  {
    roleGroup: 'board_chair',
    isPublic: true,
    nameKo: '호바트 엡스타인',
    nameEn: 'Hobart Epsteine',
    position: '이사',
    affiliation: 'Director, JA Worldwide',
  },
  {
    roleGroup: 'board_chair',
    isPublic: true,
    nameKo: '박준형',
    nameEn: 'Junhyung Park',
    position: '이사',
    affiliation: 'CEO, InnoBridge Partners',
  },
  {
    roleGroup: 'board_chair',
    isPublic: true,
    nameKo: '정미라',
    nameEn: 'Mira Jeong',
    position: '이사',
    affiliation: 'Professor, Seoul National University',
  },
  {
    roleGroup: 'board_chair',
    isPublic: true,
    nameKo: '최성호',
    nameEn: 'Sungho Choi',
    position: '이사',
    affiliation: 'Managing Director, Global Education Fund',
  },
]

function isBoardRoleGroup(value: unknown): value is BoardRoleGroup {
  return (
    value === 'board_chair_president' ||
    value === 'fiduciary_board_member' ||
    value === 'board_chair'
  )
}

function buildSeedMembers(): BoardMember[] {
  const groupCounts: Partial<Record<BoardRoleGroup, number>> = {}
  return SEED_ROWS.map((row, index) => {
    const count = (groupCounts[row.roleGroup] ?? 0) + 1
    groupCounts[row.roleGroup] = count
    return {
      ...row,
      id: `board-member-${index + 1}`,
      sortOrder: count,
      version: 0,
    }
  })
}

function normalizeItems(items: BoardMember[]): BoardMember[] {
  const byGroup = new Map<BoardRoleGroup, BoardMember[]>()
  for (const group of BOARD_ROLE_GROUP_ORDER) {
    byGroup.set(group, [])
  }
  for (const item of items) {
    if (!isBoardRoleGroup(item.roleGroup)) continue
    const list = byGroup.get(item.roleGroup) ?? []
    list.push(item)
    byGroup.set(item.roleGroup, list)
  }

  const result: BoardMember[] = []
  for (const group of BOARD_ROLE_GROUP_ORDER) {
    const list = (byGroup.get(group) ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
    list.forEach((row, index) => {
      result.push({ ...row, sortOrder: index + 1 })
    })
  }
  return result
}

function normalizeMember(raw: Partial<BoardMember>, fallbackId: string): BoardMember | null {
  if (!isBoardRoleGroup(raw.roleGroup)) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : fallbackId,
    roleGroup: raw.roleGroup,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 1,
    isPublic: Boolean(raw.isPublic),
    nameKo: typeof raw.nameKo === 'string' ? raw.nameKo : '',
    nameEn: typeof raw.nameEn === 'string' ? raw.nameEn : '',
    position: typeof raw.position === 'string' ? raw.position : '',
    affiliation: typeof raw.affiliation === 'string' ? raw.affiliation : '',
    version: typeof raw.version === 'number' ? raw.version : 0,
  }
}

function readFile(): BoardMembersFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, items: buildSeedMembers() }
    const parsed = JSON.parse(raw) as BoardMembersFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedMembers() }
    }
    const items = parsed.items
      .map((row, index) => normalizeMember(row, `board-member-loaded-${index + 1}`))
      .filter((row): row is BoardMember => row != null)
    return { version: 1, items: normalizeItems(items) }
  } catch {
    return { version: 1, items: buildSeedMembers() }
  }
}

function writeFile(file: BoardMembersFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(BOARD_MEMBERS_CHANGED_EVENT))
}

export function listBoardMembers(): BoardMember[] {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return normalizeItems(file.items)
}

export function createBoardMember(input: BoardMemberCreateInput): BoardMember {
  const file = readFile()
  const groupItems = file.items.filter(row => row.roleGroup === input.roleGroup)
  const item: BoardMember = {
    id: `board-member-${Date.now()}`,
    roleGroup: input.roleGroup,
    sortOrder: groupItems.length + 1,
    isPublic: input.isPublic,
    nameKo: input.nameKo.trim(),
    nameEn: input.nameEn.trim(),
    position: input.position.trim(),
    affiliation: input.affiliation.trim(),
    version: 0,
  }
  const items = normalizeItems([...file.items, item])
  writeFile({ version: 1, items })
  return item
}

export function bulkUpdateBoardMembers(patches: BoardMemberTextPatch[]): BoardMember[] {
  if (patches.length === 0) return listBoardMembers()
  const byId = new Map(patches.map(patch => [patch.id, patch]))
  const file = readFile()
  const items = file.items.map(row => {
    const patch = byId.get(row.id)
    if (!patch) return row
    return {
      ...row,
      nameKo: patch.nameKo.trim(),
      nameEn: patch.nameEn.trim(),
      position: patch.position.trim(),
      affiliation: patch.affiliation.trim(),
    }
  })
  const next = normalizeItems(items)
  writeFile({ version: 1, items: next })
  return next
}

export function removeBoardMembers(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const file = readFile()
  const items = normalizeItems(file.items.filter(row => !idSet.has(row.id)))
  writeFile({ version: 1, items })
}

/** 동일 그룹 내에서만 orderedIds 순서로 재배치 */
export function reorderBoardMembersInGroup(
  roleGroup: BoardRoleGroup,
  orderedIds: string[]
): BoardMember[] {
  const file = readFile()
  const groupRows = file.items
    .filter(row => row.roleGroup === roleGroup)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const byId = new Map(groupRows.map(row => [row.id, row]))
  const ordered: BoardMember[] = []
  for (const id of orderedIds) {
    const row = byId.get(id)
    if (row) {
      ordered.push(row)
      byId.delete(id)
    }
  }
  for (const row of byId.values()) {
    ordered.push(row)
  }
  const reindexed = ordered.map((row, index) => ({
    ...row,
    sortOrder: index + 1,
  }))
  const others = file.items.filter(row => row.roleGroup !== roleGroup)
  const items = normalizeItems([...others, ...reindexed])
  writeFile({ version: 1, items })
  return items
}

export function setBoardMemberPublic(id: string, isPublic: boolean): BoardMember {
  const file = readFile()
  const index = file.items.findIndex(row => row.id === id)
  if (index < 0) {
    throw new Error(`Board member not found: ${id}`)
  }
  const prev = file.items[index]!
  const next: BoardMember = { ...prev, isPublic }
  const items = [...file.items]
  items[index] = next
  const normalized = normalizeItems(items)
  writeFile({ version: 1, items: normalized })
  return next
}
