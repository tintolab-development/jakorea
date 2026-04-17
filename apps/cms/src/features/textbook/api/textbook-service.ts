import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  createTextbook as createTextbookInMockStore,
  deleteTextbook as deleteTextbookInMockStore,
  listTextbooks,
  updateTextbook as updateTextbookInMockStore,
} from '@/features/textbook/api/textbook-mock-store'
import type { TextbookCreateInput, TextbookRow } from '@/features/textbook/model/textbook.types'

const TEXTBOOKS_API_BASE_PATH =
  (import.meta.env.VITE_TEXTBOOKS_API_BASE_PATH as string | undefined)?.replace(/\/$/, '') ??
  '/api/cms/textbooks'

function getApiBaseUrl(): string | null {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  return base ? base.replace(/\/$/, '') : null
}

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function listTextbooksFromStore(): TextbookRow[] {
  return listTextbooks()
}

export async function createTextbook(input: TextbookCreateInput): Promise<TextbookRow> {
  const base = getApiBaseUrl()
  const registrant = useAuthStore.getState().user?.name?.trim() || '관리자'

  if (!base) {
    return createTextbookInMockStore(input, registrant)
  }

  const response = await fetch(`${base}${TEXTBOOKS_API_BASE_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `HTTP_${response.status}`)
  }

  // 실서버 응답 스키마 확정 전까지 로컬 mock 저장소도 동일하게 갱신해 화면 일관성 유지
  return createTextbookInMockStore(input, registrant)
}

export async function deleteTextbooks(ids: string[]): Promise<void> {
  const base = getApiBaseUrl()

  if (!base) {
    for (const id of ids) {
      if (!deleteTextbookInMockStore(id)) {
        throw new Error('NOT_FOUND')
      }
    }
    return
  }

  for (const id of ids) {
    const response = await fetch(`${base}${TEXTBOOKS_API_BASE_PATH}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `HTTP_${response.status}`)
    }

    deleteTextbookInMockStore(id)
  }
}

export async function updateTextbook(id: string, input: TextbookCreateInput): Promise<TextbookRow> {
  const base = getApiBaseUrl()
  const registrant = useAuthStore.getState().user?.name?.trim() || '관리자'

  if (!base) {
    const updated = updateTextbookInMockStore(id, input, registrant)
    if (!updated) throw new Error('NOT_FOUND')
    return updated
  }

  const response = await fetch(`${base}${TEXTBOOKS_API_BASE_PATH}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `HTTP_${response.status}`)
  }

  const updated = updateTextbookInMockStore(id, input, registrant)
  if (!updated) throw new Error('NOT_FOUND')
  return updated
}
