import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { FaqItem, OneToOneInquiryItem, OneToOneInquiryStatus, OneToOneInquiryWritePayload } from '../model/types'
import {
  createMyInquiry,
  deleteMyInquiry,
  fetchInquiryCategoryOptions,
  fetchInquiryProgramOptions,
  fetchMyInquiries,
  fetchMyInquiryDetail,
  fetchPublicFaqs,
  type PortalInquiryDetail,
  type PortalInquiryListItem,
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

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatKoreanDate(value: string | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}년 ${pad(date.getMonth() + 1)}월 ${pad(date.getDate())}일`
}

function mapInquiryStatus(status: string | undefined, displayStatus: string | undefined): OneToOneInquiryStatus {
  const label = displayStatus?.trim() ?? ''
  if (label.includes('대기')) return 'pending'
  if (label.includes('완료') || label.includes('답변')) return 'answered'
  const token = (status ?? '').trim().toUpperCase()
  if (token === 'ANSWERED' || token === 'COMPLETED' || token === 'DONE') return 'answered'
  return 'pending'
}

function mapFaq(item: {
  faqId?: number
  categoryName?: string
  title?: string
  content?: string
}, index: number): FaqItem | null {
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

function mapInquiryListItem(item: PortalInquiryListItem, index: number): OneToOneInquiryItem | null {
  if (item.inquiryId == null) return null
  return {
    id: String(item.inquiryId),
    category: item.category?.trim() || '기타',
    title: item.title?.trim() || '문의',
    status: mapInquiryStatus(item.status, item.displayStatus),
    createdAt: formatKoreanDate(item.inquiredAt ?? item.answeredAt),
    programName: item.programName?.trim() || '해당 없음',
    question: '',
    order: index,
  }
}

function mapInquiryDetail(detail: PortalInquiryDetail): Partial<OneToOneInquiryItem> {
  const answer = detail.answers?.map(item => item.content?.trim()).filter(Boolean).join('\n\n')
  return {
    category: detail.category?.trim() || undefined,
    title: detail.title?.trim() || undefined,
    status: mapInquiryStatus(detail.status, detail.displayStatus),
    createdAt: formatKoreanDate(detail.inquiredAt ?? detail.answeredAt) || undefined,
    programName: detail.programName?.trim() || undefined,
    question: detail.content?.trim() || '',
    answer: answer || undefined,
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
    mutationFn: (payload: OneToOneInquiryWritePayload) => {
      const programId = Number(payload.programValue)
      return createMyInquiry({
        category: payload.category,
        title: payload.title,
        content: payload.content,
        ...(Number.isFinite(programId) && programId > 0 ? { programId } : {}),
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.inquiries.all() })
    },
  })
}

export function useDeleteMyInquiryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inquiryId: string) => deleteMyInquiry(inquiryId),
    onSuccess: (_data, inquiryId) => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.inquiries.list() })
      queryClient.removeQueries({ queryKey: platformQueryKeys.mypage.inquiries.detail(inquiryId) })
    },
  })
}
