/**
 * CMS 관리자 문의 목록 mock 단일 저장소 — 목록·삭제가 동일 배열 참조
 */

import dayjs from 'dayjs'
import { mockInquiries } from '@/data/mock/inquiries'
import type { AdminInquiryDetail, AdminInquiryRow } from '@/features/posts/model/admin-inquiry-management.types'

const TARGET_LIST_COUNT = 130

const POOL_CATEGORIES = [
  '계정',
  '프로그램',
  '결제',
  '활동',
  '봉사시간',
  '시스템',
  '정산',
  '안내',
  '기타',
] as const

const PROGRAM_POOL = ['제미나이 봉사 교실', '경제 리터러시', '진로 설계', '봉사단 정기', null] as const
const ASSIGNEE_POOL = ['홍길동', '김담당', '이운영', '박지원', null] as const

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function phoneFromId(id: string): string {
  const h = hashString(id)
  const a = String(1000 + (h % 9000)).padStart(4, '0')
  const b = String(2000 + ((h >> 8) % 7000)).padStart(4, '0')
  return `010-${a}-${b}`
}

function emailFromMember(name: string, id: string): string {
  const slug = name.replace(/\s+/g, '').toLowerCase() || 'user'
  return `${slug}${hashString(id) % 10000}@naver.com`
}

function mapFromUserMock(): AdminInquiryRow[] {
  return mockInquiries.map(i => ({
    id: i.id,
    title: i.title,
    category: i.category,
    status: i.status,
    createdAt: i.createdAt,
    memberName: i.author,
    programName: i.category === '활동' ? '봉사 프로그램 A' : null,
    assignee: i.status === 'ANSWERED' ? (i.answer?.author ?? '홍길동') : null,
    answeredAt: i.answer?.answeredAt ?? null,
    body: i.content,
    phone: phoneFromId(i.id),
    email: emailFromMember(i.author, i.id),
    answerMarkdown: i.answer?.content ?? null,
  }))
}

function buildGeneratedRows(count: number): AdminInquiryRow[] {
  const rows: AdminInquiryRow[] = []
  for (let i = 1; i <= count; i++) {
    const id = `inq-gen-${i}`
    const status = i % 4 === 0 ? 'ANSWERED' : 'PENDING'
    const cat = POOL_CATEGORIES[i % POOL_CATEGORIES.length]
    const created = dayjs('2026-01-01')
      .add(i, 'day')
      .hour(10 + (i % 12))
      .minute((i * 7) % 60)
      .second((i * 3) % 60)
    const createdAt = created.toISOString()
    const answeredAt =
      status === 'ANSWERED'
        ? created.add(1, 'day').hour(14).minute(20).second(0).toISOString()
        : null
    const memberName = `회원${i}`
    rows.push({
      id,
      title: `문의 제목 샘플 ${i}`,
      category: cat,
      status,
      createdAt,
      memberName,
      programName: PROGRAM_POOL[i % PROGRAM_POOL.length],
      assignee:
        status === 'ANSWERED' ? (ASSIGNEE_POOL[i % ASSIGNEE_POOL.length] ?? '홍길동') : null,
      answeredAt,
      body: `문의 내용 샘플입니다. 문의 제목과 관련하여 상세 설명을 작성한 본문입니다. (일련번호 ${i})`,
      phone: phoneFromId(id),
      email: emailFromMember(memberName, id),
      answerMarkdown:
        status === 'ANSWERED'
          ? `안녕하세요. 문의 주신 내용 확인하였습니다. (답변 샘플 ${i})`
          : null,
    })
  }
  return rows
}

function buildSeed(): AdminInquiryRow[] {
  const fromMock = mapFromUserMock()
  const need = Math.max(0, TARGET_LIST_COUNT - fromMock.length)
  const generated = buildGeneratedRows(need)
  return [...fromMock, ...generated]
}

let adminInquiries: AdminInquiryRow[] | null = null

function seed(): AdminInquiryRow[] {
  if (!adminInquiries) {
    adminInquiries = buildSeed()
  }
  return adminInquiries
}

export function listAdminInquiries(): AdminInquiryRow[] {
  return seed().map(r => ({ ...r }))
}

export function getAdminInquiryDetail(id: string): AdminInquiryDetail | null {
  const row = seed().find(r => r.id === id)
  if (!row) return null
  return { ...row }
}

export function submitAdminInquiryReply(id: string, markdown: string): boolean {
  const list = seed()
  const idx = list.findIndex(r => r.id === id)
  if (idx < 0) return false
  const row = list[idx]
  const next: AdminInquiryRow = {
    ...row,
    status: 'ANSWERED',
    answeredAt: dayjs().toISOString(),
    answerMarkdown: markdown.trim(),
    assignee: row.assignee ?? '관리자',
  }
  list[idx] = next
  return true
}

export function deleteAdminInquiries(ids: string[]): void {
  const list = seed()
  const idSet = new Set(ids)
  const next = list.filter(r => !idSet.has(r.id))
  adminInquiries = next
}
