import type { Inquiries1Params } from '@/shared/api/generated/posts/schemas'

export const INQUIRY_LIST_PAGE_SIZE = 500

export function inquiriesParamsFromSearchParams(searchParams: URLSearchParams): Inquiries1Params {
  const params: Inquiries1Params = {
    page: 0,
    size: INQUIRY_LIST_PAGE_SIZE,
  }

  const status = searchParams.get('inq_st')
  if (status === 'PENDING') {
    params.status = 'pending'
  } else if (status === 'ANSWERED') {
    params.status = 'answered'
  }

  const category = searchParams.get('inq_cat')?.trim()
  if (category && category !== 'ALL') params.category = category

  const program = searchParams.get('inq_prog')?.trim()
  if (program) {
    params.programName = program
    if (/^\d+$/.test(program)) params.programId = Number(program)
  }

  const title = searchParams.get('inq_title')?.trim()
  if (title) params.title = title

  const inquirerName = searchParams.get('inq_mem')?.trim()
  if (inquirerName) params.inquirerName = inquirerName

  const assigneeName = searchParams.get('inq_asg')?.trim()
  if (assigneeName) params.assigneeName = assigneeName

  const createdFrom = searchParams.get('inq_from')?.trim()
  const createdTo = searchParams.get('inq_to')?.trim()
  if (createdFrom) params.createdFrom = createdFrom
  if (createdTo) params.createdTo = createdTo

  return params
}
