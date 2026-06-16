import type { AdminFaq } from '@/data/mock/admin-faqs'
import type {
  FaqRequest,
  FaqResponse,
  PageResponseFaqResponse,
} from '@/shared/api/generated/posts/schemas'

function parseFaqStatus(value: string | undefined): AdminFaq['status'] {
  if (value === 'published' || value === 'draft' || value === 'archived') return value
  return 'draft'
}

export function mapFaqResponse(dto: FaqResponse): AdminFaq {
  return {
    id: dto.id ?? '',
    category: dto.category ?? '',
    question: dto.question ?? '',
    answer: dto.answer ?? '',
    author: dto.author ?? '',
    status: parseFaqStatus(dto.status),
    createdAt: dto.createdAt ?? new Date().toISOString(),
  }
}

export function mapFaqListResponse(dto: PageResponseFaqResponse): AdminFaq[] {
  return (dto.items ?? []).map(mapFaqResponse)
}

export type FaqCreatePayload = Omit<AdminFaq, 'id'>

export type FaqUpdatePayload = Partial<
  Pick<AdminFaq, 'category' | 'question' | 'answer' | 'author' | 'status'>
>

export function toFaqRequest(payload: FaqCreatePayload | FaqUpdatePayload): FaqRequest {
  return {
    category: payload.category,
    question: payload.question,
    answer: payload.answer,
    author: payload.author,
    status: payload.status,
  }
}
