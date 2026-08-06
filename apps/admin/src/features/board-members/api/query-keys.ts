export const boardMembersQueryKeys = {
  all: ['board-members'] as const,
  lists: () => [...boardMembersQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local') =>
    [...boardMembersQueryKeys.lists(), source] as const,
}
