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
  mapInboxItemsToListItems,
  parseUnreadCount,
  type SystemInboxListItem,
} from './mappers'
import {
  markInboxItemReadLocally,
  mergeConfirmedInboxItem,
  nextUnreadCountAfterRead,
} from './inbox-cache'

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
      const readAt = new Date().toISOString()
      queryClient.setQueryData<HomepageAdminSystemNotificationItem[]>(listKey, current =>
        markInboxItemReadLocally(current ?? [], numericId, readAt),
      )
      const nextCount = nextUnreadCountAfterRead(previousCount, previousList, numericId)
      if (typeof nextCount === 'number') {
        queryClient.setQueryData(countKey, nextCount)
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
        current => mergeConfirmedInboxItem(current ?? [], item),
      )
      void queryClient.invalidateQueries({ queryKey: systemInboxQueryKeys.unreadCount(id) })
    },
  })
}

export function isSystemInboxForbidden(error: unknown): boolean {
  return isAdminForbidden(error)
}

export type { SystemInboxListItem }
