/**
 * CMS 관리자 공지 삭제 — mock 단일 저장소 또는 원격 API
 * 백엔드 경로는 스펙 확정 후 `ADMIN_NOTICES_API_BASE_PATH` 조정
 */

import { useAuthStore } from '@/features/auth/model/auth-store'
import { deleteAdminNotice } from '@/features/posts/api/admin-notice-mock-store'

/** `VITE_API_BASE_URL` 뒤에 붙는 공지 리소스 prefix (예: `/api/v1/cms/notices`) */
const ADMIN_NOTICES_API_BASE_PATH =
  (import.meta.env.VITE_ADMIN_NOTICES_API_BASE_PATH as string | undefined)?.replace(/\/$/, '') ??
  '/api/cms/admin/notices'

function getRemoteDeleteUrl(id: string): string | null {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  if (!base) return null
  return `${base}${ADMIN_NOTICES_API_BASE_PATH}/${encodeURIComponent(id)}`
}

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/**
 * 공지 1건 삭제
 * - `VITE_API_BASE_URL` 미설정: mock 저장소만 갱신
 * - 설정됨: `DELETE` 후 성공 시 mock에서도 제거(클라이언트 상태 일치)
 */
export async function deleteNotice(id: string): Promise<void> {
  const remoteUrl = getRemoteDeleteUrl(id)

  if (!remoteUrl) {
    if (!deleteAdminNotice(id)) {
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

  deleteAdminNotice(id)
}

/** 여러 건 순차 삭제 — 한 건이라도 실패 시 예외 전파 */
export async function deleteNotices(ids: string[]): Promise<void> {
  for (const id of ids) {
    await deleteNotice(id)
  }
}
