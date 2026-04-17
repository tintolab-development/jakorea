/**
 * CMS 관리자 FAQ 목록용 Mock — 사용자용 `mockFAQs`와 별도 시드
 */

import dayjs from 'dayjs'
import { ADMIN_FAQ_CATEGORY_SEED_NAMES } from '@/data/mock/admin-faq-seeds'
import { mockFAQs } from '@/data/mock/faqs'

export interface AdminFaq {
  id: string
  /** 카테고리 관리 모달 라벨과 문자열 일치 */
  category: string
  question: string
  answer: string
  author: string
  status: 'published' | 'draft' | 'archived'
  createdAt: string
}

const AUTHORS = ['홍길동', '이정재', '관리자', '운영팀', 'IT지원팀', '대외협력팀']

function statusForIndex(i: number): AdminFaq['status'] {
  const r = i % 17
  if (r === 0) return 'draft'
  if (r === 1) return 'archived'
  return 'published'
}

/** 스크린샷 수준 데모 건수 */
export const ADMIN_FAQ_MOCK_LIST_COUNT = 130

/**
 * 관리자 FAQ 목록 시드 — 카테고리는 초기 FAQ 카테고리 라벨을 순환
 */
export function buildAdminFaqMockList(count: number = ADMIN_FAQ_MOCK_LIST_COUNT): AdminFaq[] {
  const categoryLabels = [...ADMIN_FAQ_CATEGORY_SEED_NAMES]
  const nCat = categoryLabels.length
  const questions = mockFAQs.map(f => f.question)
  const answers = mockFAQs.map(f => f.answer)
  const nQ = questions.length
  const take = Math.min(Math.max(0, count), 999)

  return Array.from({ length: take }, (_, i) => {
    const cat = categoryLabels[i % nCat]
    const seedIdx = i % nQ
    const qBase = questions[seedIdx]
    const question = i < nQ ? qBase : `${qBase} (${i + 1})`
    const answer = answers[seedIdx]
    const createdAt = dayjs('2025-09-15T10:00:00').add(i, 'hour').format('YYYY-MM-DDTHH:mm:ss')
    return {
      id: `faq-admin-${i + 1}`,
      category: cat,
      question,
      answer,
      author: AUTHORS[i % AUTHORS.length],
      status: statusForIndex(i),
      createdAt,
    }
  })
}
