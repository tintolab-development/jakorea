import type {
  BoardMember,
  BoardMemberCreateInput,
  BoardMemberTextPatch,
  BoardRoleGroup,
} from '@/entities/board-members/model/types'
import { shouldUseBoardMembersRemoteApi } from './capabilities'
import {
  bulkUpdateBoardMembers as bulkUpdateLocal,
  createBoardMember as createLocal,
  listBoardMembers as listLocal,
  removeBoardMembers as removeLocal,
  reorderBoardMembersInGroup as reorderLocal,
  setBoardMemberPublic as setPublicLocal,
} from './store'

export async function listBoardMembersService(): Promise<BoardMember[]> {
  if (shouldUseBoardMembersRemoteApi()) {
    throw new Error('Board members remote API is not implemented yet')
  }
  return listLocal()
}

export async function createBoardMemberService(
  input: BoardMemberCreateInput
): Promise<BoardMember> {
  if (shouldUseBoardMembersRemoteApi()) {
    throw new Error('Board members remote API is not implemented yet')
  }
  return createLocal(input)
}

export async function bulkUpdateBoardMembersService(
  patches: BoardMemberTextPatch[]
): Promise<BoardMember[]> {
  if (shouldUseBoardMembersRemoteApi()) {
    throw new Error('Board members remote API is not implemented yet')
  }
  return bulkUpdateLocal(patches)
}

export async function removeBoardMembersService(ids: string[]): Promise<void> {
  if (shouldUseBoardMembersRemoteApi()) {
    throw new Error('Board members remote API is not implemented yet')
  }
  removeLocal(ids)
}

export async function reorderBoardMembersInGroupService(
  roleGroup: BoardRoleGroup,
  orderedIds: string[]
): Promise<BoardMember[]> {
  if (shouldUseBoardMembersRemoteApi()) {
    throw new Error('Board members remote API is not implemented yet')
  }
  return reorderLocal(roleGroup, orderedIds)
}

export async function setBoardMemberPublicService(
  id: string,
  isPublic: boolean
): Promise<BoardMember> {
  if (shouldUseBoardMembersRemoteApi()) {
    throw new Error('Board members remote API is not implemented yet')
  }
  return setPublicLocal(id, isPublic)
}
