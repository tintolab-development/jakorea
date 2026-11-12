import type { EmailRecoveryAccount, EmailRecoveryLookupResponse } from './types'

function unwrapData(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.success === false) {
    const error = root.error
    const nested =
      error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message.trim()
        : ''
    const message =
      nested || (typeof root.message === 'string' ? root.message.trim() : '') || '요청에 실패했습니다.'
    throw new Error(message)
  }
  if (root.data && typeof root.data === 'object') {
    return root.data as Record<string, unknown>
  }
  return root
}

function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

/** 계정 행에서 이메일 값만 남긴다(accountId·status 등은 화면에 쓰지 않는다). */
function parseAccounts(value: unknown): EmailRecoveryAccount[] | undefined {
  if (!Array.isArray(value)) return undefined
  const accounts: EmailRecoveryAccount[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    accounts.push({
      email: optionalString(row.email),
      maskedEmail: optionalString(row.maskedEmail),
    })
  }
  return accounts
}

export function parseEmailRecoveryLookupResponse(payload: unknown): EmailRecoveryLookupResponse {
  const root = unwrapData(payload)
  if (!root) {
    return {}
  }

  return {
    matched: optionalBoolean(root.matched),
    maskedEmail: optionalString(root.maskedEmail),
    accounts: parseAccounts(root.accounts),
  }
}
