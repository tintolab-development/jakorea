import type {
  BoardMember,
  BoardMemberCreateInput,
  BoardMemberTextPatch,
  BoardRoleGroup,
} from '@/entities/board-members/model/types'
import { BOARD_ROLE_GROUP_ORDER } from '@/entities/board-members/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseBoardMembersRemoteApi } from './capabilities'
import {
  mapBoardMemberResponseToDomain,
  toBoardMemberBulkUpdateRequest,
  toBoardMemberCreateRequest,
  toBulkDeleteRequest,
  toPublishedToggleRequest,
} from './mappers'
import {
  bulkUpdateBoardMembers as bulkUpdateLocal,
  createBoardMember as createLocal,
  listBoardMembers as listLocal,
  removeBoardMembers as removeLocal,
  reorderBoardMembersInGroup as reorderLocal,
  setBoardMemberPublic as setPublicLocal,
} from './store'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

function normalizeRemoteItems(items: BoardMember[]): BoardMember[] {
  const byGroup = new Map<BoardRoleGroup, BoardMember[]>()
  for (const group of BOARD_ROLE_GROUP_ORDER) {
    byGroup.set(group, [])
  }
  for (const item of items) {
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

async function listRemoteBoardMembers(): Promise<BoardMember[]> {
  const response = await jaKoreaApi().boardMembers()
  return normalizeRemoteItems((response.items ?? []).map(mapBoardMemberResponseToDomain))
}

async function resolveCurrentRows(cachedRows?: BoardMember[]): Promise<BoardMember[]> {
  if (cachedRows && cachedRows.length > 0) {
    return normalizeRemoteItems(cachedRows)
  }
  return listRemoteBoardMembers()
}

async function putRemoteBoardMembers(rows: BoardMember[]): Promise<BoardMember[]> {
  const response = await jaKoreaApi().updateBoardMembers(toBoardMemberBulkUpdateRequest(rows))
  return normalizeRemoteItems((response.items ?? []).map(mapBoardMemberResponseToDomain))
}

async function syncPublished(
  current: BoardMember,
  wantPublic: boolean,
): Promise<BoardMember> {
  if (current.isPublic === wantPublic) return current
  return mapBoardMemberResponseToDomain(
    await jaKoreaApi().toggleBoardMember(
      Number(current.id),
      toPublishedToggleRequest(wantPublic, current.version),
    ),
  )
}

export async function listBoardMembersService(): Promise<BoardMember[]> {
  if (shouldUseBoardMembersRemoteApi()) {
    return listRemoteBoardMembers()
  }
  return listLocal()
}

export async function createBoardMemberService(
  input: BoardMemberCreateInput,
): Promise<BoardMember> {
  if (shouldUseBoardMembersRemoteApi()) {
    let created = mapBoardMemberResponseToDomain(
      await jaKoreaApi().createBoardMember(toBoardMemberCreateRequest(input)),
    )
    created = await syncPublished(created, input.isPublic)
    return created
  }
  return createLocal(input)
}

export async function bulkUpdateBoardMembersService(
  patches: BoardMemberTextPatch[],
  cachedRows?: BoardMember[],
): Promise<BoardMember[]> {
  if (shouldUseBoardMembersRemoteApi()) {
    const current = await resolveCurrentRows(cachedRows)
    if (patches.length === 0) return current
    const byId = new Map(patches.map(patch => [patch.id, patch]))
    const next = current.map(row => {
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
    return putRemoteBoardMembers(normalizeRemoteItems(next))
  }
  return bulkUpdateLocal(patches)
}

export async function removeBoardMembersService(
  ids: string[],
  cachedRows?: BoardMember[],
): Promise<BoardMember[]> {
  if (shouldUseBoardMembersRemoteApi()) {
    if (ids.length === 0) {
      return resolveCurrentRows(cachedRows)
    }
    let current = await resolveCurrentRows(cachedRows)
    const idSet = new Set(ids)
    const targets = current.filter(row => idSet.has(row.id))
    if (targets.length === 0) return current

    // BE: published 행은 삭제 전 비공개 필수
    for (const row of targets.filter(r => r.isPublic)) {
      const unpublished = await syncPublished(row, false)
      current = current.map(item => (item.id === unpublished.id ? unpublished : item))
    }

    const toDelete = current.filter(row => idSet.has(row.id))
    await jaKoreaApi().deleteBoardMembers(toBulkDeleteRequest(toDelete))
    return normalizeRemoteItems(current.filter(row => !idSet.has(row.id)))
  }
  removeLocal(ids)
  return listLocal()
}

export async function reorderBoardMembersInGroupService(
  roleGroup: BoardRoleGroup,
  orderedIds: string[],
  cachedRows?: BoardMember[],
): Promise<BoardMember[]> {
  if (shouldUseBoardMembersRemoteApi()) {
    const current = await resolveCurrentRows(cachedRows)
    const groupRows = current
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
    const others = current.filter(row => row.roleGroup !== roleGroup)
    return putRemoteBoardMembers(normalizeRemoteItems([...others, ...reindexed]))
  }
  return reorderLocal(roleGroup, orderedIds)
}

export async function setBoardMemberPublicService(
  id: string,
  isPublic: boolean,
  cachedRows?: BoardMember[],
): Promise<BoardMember> {
  if (shouldUseBoardMembersRemoteApi()) {
    const current = await resolveCurrentRows(cachedRows)
    const row = current.find(item => item.id === id)
    if (!row) {
      throw new Error(`Board member not found: ${id}`)
    }
    return syncPublished(row, isPublic)
  }
  return setPublicLocal(id, isPublic)
}
