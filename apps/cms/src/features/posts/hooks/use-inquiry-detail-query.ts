import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getInquiryDetail } from '@/features/posts/api/inquiries/admin-inquiries-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { removeInquiryDetailQueries } from '@/features/posts/lib/inquiry-query-cache'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'
import type { AdminInquiryDetail } from '@/features/posts/model/admin-inquiry-management.types'
import {
  isAuditLogUnavailableError,
  isForbiddenApiError,
} from '@/shared/lib/privacy-audit-error'

export const INQUIRY_DETAIL_AUDIT_UNAVAILABLE_MESSAGE =
  '개인정보 조회 기록을 저장하지 못해 문의 정보를 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.'

export const INQUIRY_DETAIL_FORBIDDEN_MESSAGE = '문의 조회 권한이 없습니다.'

export type InquiryDetailPrivacyFailure = 'forbidden' | 'audit-unavailable'

export function readInquiryDetailPrivacyFailure(
  error: unknown
): InquiryDetailPrivacyFailure | null {
  if (!error) return null
  if (isAuditLogUnavailableError(error)) return 'audit-unavailable'
  if (isForbiddenApiError(error)) return 'forbidden'
  return null
}

export function inquiryDetailPrivacyMessage(failure: InquiryDetailPrivacyFailure): string {
  return failure === 'audit-unavailable'
    ? INQUIRY_DETAIL_AUDIT_UNAVAILABLE_MESSAGE
    : INQUIRY_DETAIL_FORBIDDEN_MESSAGE
}

/**
 * 문의 상세 개인정보는 서버 응답을 그대로 표시한다.
 * 원문은 query cache에 남기지 않고, 403·감사 실패 시 이전 상세를 보여 주지 않는다.
 */
export function useInquiryDetailQuery(inquiryId: string | null, enabled = true) {
  const remoteEnabled = usePostsRemoteEnabled('inquiries', enabled && Boolean(inquiryId))
  const queryClient = useQueryClient()
  const [privacyFailure, setPrivacyFailure] = useState<InquiryDetailPrivacyFailure | null>(null)

  useEffect(() => {
    setPrivacyFailure(null)
  }, [enabled, inquiryId])

  const query = useQuery({
    queryKey: postsQueryKeys.inquiries.detail(inquiryId ?? ''),
    queryFn: () => getInquiryDetail(inquiryId!),
    enabled: remoteEnabled && privacyFailure == null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!query.isError) return
    const failure = readInquiryDetailPrivacyFailure(query.error)
    if (!failure) return
    setPrivacyFailure(current => current ?? failure)
  }, [query.error, query.isError])

  useEffect(() => {
    if (!privacyFailure || !inquiryId) return
    removeInquiryDetailQueries(queryClient, inquiryId)
  }, [inquiryId, privacyFailure, queryClient])

  useEffect(() => {
    if (enabled || !inquiryId) return
    removeInquiryDetailQueries(queryClient, inquiryId)
  }, [enabled, inquiryId, queryClient])

  const resolvedPrivacyFailure =
    privacyFailure ?? readInquiryDetailPrivacyFailure(query.error)
  const detail: AdminInquiryDetail | null =
    resolvedPrivacyFailure || query.isError ? null : (query.data ?? null)

  return {
    ...query,
    detail,
    privacyFailure: resolvedPrivacyFailure,
    privacyMessage: resolvedPrivacyFailure
      ? inquiryDetailPrivacyMessage(resolvedPrivacyFailure)
      : null,
  }
}
