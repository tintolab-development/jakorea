/**
 * POST /api/users/{memberId}/privacy/unmask — 관리자 개인정보 원문 조회
 */

import { axiosClient } from '@/shared/api'

export class PrivacyUnmaskApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'PrivacyUnmaskApiError'
    this.code = code
  }
}

function parseUnmaskError(payload: unknown, fallback: string): PrivacyUnmaskApiError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const code = wrapped?.code ?? 'UNKNOWN'
    const message =
      wrapped?.message ?? (typeof o.message === 'string' ? o.message : fallback)
    return new PrivacyUnmaskApiError(String(code), message)
  }
  return new PrivacyUnmaskApiError('UNKNOWN', fallback)
}

export async function fetchMemberPrivacyUnmask(
  memberId: string,
  reason: string
): Promise<unknown> {
  try {
    const { data: payload } = await axiosClient.post<unknown>(
      `/api/users/${encodeURIComponent(memberId)}/privacy/unmask`,
      { reason }
    )
    if (payload && typeof payload === 'object') {
      const o = payload as Record<string, unknown>
      if (o.success === false) {
        throw parseUnmaskError(payload, '개인정보 원문 조회에 실패했습니다.')
      }
      if (o.success === true && 'data' in o) {
        return o.data
      }
    }
    return payload
  } catch (err) {
    if (err instanceof PrivacyUnmaskApiError) throw err
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: unknown } }
      throw parseUnmaskError(axiosErr.response?.data, '개인정보 원문 조회에 실패했습니다.')
    }
    throw new PrivacyUnmaskApiError('NETWORK', '개인정보 원문 조회 요청에 실패했습니다.')
  }
}
