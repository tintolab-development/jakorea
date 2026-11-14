import { POSTS_LIST_PAGE_SIZE } from '@/features/posts/api/posts-list-page'
import type { Inquiries1Params } from '@/shared/api/generated/posts/schemas'

export const INQUIRY_LIST_PAGE_SIZE = POSTS_LIST_PAGE_SIZE

export function inquiriesParamsFromSearchParams(
  searchParams: URLSearchParams,
  page = 0
): Inquiries1Params {
  const params: Inquiries1Params = {
    page,
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

  /* 대시보드에서 온 프로그램 ID가 있으면 ID로만 조회한다(이름 조건을 같이 걸면 스냅샷 이름과 달라 0건이 될 수 있다). */
  const programId = searchParams.get('inq_pid')?.trim()
  const program = searchParams.get('inq_prog')?.trim()
  if (programId && /^\d+$/.test(programId)) {
    params.programId = Number(programId)
  } else if (program && /^\d+$/.test(program)) {
    /* 이전 대시보드 링크(inq_prog=ID) 호환 */
    params.programId = Number(program)
  } else if (program) {
    params.programName = program
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
