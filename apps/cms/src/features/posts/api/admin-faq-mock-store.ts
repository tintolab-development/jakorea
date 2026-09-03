/**
 * CMS 관리자 FAQ mock 단일 저장소 — 목록·폼이 동일 배열을 참조
 */

import {
  ADMIN_FAQ_MOCK_LIST_COUNT,
  buildAdminFaqMockList,
  type AdminFaq,
} from '@/data/mock/admin-faqs'

let adminFaqs: AdminFaq[] | null = null

function seed(): AdminFaq[] {
  if (!adminFaqs) {
    adminFaqs = buildAdminFaqMockList(ADMIN_FAQ_MOCK_LIST_COUNT).map(f => ({ ...f }))
  }
  return adminFaqs
}

export function listAdminFaqs(): AdminFaq[] {
  return seed().map(f => ({ ...f }))
}

export function getAdminFaqById(id: string): AdminFaq | undefined {
  const found = seed().find(f => f.id === id)
  return found ? { ...found } : undefined
}

function nextAdminFaqId(): string {
  const list = seed()
  const max = list.reduce((acc, f) => {
    const m = /^faq-admin-(\d+)$/.exec(f.id)
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc
  }, 0)
  return `faq-admin-${max + 1}`
}

export function createAdminFaq(draft: Omit<AdminFaq, 'id'>): AdminFaq {
  const list = seed()
  const faq: AdminFaq = {
    ...draft,
    id: nextAdminFaqId(),
  }
  list.unshift(faq)
  return { ...faq }
}

export function updateAdminFaq(id: string, patch: Partial<AdminFaq>): AdminFaq | undefined {
  const list = seed()
  const i = list.findIndex(f => f.id === id)
  if (i === -1) return undefined
  const now = new Date().toISOString()
  list[i] = { ...list[i], ...patch, updatedAt: patch.updatedAt ?? now }
  return { ...list[i] }
}

/** 원격 생성 응답 등 id 기준으로 없으면 앞에 추가, 있으면 병합 */
export function upsertAdminFaq(faq: AdminFaq): AdminFaq {
  const list = seed()
  const i = list.findIndex(f => f.id === faq.id)
  if (i === -1) {
    list.unshift({ ...faq })
    return { ...list[0] }
  }
  list[i] = { ...list[i], ...faq }
  return { ...list[i] }
}

/** 삭제 성공 시 `true`, 해당 id가 없으면 `false` */
export function deleteAdminFaq(id: string): boolean {
  const list = seed()
  const i = list.findIndex(f => f.id === id)
  if (i === -1) return false
  list.splice(i, 1)
  return true
}
