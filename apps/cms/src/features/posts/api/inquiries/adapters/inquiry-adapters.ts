import type {
  AdminInquiryDetail,
  AdminInquiryRow,
} from '@/features/posts/model/admin-inquiry-management.types'
import type {
  InquiryAnswerResponse,
  InquiryResponse,
  PageResponse,
} from '@/shared/api/generated/posts/schemas'

function mapInquiryStatus(value: string | undefined): AdminInquiryRow['status'] {
  const normalized = (value ?? '').toUpperCase()
  if (
    normalized === 'ANSWERED' ||
    normalized === 'COMPLETED' ||
    normalized === 'CLOSED'
  ) {
    return 'ANSWERED'
  }
  return 'PENDING'
}

function mapInquiryBase(dto: InquiryResponse): AdminInquiryRow {
  return {
    id: dto.id != null ? String(dto.id) : '',
    title: dto.title ?? '',
    category: dto.category ?? '',
    status: mapInquiryStatus(dto.status),
    createdAt: dto.createdAt ?? new Date().toISOString(),
    memberName:
      dto.inquirerName?.trim() ||
      (dto.inquirerMemberId != null ? `회원 #${dto.inquirerMemberId}` : '-'),
    programName: dto.programNameSnapshot ?? null,
    programId: dto.programId != null ? String(dto.programId) : undefined,
    assignee:
      dto.assignedAdminName?.trim() ||
      (dto.assignedAdminId != null ? `관리자 #${dto.assignedAdminId}` : null),
    answeredAt: dto.answeredAt ?? null,
    body: dto.content ?? '',
    phone: dto.inquirerPhone?.trim() || '-',
    email: dto.inquirerEmail?.trim() || '-',
    answerMarkdown: null,
  }
}

export function mapInquiryListResponse(dto: PageResponse): AdminInquiryRow[] {
  return (dto.items ?? [])
    .filter((item): item is InquiryResponse => item != null && typeof item === 'object')
    .map(item => mapInquiryBase(item as InquiryResponse))
}

export function mapInquiryDetail(
  dto: InquiryResponse,
  answers: InquiryAnswerResponse[]
): AdminInquiryDetail {
  const base = mapInquiryBase(dto)
  const latestAnswer = [...answers].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
    return bTime - aTime
  })[0]

  return {
    ...base,
    answerMarkdown: latestAnswer?.content ?? null,
    status: latestAnswer?.content ? 'ANSWERED' : base.status,
    answeredAt: latestAnswer?.createdAt ?? base.answeredAt,
    assignee:
      latestAnswer?.answeredByAdminId != null
        ? `관리자 #${latestAnswer.answeredByAdminId}`
        : base.assignee,
  }
}
