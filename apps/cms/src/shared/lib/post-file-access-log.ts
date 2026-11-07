/**
 * 클라이언트 blob 다운로드 감사 로그 POST.
 *
 * BE 계약: `POST /api/admin/logs/file-access/client`
 * 성공 200 `data` 는 항상 null. 503 `AUDIT_LOG_UNAVAILABLE` 은 호출부가 서버 문구로 안내하고 파일을 저장하지 않는다.
 * GET `/api/admin/logs/file-access` 에 POST 하지 말 것.
 */

import { customInstance } from '@/shared/api/orval-mutator'

/** BE 확정 path — GET file-access 와 다름 */
export const FILE_ACCESS_LOG_CREATE_PATH = '/api/admin/logs/file-access/client'

const FILE_ACCESS_LOG_STRING_MAX = 255

export type PostFileAccessLogBody = {
  fileName: string
  userAgent?: string
}

export type PostFileAccessLogResult = {
  id?: string
}

function clipLogField(value: string): string {
  return value.length <= FILE_ACCESS_LOG_STRING_MAX
    ? value
    : value.slice(0, FILE_ACCESS_LOG_STRING_MAX)
}

export async function postFileAccessLog(
  body: PostFileAccessLogBody
): Promise<PostFileAccessLogResult> {
  const fileName = clipLogField(body.fileName.trim())
  if (!fileName) {
    throw new Error('다운로드 파일명이 없습니다.')
  }
  const userAgent = body.userAgent?.trim()
  const payload: PostFileAccessLogBody = {
    fileName,
    ...(userAgent ? { userAgent: clipLogField(userAgent) } : {}),
  }
  await customInstance<unknown>(
    {
      url: FILE_ACCESS_LOG_CREATE_PATH,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: payload,
    },
    { skipGlobalErrorAlert: true }
  )
  return {}
}
