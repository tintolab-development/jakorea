/**
 * 클라이언트 발급 문서(엑셀·지급조서·작성/발급 양식 PDF 등) 감사 로그 POST.
 *
 * BE 계약: `POST /api/admin/logs/file-access/client`
 * @see apps/cms/docs/api/client-file-access-log-backend-handoff.md
 *
 * GET `/api/admin/logs/file-access` 에 POST 하지 말 것 (스테이징 405).
 */

import { customInstance } from '@/shared/api/orval-mutator'

/** BE handoff 확정 path — GET file-access 와 다름 */
export const FILE_ACCESS_LOG_CREATE_PATH = '/api/admin/logs/file-access/client'

export type PostFileAccessLogBody = {
  fileName: string
  userAgent?: string
  ipAddress?: string
}

export type PostFileAccessLogResult = {
  id?: string
}

function unwrapCreatedLogId(payload: unknown): string | undefined {
  const body =
    payload != null && typeof payload === 'object' && 'success' in payload && 'data' in payload
      ? (payload as { data: unknown }).data
      : payload
  if (body == null || typeof body !== 'object') return undefined
  const id = (body as { id?: unknown }).id
  if (typeof id === 'string' && id.trim()) return id.trim()
  if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  return undefined
}

export async function postFileAccessLog(
  body: PostFileAccessLogBody
): Promise<PostFileAccessLogResult> {
  const fileName = body.fileName.trim()
  if (!fileName) {
    throw new Error('다운로드 파일명이 없습니다.')
  }
  const payload: PostFileAccessLogBody = {
    fileName,
    ...(body.userAgent?.trim() ? { userAgent: body.userAgent.trim() } : {}),
    ...(body.ipAddress?.trim() ? { ipAddress: body.ipAddress.trim() } : {}),
  }
  const response = await customInstance<unknown>(
    {
      url: FILE_ACCESS_LOG_CREATE_PATH,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: payload,
    },
    { skipGlobalErrorAlert: true }
  )
  return { id: unwrapCreatedLogId(response) }
}
