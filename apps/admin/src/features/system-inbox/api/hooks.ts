import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { HomepageAdminSystemNotificationItem } from '@/shared/api/generated/notifications/schemas/homepageAdminSystemNotificationItem'
import { isAdminForbidden, shouldRetrySystemInboxQuery } from '../lib/http-status'
import {
  countSystemInboxUnreadService,
  INBOX_PAGE_SIZE,
  listSystemInboxService,
  readSystemInboxItemService,
} from './service'
import { systemInboxQueryKeys } from './query-keys'
import {
  isInboxItemRead,
  mapInboxItemsToListItems,
  parseUnreadCount,
  type SystemInboxListItem,
} from './mappers'

const LIST_STALE_MS = 15_000
const COUNT_STALE_MS = 15_000
const GC_MS = 10 * 60_000

function queryRetry(failureCount: number, error: unknown) {
  return shouldRetrySystemInboxQuery(failureCount, error)
}

export function useSystemInboxList(adminId: string | undefined, enabled: boolean) {
  const id = adminId ?? ''
  return useQuery({
    queryKey: systemInboxQueryKeys.list(id, INBOX_PAGE_SIZE),
    queryFn: () => listSystemInboxService(INBOX_PAGE_SIZE),
    enabled: Boolean(enabled && id),
    staleTime: LIST_STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: queryRetry,
    select: mapInboxItemsToListItems,
  })
}

export function useSystemInboxUnreadCount(adminId: string | undefined, enabled: boolean) {
  const id = adminId ?? ''
  return useQuery({
    queryKey: systemInboxQueryKeys.unreadCount(id),
    queryFn: countSystemInboxUnreadService,
    enabled: Boolean(enabled && id),
    staleTime: COUNT_STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: queryRetry,
    select: parseUnreadCount,
  })
}

export function useReadSystemInboxItem(adminId: string | undefined) {
  const queryClient = useQueryClient()
  const id = adminId ?? ''

  return useMutation({
    mutationFn: (numericId: number) => readSystemInboxItemService(numericId),
    retry: false,
    onMutate: async numericId => {
      await queryClient.cancelQueries({ queryKey: systemInboxQueryKeys.scope(id) })
      const listKey = systemInboxQueryKeys.list(id, INBOX_PAGE_SIZE)
      const countKey = systemInboxQueryKeys.unreadCount(id)
      const previousList = queryClient.getQueryData<HomepageAdminSystemNotificationItem[]>(listKey)
      const previousCount = queryClient.getQueryData<number>(countKey)
      queryClient.setQueryData<HomepageAdminSystemNotificationItem[]>(listKey, current =>
        (current ?? []).map(item =>
          item.id === numericId
            ? { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      )
      if (typeof previousCount === 'number' && previousCount > 0) {
        const wasUnread = previousList?.some(
          item => item.id === numericId && !isInboxItemRead(item),
        )
        if (wasUnread) {
          queryClient.setQueryData(countKey, previousCount - 1)
        }
      }
      return { previousList, previousCount }
    },
    onError: (_error, _numericId, context) => {
      if (!context) return
      queryClient.setQueryData(
        systemInboxQueryKeys.list(id, INBOX_PAGE_SIZE),
        context.previousList,
      )
      queryClient.setQueryData(systemInboxQueryKeys.unreadCount(id), context.previousCount)
    },
    onSuccess: item => {
      queryClient.setQueryData<HomepageAdminSystemNotificationItem[]>(
        systemInboxQueryKeys.list(id, INBOX_PAGE_SIZE),
        current => {
          const rows = current ?? []
          if (item.id == null) return rows
          const hasRow = rows.some(row => row.id === item.id)
          return hasRow ? rows.map(row => (row.id === item.id ? item : row)) : [item, ...rows]
        },
      )
      void queryClient.invalidateQueries({ queryKey: systemInboxQueryKeys.unreadCount(id) })
    },
  })
}

export function isSystemInboxForbidden(error: unknown): boolean {
  return isAdminForbidden(error)
}

export type { SystemInboxListItem }
