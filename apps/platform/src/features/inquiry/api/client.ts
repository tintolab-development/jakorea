import { axiosClient } from '@/shared/api/axios-instance'
import { fetchAllApiPages } from '@/shared/lib/fetch-all-api-pages'

const PUBLIC_FAQS_PATH = '/api/portal/public/faqs'
const INQUIRIES_PATH = '/api/portal/me/inquiries'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

export type PublicFaqItem = {
  faqId?: number
  categoryId?: number
  categoryName?: string
  title?: string
  content?: string
  createdAt?: string
  updatedAt?: string
}

export type PublicFaqList = {
  items?: PublicFaqItem[]
}

export type PortalInquiryListItem = {
  inquiryId?: number
  category?: string
  programId?: number
  programName?: string
  title?: string
  status?: string
  displayStatus?: string
  inquiredAt?: string
  answeredAt?: string
}

export type PortalInquiryPage = {
  items?: PortalInquiryListItem[]
  totalElements?: number
}

export type PortalInquiryAnswer = {
  answerId?: number
  content?: string
  answeredAt?: string
}

export type PortalInquiryDetail = PortalInquiryListItem & {
  content?: string
  answers?: PortalInquiryAnswer[]
}

export type PortalInquiryCategoryOption = {
  categoryId?: number
  category?: string
}

export type PortalInquiryProgramOption = {
  programId?: number
  programName?: string
  programType?: string
}

export type PortalInquiryCreateBody = {
  category: string
  programId?: number
  title: string
  content: string
}

function assertSuccessfulMutationResponse(data: unknown, fallback: string): void {
  if (!data || typeof data !== 'object' || !('success' in data) || data.success === true) return
  const responseBody = data as { message?: unknown; error?: { message?: unknown } }
  const nested = responseBody.error?.message
  const message =
    (typeof nested === 'string' && nested.trim()) ||
    (typeof responseBody.message === 'string' && responseBody.message.trim()) ||
    ''
  throw new Error(message || fallback)
}

export async function fetchPublicFaqs(signal?: AbortSignal): Promise<PublicFaqItem[]> {
  const { data } = await axiosClient.get<unknown>(PUBLIC_FAQS_PATH, { signal })
  const unwrapped = unwrapEnvelope<PublicFaqList | PublicFaqItem[]>(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}

export async function fetchMyInquiries(signal?: AbortSignal): Promise<PortalInquiryListItem[]> {
  return fetchAllApiPages(async (page, size) => {
    const { data } = await axiosClient.get<unknown>(INQUIRIES_PATH, {
      signal,
      params: { page, size },
    })
    const unwrapped = unwrapEnvelope<PortalInquiryPage | PortalInquiryListItem[]>(data)
    if (Array.isArray(unwrapped)) {
      return { items: unwrapped, totalPages: 1 }
    }
    return {
      items: unwrapped.items ?? [],
      totalPages: (unwrapped as { totalPages?: number }).totalPages,
    }
  })
}

export async function fetchMyInquiryDetail(
  inquiryId: string,
  signal?: AbortSignal
): Promise<PortalInquiryDetail> {
  const { data } = await axiosClient.get<unknown>(`${INQUIRIES_PATH}/${inquiryId}`, { signal })
  return unwrapEnvelope<PortalInquiryDetail>(data)
}

export async function fetchInquiryCategoryOptions(
  signal?: AbortSignal
): Promise<PortalInquiryCategoryOption[]> {
  const { data } = await axiosClient.get<unknown>(`${INQUIRIES_PATH}/category-options`, { signal })
  const unwrapped = unwrapEnvelope<
    PortalInquiryCategoryOption[] | { items?: PortalInquiryCategoryOption[] }
  >(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}

export async function fetchInquiryProgramOptions(
  signal?: AbortSignal
): Promise<PortalInquiryProgramOption[]> {
  const { data } = await axiosClient.get<unknown>(`${INQUIRIES_PATH}/program-options`, { signal })
  const unwrapped = unwrapEnvelope<
    PortalInquiryProgramOption[] | { items?: PortalInquiryProgramOption[] }
  >(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}

export async function createMyInquiry(
  body: PortalInquiryCreateBody,
  idempotencyKey: string,
): Promise<void> {
  const key = idempotencyKey.trim()
  if (!key) throw new Error('문의 등록 요청 키가 없습니다.')
  const { data } = await axiosClient.post<unknown>(INQUIRIES_PATH, body, {
    headers: { 'Idempotency-Key': key },
  })
  assertSuccessfulMutationResponse(data, '문의 접수에 실패했습니다.')
}

export async function deleteMyInquiry(inquiryId: string): Promise<void> {
  const { data } = await axiosClient.delete<unknown>(`${INQUIRIES_PATH}/${inquiryId}`)
  assertSuccessfulMutationResponse(data, '문의 삭제에 실패했습니다.')
}
