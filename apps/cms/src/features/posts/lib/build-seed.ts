import { ADMIN_FAQ_CATEGORY_SEED_NAMES } from '@/features/posts/model/admin-faq-category-seeds'
import { createInitialNoticeCategoryRows } from '@/features/posts/model/admin-notice-management-filter-fields'

export const POSTS_SEED_LABEL = 'posts-fe-mock-v1'

export type PostsApiVisibilityStatus = 'published' | '임시저장' | 'archived'

const ASSIGNED_ADMIN_NAME_TO_ID: Record<string, number> = {
  이름예시: 10,
  김담당: 11,
  이운영: 12,
  박지원: 13,
  '운영팀 관리자': 20,
  IT지원팀: 21,
  관리자: 1,
}

export function toPostsApiStatus(
  status: 'published' | 'draft' | 'archived'
): PostsApiVisibilityStatus {
  if (status === 'draft') return '임시저장'
  return status
}

export function inquiryMockIdToSeedPk(mockId: string): number {
  if (/^\d+$/.test(mockId)) return Number(mockId)
  const gen = /^inq-gen-(\d+)$/.exec(mockId)
  if (!gen) throw new Error(`unexpected inquiry mock id: ${mockId}`)
  return 800_000 + Number(gen[1])
}

export function inquiryMockIdToMemberId(mockId: string): number {
  if (/^\d+$/.test(mockId)) return 1_000 + Number(mockId)
  const gen = /^inq-gen-(\d+)$/.exec(mockId)
  if (!gen) throw new Error(`unexpected inquiry mock id: ${mockId}`)
  return 810_000 + Number(gen[1])
}

export function assignedAdminNameToStubId(name: string | null): number | null {
  if (!name) return null
  const known = ASSIGNED_ADMIN_NAME_TO_ID[name]
  if (known != null) return known
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0
  }
  return 50 + (Math.abs(h) % 50)
}

function categoryRowsFrom(rows: { id: string; name: string }[]) {
  return rows.map((row, index) => ({
    seedKey: row.id,
    suggestedNumericId: index + 1,
    categoryName: row.name,
    name: row.name,
    status: 'active',
    displayOrder: index,
  }))
}

export function buildNoticesSeedPayload() {
  return {
    meta: {
      domain: 'notices',
      seedLabel: POSTS_SEED_LABEL,
      ssot: 'remote API',
      categorySsot: 'createInitialNoticeCategoryRows()',
      upsertKeys: ['seedKey'],
      note: 'FE mock removed — populate from API export.',
      statusMap: { published: 'published', draft: '임시저장', archived: 'archived' },
    },
    categories: categoryRowsFrom(createInitialNoticeCategoryRows()),
    rows: [],
  }
}

export function buildFaqsSeedPayload() {
  return {
    meta: {
      domain: 'faqs',
      seedLabel: POSTS_SEED_LABEL,
      ssot: 'remote API',
      categorySsot: 'ADMIN_FAQ_CATEGORY_SEED_NAMES',
      upsertKeys: ['seedKey'],
    },
    categories: ADMIN_FAQ_CATEGORY_SEED_NAMES.map((name, index) => ({
      seedKey: `faq-cat-${index + 1}`,
      suggestedNumericId: index + 1,
      categoryName: name,
      name,
      status: 'active',
      displayOrder: index,
    })),
    rows: [],
  }
}

export function buildInquiriesSeedPayload() {
  return {
    meta: {
      domain: 'inquiries',
      seedLabel: POSTS_SEED_LABEL,
      ssot: 'remote API',
      upsertKeys: ['seedKey'],
    },
    categories: [],
    rows: [],
  }
}
