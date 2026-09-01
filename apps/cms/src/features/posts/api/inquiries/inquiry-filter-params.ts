import type { Inquiries1Params } from '@/shared/api/generated/posts/schemas'

export const INQUIRY_LIST_PAGE_SIZE = 500

export function inquiriesParamsFromSearchParams(searchParams: URLSearchParams): Inquiries1Params {
  const params: Inquiries1Params = {
    page: 0,
    size: INQUIRY_LIST_PAGE_SIZE,
  }

  const status = searchParams.get('inq_st')
  if (status === 'PENDING') {
    params.status = 'PENDING'
  } else if (status === 'ANSWERED') {
    params.status = 'ANSWERED'
  }

  const programId = searchParams.get('inq_prog')
  if (programId && /^\d+$/.test(programId)) {
    params.programId = Number(programId)
  }

  return params
}
