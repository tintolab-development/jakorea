import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BoardMember,
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

function cachedList(queryClient: ReturnType<typeof useQueryClient>): BoardMember[] | undefined {
  return queryClient.getQueryData<BoardMember[]>(boardMembersQueryKeys.list(source()))
}

function patchListRow(
  queryClient: ReturnType<typeof useQueryClient>,
  row: BoardMember,
): void {
  const key = boardMembersQueryKeys.list(source())
  const current = queryClient.getQueryData<BoardMember[]>(key)
  if (!current) return
  queryClient.setQueryData(
    key,
    current.map(item => (item.id === row.id ? row : item)),
  )
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
      bulkUpdateBoardMembersService(patches, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(boardMembersQueryKeys.list(source()), rows)
    },
  })
}

export function useRemoveBoardMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      removeBoardMembersService(ids, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(boardMembersQueryKeys.list(source()), rows)
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
    }) => reorderBoardMembersInGroupService(roleGroup, orderedIds, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(boardMembersQueryKeys.list(source()), rows)
    },
  })
}

export function useSetBoardMemberPublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      setBoardMemberPublicService(id, isPublic, cachedList(queryClient)),
    retry: false,
    onSuccess: row => {
      patchListRow(queryClient, row)
    },
  })
}
