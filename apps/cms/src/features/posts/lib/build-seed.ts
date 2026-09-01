import { ADMIN_FAQ_CATEGORY_SEED_NAMES } from '@/data/mock/admin-faq-seeds'
import { mockInquiries } from '@/data/mock/inquiries'
import { listAdminFaqs } from '@/features/posts/api/admin-faq-mock-store'
import { listInquiryCategoryRows } from '@/features/posts/api/admin-inquiry-category-mock-store'
import { listAdminInquiries } from '@/features/posts/api/admin-inquiry-mock-store'
import { listAdminNotices } from '@/features/posts/api/admin-notice-mock-store'
import { createInitialNoticeCategoryRows } from '@/features/posts/model/admin-notice-management-filter-fields'

export const POSTS_SEED_LABEL = 'posts-fe-mock-v1'

export type PostsApiVisibilityStatus = 'published' | '임시저장' | 'archived'

const ASSIGNED_ADMIN_NAME_TO_ID: Record<string, number> = {
  홍길동: 10,
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

/** mock `inq-gen-12` → 예약 numeric PK `800012`. 숫자 id(`1`~`7`)는 그대로. */
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
  const notices = listAdminNotices()
  return {
    meta: {
      domain: 'notices',
      seedLabel: POSTS_SEED_LABEL,
      ssot: 'apps/cms/src/features/posts/api/admin-notice-mock-store.ts',
      categorySsot: 'createInitialNoticeCategoryRows()',
      upsertKeys: ['seedKey'],
      note: '필독 is a filter option in mock category rows, not a notice.category value. Keep it as a category row so the CMS modal matches mock.',
      statusMap: { published: 'published', draft: '임시저장', archived: 'archived' },
    },
    categories: categoryRowsFrom(createInitialNoticeCategoryRows()),
    rows: notices.map(row => ({
      seedKey: row.id,
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      createdAt: row.createdAt,
      isImportant: row.isImportant,
      viewCount: row.viewCount,
      hasAttachment: row.hasAttachment,
      attachmentNames: (row.attachments ?? []).map(a => a.name),
      author: row.author,
      status: toPostsApiStatus(row.status),
    })),
  }
}

export function buildFaqsSeedPayload() {
  const faqs = listAdminFaqs()
  return {
    meta: {
      domain: 'faqs',
      seedLabel: POSTS_SEED_LABEL,
      ssot: 'apps/cms/src/features/posts/api/admin-faq-mock-store.ts',
      categorySsot: 'apps/cms/src/data/mock/admin-faq-seeds.ts ADMIN_FAQ_CATEGORY_SEED_NAMES',
      upsertKeys: ['seedKey'],
      statusMap: { published: 'published', draft: '임시저장', archived: 'archived' },
    },
    categories: ADMIN_FAQ_CATEGORY_SEED_NAMES.map((name, index) => ({
      seedKey: `faq-cat-${index}`,
      suggestedNumericId: index + 1,
      categoryName: name,
      name,
      status: 'active',
      displayOrder: index,
    })),
    rows: faqs.map(row => ({
      seedKey: row.id,
      id: row.id,
      category: row.category,
      question: row.question,
      answer: row.answer,
      author: row.author,
      status: toPostsApiStatus(row.status),
      createdAt: row.createdAt,
    })),
  }
}

export function buildInquiriesSeedPayload() {
  const rows = listAdminInquiries()
  const platformById = new Map(mockInquiries.map(i => [i.id, i]))

  return {
    meta: {
      domain: 'inquiries',
      seedLabel: POSTS_SEED_LABEL,
      ssot: 'apps/cms/src/features/posts/api/admin-inquiry-mock-store.ts',
      categorySsot: 'createInitialInquiryCategoryRows()',
      upsertKeys: ['suggestedNumericId'],
      idMapNote:
        'FE mock id 1~7 stay numeric. inq-gen-N → 800000+N. API InquiryResponse.id is number.',
      memberNote:
        'G2: persist inquirerName/phone/email on inquiry or member stub. FE currently falls back to 회원 #{id}.',
    },
    categories: categoryRowsFrom(listInquiryCategoryRows()),
    rows: rows.map(row => {
      const suggestedNumericId = inquiryMockIdToSeedPk(row.id)
      const inquirerMemberId = inquiryMockIdToMemberId(row.id)
      const assignedAdminId = assignedAdminNameToStubId(row.assignee)
      const platform = platformById.get(row.id)
      return {
        seedKey: row.id,
        suggestedNumericId,
        category: row.category,
        programId: null as number | null,
        programNameSnapshot: row.programName,
        inquirerMemberId,
        inquirerName: row.memberName,
        inquirerPhone: row.phone,
        inquirerEmail: row.email,
        userIdHint: platform?.userId ?? null,
        title: row.title,
        content: row.body,
        status: row.status,
        assignedAdminId,
        assignedAdminName: row.assignee,
        answeredAt: row.answeredAt,
        createdAt: row.createdAt,
        answer:
          row.status === 'ANSWERED' && row.answerMarkdown
            ? {
                seedKey: `${row.id}-answer`,
                content: row.answerMarkdown,
                status: 'ANSWERED' as const,
                answeredByAdminId: assignedAdminId,
                createdAt: row.answeredAt,
              }
            : null,
      }
    }),
  }
}
