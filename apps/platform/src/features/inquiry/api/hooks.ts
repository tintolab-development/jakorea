import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { FaqItem, OneToOneInquiryWritePayload } from '../model/types'
import { mapInquiryDetail, mapInquiryListItem } from './mappers'
import {
  createMyInquiry,
  deleteMyInquiry,
  fetchInquiryCategoryOptions,
  fetchInquiryProgramOptions,
  fetchMyInquiries,
  fetchMyInquiryDetail,
  fetchPublicFaqs,
} from './client'

const LIST_STALE_MS = 30_000
const FAQ_STALE_MS = 60_000
const OPTIONS_STALE_MS = 5 * 60_000
const GC_MS = 10 * 60_000

const NONE_PROGRAM_VALUE = 'none'

function queryOptions(staleTime: number) {
  return {
    staleTime,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  } as const
}

function remoteConfigured(): boolean {
  return isRemoteApiConfigured()
}

function remoteSession(): boolean {
  return remoteConfigured() && Boolean(getAccessToken())
}

function mapFaq(
  item: {
    faqId?: number
    categoryName?: string
    title?: string
    content?: string
  },
  index: number
): FaqItem | null {
  if (item.faqId == null) return null
  const title = item.title?.trim() || 'FAQ'
  return {
    id: String(item.faqId),
    category: item.categoryName?.trim() || '기타',
    title,
    question: title,
    answer: item.content?.trim() || '',
    order: index,
  }
}

export function usePublicFaqsQuery() {
  const enabled = remoteConfigured()
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.publicFaqs(),
    queryFn: ({ signal }) => fetchPublicFaqs(signal),
    enabled,
    ...queryOptions(FAQ_STALE_MS),
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    items: (query.data ?? []).flatMap((item, index) => {
      const mapped = mapFaq(item, index)
      return mapped ? [mapped] : []
    }),
    refetch: () => {
      void query.refetch()
    },
  }
}

export function useMyInquiriesQuery() {
  const enabled = remoteSession()
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.inquiries.list(),
    queryFn: ({ signal }) => fetchMyInquiries(signal),
    enabled,
    ...queryOptions(LIST_STALE_MS),
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    items: (query.data ?? []).flatMap((item, index) => {
      const mapped = mapInquiryListItem(item, index)
      return mapped ? [mapped] : []
    }),
  }
}

export function useMyInquiryDetailQuery(inquiryId: string | null) {
  const enabled = remoteSession() && Boolean(inquiryId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.inquiries.detail(inquiryId ?? ''),
    queryFn: ({ signal }) => fetchMyInquiryDetail(inquiryId!, signal),
    enabled,
    ...queryOptions(LIST_STALE_MS),
  })
  return {
    enabled,
    detail: query.data ? mapInquiryDetail(query.data) : undefined,
  }
}

export function useInquiryWriteOptionsQuery(enabled: boolean) {
  const active = enabled && remoteSession()
  const categories = useQuery({
    queryKey: platformQueryKeys.mypage.inquiries.categoryOptions(),
    queryFn: ({ signal }) => fetchInquiryCategoryOptions(signal),
    enabled: active,
    ...queryOptions(OPTIONS_STALE_MS),
  })
  const programs = useQuery({
    queryKey: platformQueryKeys.mypage.inquiries.programOptions(),
    queryFn: ({ signal }) => fetchInquiryProgramOptions(signal),
    enabled: active,
    ...queryOptions(OPTIONS_STALE_MS),
  })

  const categoryOptions = (categories.data ?? []).flatMap(item => {
    const label = item.category?.trim()
    if (!label) return []
    return [{ value: label, label }]
  })
  const programOptions = [
    ...(programs.data ?? []).flatMap(item => {
      if (item.programId == null) return []
      const label = item.programName?.trim() || '프로그램'
      return [{ value: String(item.programId), label }]
    }),
    { value: NONE_PROGRAM_VALUE, label: '해당 없음' },
  ]

  return {
    enabled: active,
    categoryOptions,
    programOptions,
  }
}

export function useCreateMyInquiryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: {
      payload: OneToOneInquiryWritePayload
      idempotencyKey: string
    }) => {
      const programId = Number(payload.programValue)
      return createMyInquiry(
        {
          category: payload.category,
          title: payload.title,
          content: payload.content,
          ...(Number.isFinite(programId) && programId > 0 ? { programId } : {}),
        },
        idempotencyKey,
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.inquiries.list() })
    },
  })
}

export function useDeleteMyInquiryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inquiryId: string) => deleteMyInquiry(inquiryId),
    onSuccess: async (_data, inquiryId) => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.inquiries.list() })
      queryClient.removeQueries({ queryKey: platformQueryKeys.mypage.inquiries.detail(inquiryId) })
    },
    onError: async (_error, inquiryId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.inquiries.list() }),
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.inquiries.detail(inquiryId),
        }),
      ])
    },
  })
}
