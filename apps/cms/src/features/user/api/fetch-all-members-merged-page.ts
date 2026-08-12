/**
 * 전체 회원 목록 — members + admin-accounts k-way merge (등록일 내림차순)
 */

import type { GetUsersPageParams, GetUsersPageResult } from '@/entities/user/api/user-service'
import { mapIsActiveToMemberStatus, mapUserRoleToApiRole } from '@/features/user/api/map-member-role'
import { mapMemberListItems } from '@/features/user/api/map-member-list-item'
import { mapAdminAccountListItems } from '@/features/user/api/map-admin-account-list-item-to-user'
import {
  fetchAdminsPageRemote,
  fetchMembersPageRemote,
} from '@/features/user/api/members-api-client'
import type { User } from '@/types/user'

export const ALL_MEMBERS_MERGE_PAGE_SIZE = 15

export type AllMembersMergeSourceState = {
  page: number
  exhausted: boolean
  buffer: Omit<User, 'password'>[]
  total: number
}

export type AllMembersMergeCursor = {
  members: AllMembersMergeSourceState
  admins: AllMembersMergeSourceState
  remainder: Omit<User, 'password'>[]
}

function createInitialSourceState(): AllMembersMergeSourceState {
  return { page: 0, exhausted: false, buffer: [], total: 0 }
}

export function createInitialMergeCursor(): AllMembersMergeCursor {
  return {
    members: createInitialSourceState(),
    admins: createInitialSourceState(),
    remainder: [],
  }
}

function createdAtMs(user: Omit<User, 'password'>): number {
  if (!user.createdAt) return 0
  const t = new Date(user.createdAt).getTime()
  return Number.isFinite(t) ? t : 0
}

export function compareUsersByCreatedAtDesc(
  a: Omit<User, 'password'>,
  b: Omit<User, 'password'>
): number {
  const diff = createdAtMs(b) - createdAtMs(a)
  if (diff !== 0) return diff
  return String(a.id).localeCompare(String(b.id))
}

export function matchesCreatedAtRange(
  user: Omit<User, 'password'>,
  createdAtFrom?: string,
  createdAtTo?: string
): boolean {
  if (!createdAtFrom && !createdAtTo) return true
  const created = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : ''
  if (createdAtFrom && created < createdAtFrom) return false
  if (createdAtTo && created > createdAtTo) return false
  return true
}

function cloneCursor(cursor: AllMembersMergeCursor): AllMembersMergeCursor {
  return {
    members: { ...cursor.members, buffer: [...cursor.members.buffer] },
    admins: { ...cursor.admins, buffer: [...cursor.admins.buffer] },
    remainder: [...cursor.remainder],
  }
}

function hasMoreData(state: AllMembersMergeCursor): boolean {
  return (
    state.remainder.length > 0 ||
    state.members.buffer.length > 0 ||
    state.admins.buffer.length > 0 ||
    !state.members.exhausted ||
    !state.admins.exhausted
  )
}

async function refillMembers(
  state: AllMembersMergeCursor,
  filters: GetUsersPageParams,
  pageSize: number
): Promise<void> {
  if (state.members.exhausted || state.members.buffer.length > 0) return

  const res = await fetchMembersPageRemote({
    keyword: filters.search?.trim() || undefined,
    role: mapUserRoleToApiRole(filters.role),
    memberStatus: mapIsActiveToMemberStatus(filters.isActive),
    createdAtFrom: filters.createdAtFrom || undefined,
    createdAtTo: filters.createdAtTo || undefined,
    page: state.members.page,
    size: pageSize,
  })

  const users = mapMemberListItems(res.items)
  state.members.buffer.push(...users)
  state.members.total = res.totalElements ?? state.members.total
  state.members.page += 1

  const totalPages = res.totalPages ?? 0
  const pageHasMore =
    totalPages > 0
      ? state.members.page < totalPages
      : users.length >= pageSize
  if (!pageHasMore) {
    state.members.exhausted = true
  }
}

async function refillAdmins(
  state: AllMembersMergeCursor,
  filters: GetUsersPageParams,
  pageSize: number
): Promise<void> {
  if (state.admins.exhausted || state.admins.buffer.length > 0) return

  const res = await fetchAdminsPageRemote({
    keyword: filters.search?.trim() || undefined,
    page: state.admins.page,
    size: pageSize,
  })

  const users = mapAdminAccountListItems(res.items).filter(user =>
    matchesCreatedAtRange(user, filters.createdAtFrom, filters.createdAtTo)
  )
  state.admins.buffer.push(...users)
  state.admins.total = res.totalElements ?? state.admins.total
  state.admins.page += 1

  const totalPages = res.totalPages ?? 0
  const pageHasMore =
    totalPages > 0 ? state.admins.page < totalPages : (res.items?.length ?? 0) >= pageSize
  if (!pageHasMore) {
    state.admins.exhausted = true
  }
}

async function refillSources(
  state: AllMembersMergeCursor,
  filters: GetUsersPageParams,
  pageSize: number
): Promise<void> {
  const tasks: Promise<void>[] = []
  if (state.members.buffer.length === 0 && !state.members.exhausted) {
    tasks.push(refillMembers(state, filters, pageSize))
  }
  if (state.admins.buffer.length === 0 && !state.admins.exhausted) {
    tasks.push(refillAdmins(state, filters, pageSize))
  }
  if (tasks.length > 0) {
    await Promise.all(tasks)
  }
}

function popNextMergedUser(state: AllMembersMergeCursor): Omit<User, 'password'> | null {
  const memberHead = state.members.buffer[0]
  const adminHead = state.admins.buffer[0]

  if (!memberHead && !adminHead) return null

  if (!memberHead) {
    return state.admins.buffer.shift() ?? null
  }
  if (!adminHead) {
    return state.members.buffer.shift() ?? null
  }

  if (compareUsersByCreatedAtDesc(memberHead, adminHead) <= 0) {
    return state.members.buffer.shift() ?? null
  }
  return state.admins.buffer.shift() ?? null
}

export async function fetchAllMembersMergedPage(
  filters: GetUsersPageParams,
  cursor: AllMembersMergeCursor,
  pageSize = ALL_MEMBERS_MERGE_PAGE_SIZE
): Promise<GetUsersPageResult & { nextPageParam: AllMembersMergeCursor }> {
  const state = cloneCursor(cursor)
  const pool: Omit<User, 'password'>[] = [...state.remainder]
  state.remainder = []

  while (pool.length < pageSize) {
    await refillSources(state, filters, pageSize)

    const next = popNextMergedUser(state)
    if (!next) break
    pool.push(next)
  }

  const users = pool.slice(0, pageSize)
  const remainder = pool.slice(pageSize)
  const nextCursor: AllMembersMergeCursor = {
    members: state.members,
    admins: state.admins,
    remainder,
  }

  const total = state.members.total + state.admins.total
  const hasMore = hasMoreData(nextCursor)

  return {
    users,
    total,
    hasMore,
    nextPageParam: nextCursor,
  }
}
