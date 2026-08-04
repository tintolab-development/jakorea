/**
 * CMS 관리자 공지 mock 단일 저장소 — 목록·상세·폼이 동일 배열을 참조
 * 실 API 연동 시 동일 시그니처 서비스로 교체 가능
 */

import {
  ADMIN_NOTICE_MOCK_LIST_COUNT,
  buildAdminNoticeMockList,
  mockProgramResultNotices,
  type Notice,
} from '@/data/mock/notices'

let adminNotices: Notice[] | null = null

function seed(): Notice[] {
  if (!adminNotices) {
    adminNotices = [
      ...buildAdminNoticeMockList(ADMIN_NOTICE_MOCK_LIST_COUNT),
      ...mockProgramResultNotices,
    ].map(n => ({ ...n }))
  }
  return adminNotices
}

export function listAdminNotices(): Notice[] {
  return seed().map(n => ({ ...n }))
}

export function getAdminNoticeById(id: string): Notice | undefined {
  const found = seed().find(n => n.id === id)
  return found ? { ...found } : undefined
}

function nextAdminNoticeId(): string {
  const list = seed()
  const max = list.reduce((acc, n) => {
    const m = /^notice-admin-(\d+)$/.exec(n.id)
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc
  }, 0)
  return `notice-admin-${max + 1}`
}

export function createAdminNotice(draft: Omit<Notice, 'id'>): Notice {
  const list = seed()
  const notice: Notice = {
    ...draft,
    id: nextAdminNoticeId(),
  }
  list.unshift(notice)
  return { ...notice }
}

export function updateAdminNotice(id: string, patch: Partial<Notice>): Notice | undefined {
  const list = seed()
  const i = list.findIndex(n => n.id === id)
  if (i === -1) return undefined
  list[i] = { ...list[i], ...patch }
  return { ...list[i] }
}

/** 삭제 성공 시 `true`, 해당 id가 없으면 `false` */
export function deleteAdminNotice(id: string): boolean {
  const list = seed()
  const i = list.findIndex(n => n.id === id)
  if (i === -1) return false
  list.splice(i, 1)
  return true
}
