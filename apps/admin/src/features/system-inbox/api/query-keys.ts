export const systemInboxQueryKeys = {
  all: ['admin', 'system-inbox'] as const,
  scope: (adminId: string) => [...systemInboxQueryKeys.all, adminId] as const,
  lists: (adminId: string) => [...systemInboxQueryKeys.scope(adminId), 'list'] as const,
  list: (adminId: string, size: number) =>
    [...systemInboxQueryKeys.lists(adminId), size] as const,
  unreadCount: (adminId: string) =>
    [...systemInboxQueryKeys.scope(adminId), 'unread-count'] as const,
}
