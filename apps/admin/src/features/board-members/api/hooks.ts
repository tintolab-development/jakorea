import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BoardMemberCreateInput,
  BoardMemberTextPatch,
  BoardRoleGroup,
} from '@/entities/board-members/model/types'
import { shouldUseBoardMembersRemoteApi } from './capabilities'
import { boardMembersQueryKeys } from './query-keys'
import {
  bulkUpdateBoardMembersService,
  createBoardMemberService,
  listBoardMembersService,
  removeBoardMembersService,
  reorderBoardMembersInGroupService,
  setBoardMemberPublicService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseBoardMembersRemoteApi() ? 'remote' : 'local'
}

export function useBoardMembersList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: boardMembersQueryKeys.list(dataSource),
    queryFn: () => listBoardMembersService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useCreateBoardMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BoardMemberCreateInput) => createBoardMemberService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardMembersQueryKeys.lists() })
    },
  })
}

export function useBulkUpdateBoardMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: BoardMemberTextPatch[]) =>
      bulkUpdateBoardMembersService(patches),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(boardMembersQueryKeys.list(source()), rows)
      void queryClient.invalidateQueries({ queryKey: boardMembersQueryKeys.lists() })
    },
  })
}

export function useRemoveBoardMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeBoardMembersService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardMembersQueryKeys.lists() })
    },
  })
}

export function useReorderBoardMembersInGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      roleGroup,
      orderedIds,
    }: {
      roleGroup: BoardRoleGroup
      orderedIds: string[]
    }) => reorderBoardMembersInGroupService(roleGroup, orderedIds),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(boardMembersQueryKeys.list(source()), rows)
      void queryClient.invalidateQueries({ queryKey: boardMembersQueryKeys.lists() })
    },
  })
}

export function useSetBoardMemberPublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      setBoardMemberPublicService(id, isPublic),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardMembersQueryKeys.lists() })
    },
  })
}
