export const boardMembersQueryKeys = {
  all: ['board-members'] as const,
  lists: () => [...boardMembersQueryKeys.all, 'list'] as const,
  list: () => [...boardMembersQueryKeys.lists(), 'remote'] as const,
}
