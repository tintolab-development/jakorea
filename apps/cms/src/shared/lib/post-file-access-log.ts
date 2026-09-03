/**
 * 클라이언트 발급 문서(엑셀·지급조서 등) 감사 로그 POST.
 *
 * BE 계약: `POST /api/admin/logs/file-access/client`
 * @see apps/cms/docs/api/client-file-access-log-backend-handoff.md
 *
 * GET `/api/admin/logs/file-access` 에 POST 하지 말 것 (스테이징 405).
 * OpenAPI·스테이징 배포 전 원격 호출은 `shouldRecordFileAccessRemotely` 가 false.
 */

import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api'

/** BE handoff 확정 path — GET file-access 와 다름 */
export const FILE_ACCESS_LOG_CREATE_PATH = '/api/admin/logs/file-access/client'

export type PostFileAccessLogBody = {
  fileName: string
  userAgent?: string
  ipAddress?: string
}

export async function postFileAccessLog(body: PostFileAccessLogBody): Promise<void> {
  const fileName = body.fileName.trim()
  if (!fileName) {
    throw new Error('다운로드 파일명이 없습니다.')
  }
  const payload: PostFileAccessLogBody = {
    fileName,
    ...(body.userAgent?.trim() ? { userAgent: body.userAgent.trim() } : {}),
    ...(body.ipAddress?.trim() ? { ipAddress: body.ipAddress.trim() } : {}),
  }
  await axiosClient.post(FILE_ACCESS_LOG_CREATE_PATH, payload, {
    skipGlobalErrorAlert: true,
  } as InternalAxiosRequestConfig & { skipGlobalErrorAlert?: boolean })
}
