/**
 * CMS 관리자 FAQ — mock 단일 저장소 또는 원격 API 연동
 * - `VITE_API_BASE_URL` 미설정: mock만 갱신
 * - 설정됨: HTTP 요청 성공 후 mock 동기화(목록·상세와 클라이언트 상태 일치)
 */

import type { AdminFaq } from '@/data/mock/admin-faqs'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  createAdminFaq,
  deleteAdminFaq,
  updateAdminFaq,
  upsertAdminFaq,
} from '@/features/posts/api/admin-faq-mock-store'

const ADMIN_FAQ_API_BASE_PATH =
  (import.meta.env.VITE_ADMIN_FAQ_API_BASE_PATH as string | undefined)?.replace(/\/$/, '') ??
  '/api/cms/admin/faqs'

function getRemoteBaseUrl(): string | null {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  return base || null
}

function collectionUrl(): string | null {
  const base = getRemoteBaseUrl()
  if (!base) return null
  return `${base}${ADMIN_FAQ_API_BASE_PATH}`
}

function itemUrl(id: string): string | null {
  const c = collectionUrl()
  if (!c) return null
  return `${c}/${encodeURIComponent(id)}`
}

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function jsonHeaders(): Record<string, string> {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
  }
}

function isAdminFaqStatus(v: unknown): v is AdminFaq['status'] {
  return v === 'published' || v === 'draft' || v === 'archived'
}

/** API 응답 `{ data: {...} }` 또는 평면 객체에서 AdminFaq 추출 */
function parseAdminFaqFromResponse(json: unknown): AdminFaq | null {
  if (!json || typeof json !== 'object') return null
  const root = json as Record<string, unknown>
  const raw =
    root.data != null && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root

  if (typeof raw.id !== 'string') return null
  if (typeof raw.question !== 'string' || typeof raw.answer !== 'string') return null

  const status = raw.status
  const safeStatus: AdminFaq['status'] = isAdminFaqStatus(status) ? status : 'draft'

  return {
    id: raw.id,
    category: typeof raw.category === 'string' ? raw.category : String(raw.category ?? ''),
    question: raw.question,
    answer: raw.answer,
    author: typeof raw.author === 'string' ? raw.author : String(raw.author ?? ''),
    status: safeStatus,
    createdAt:
      typeof raw.createdAt === 'string' ? raw.createdAt : String(raw.createdAt ?? new Date().toISOString()),
  }
}

export type FaqCreatePayload = Omit<AdminFaq, 'id'>

export type FaqUpdatePayload = Partial<
  Pick<AdminFaq, 'category' | 'question' | 'answer' | 'author' | 'status'>
>

/**
 * FAQ 등록
 * - mock: `createAdminFaq`
 * - 원격: `POST` 본문 JSON, 응답에 FAQ 엔티티가 있으면 그 id로 mock `upsert`, 없으면 로컬 생성으로 동기화
 */
export async function createFaq(payload: FaqCreatePayload): Promise<AdminFaq> {
  const url = collectionUrl()

  if (!url) {
    return createAdminFaq(payload)
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP_${res.status}`)
  }

  const text = await res.text().catch(() => '')
  if (text.trim()) {
    try {
      const parsed = parseAdminFaqFromResponse(JSON.parse(text) as unknown)
      if (parsed) {
        return upsertAdminFaq(parsed)
      }
    } catch {
      // 본문이 JSON이 아니면 아래 로컬 생성으로 폴백
    }
  }

  return createAdminFaq(payload)
}

/**
 * FAQ 수정
 * - mock: `updateAdminFaq`
 * - 원격: `PATCH`(또는 `PUT`) 후 mock 반영
 */
export async function updateFaq(id: string, patch: FaqUpdatePayload): Promise<AdminFaq> {
  const url = itemUrl(id)

  if (!url) {
    const local = updateAdminFaq(id, patch)
    if (!local) {
      throw new Error('NOT_FOUND')
    }
    return local
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: jsonHeaders(),
    credentials: 'include',
    body: JSON.stringify(patch),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(errText || `HTTP_${res.status}`)
  }

  const bodyText = await res.text().catch(() => '')
  if (bodyText.trim()) {
    try {
      const parsed = parseAdminFaqFromResponse(JSON.parse(bodyText) as unknown)
      if (parsed && parsed.id === id) {
        return upsertAdminFaq(parsed)
      }
      if (parsed) {
        return upsertAdminFaq({ ...parsed, id })
      }
    } catch {
      // JSON 아님 → patch만 반영
    }
  }

  const merged = updateAdminFaq(id, patch)
  if (!merged) {
    throw new Error('NOT_FOUND')
  }
  return merged
}

export async function deleteFaq(id: string): Promise<void> {
  const remoteUrl = itemUrl(id)

  if (!remoteUrl) {
    if (!deleteAdminFaq(id)) {
      throw new Error('NOT_FOUND')
    }
    return
  }

  const res = await fetch(remoteUrl, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP_${res.status}`)
  }

  deleteAdminFaq(id)
}

export async function deleteFaqs(ids: string[]): Promise<void> {
  for (const id of ids) {
    await deleteFaq(id)
  }
}
