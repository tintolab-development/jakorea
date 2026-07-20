import {
  mapInquiryDetail,
  mapInquiryListResponse,
} from '@/features/posts/api/inquiries/adapters/inquiry-adapters'
import { inquiriesParamsFromSearchParams } from '@/features/posts/api/inquiries/inquiry-filter-params'
import {
  createInquiryAnswerRemote,
  fetchInquiriesRemote,
  fetchInquiryAnswersRemote,
  fetchInquiryRemote,
  updateInquiryAnswerRemote,
} from '@/features/posts/api/inquiries/inquiries-api-client'
import type {
  AdminInquiryDetail,
  AdminInquiryRow,
} from '@/features/posts/model/admin-inquiry-management.types'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertInquiriesRemoteReady(): void {
  if (!isRealApiModuleEnabled('inquiries')) {
    throw new Error('문의 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 inquiries를 추가해 주세요.')
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('문의 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseInquiriesRemoteApi(): boolean {
  return isRealApiModuleEnabled('inquiries') && hasRemoteAdminJwt()
}

export async function getInquiryList(searchParams: URLSearchParams): Promise<AdminInquiryRow[]> {
  assertInquiriesRemoteReady()
  const dto = await fetchInquiriesRemote(inquiriesParamsFromSearchParams(searchParams))
  return mapInquiryListResponse(dto)
}

export async function getInquiryDetail(id: string): Promise<AdminInquiryDetail> {
  assertInquiriesRemoteReady()
  const [inquiry, answers] = await Promise.all([
    fetchInquiryRemote(id),
    fetchInquiryAnswersRemote(id),
  ])
  return mapInquiryDetail(inquiry, answers)
}

export async function submitInquiryReply(inquiryId: string, content: string): Promise<void> {
  assertInquiriesRemoteReady()
  const answers = await fetchInquiryAnswersRemote(inquiryId)
  const trimmed = content.trim()
  if (!trimmed) {
    throw new Error('답변 내용을 입력해 주세요.')
  }

  if (answers.length > 0 && answers[0]?.id != null) {
    await updateInquiryAnswerRemote(inquiryId, String(answers[0].id), {
      content: trimmed,
      status: 'ANSWERED',
    })
    return
  }

  await createInquiryAnswerRemote(inquiryId, {
    content: trimmed,
    status: 'ANSWERED',
  })
}
