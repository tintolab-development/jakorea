/**
 * E2E 에러 로그 — 토큰·비밀번호·MFA 등 민감값을 저장 전에 가린다.
 * localStorage 키 `cms.jakorea.e2eErrorLogs.v1` 전체 삭제는 하지 않는다.
 */

import type { E2eErrorLogEntry } from '@/features/e2e-error-log/model/types'

export const REDACTED = '[REDACTED]'

const SENSITIVE_KEY_RE =
  /^(refresh[_-]?token|access[_-]?token|id[_-]?token|id_token|token|password|passwd|pwd|new[_-]?password|old[_-]?password|current[_-]?password|confirm[_-]?password|otp|mfa(?:code|_code)?|totp|secret|client[_-]?secret|authorization|auth[_-]?code|refresh)$/i

const AUTH_PATH_RE =
  /\/(auth|login|logout|refresh|token|password|passwd|mfa|otp|totp)(\/|$|\?)/i

const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._~+/-]+=*/g

export function isAuthSensitiveRequestPath(requestPath: string | undefined): boolean {
  if (!requestPath) return false
  return AUTH_PATH_RE.test(requestPath)
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_RE.test(key.trim())
}

function redactDeep(value: unknown, parentKey?: string): unknown {
  if (parentKey != null && isSensitiveKey(parentKey)) return REDACTED
  if (typeof value === 'string') {
    if (JWT_RE.test(value)) {
      JWT_RE.lastIndex = 0
      return REDACTED
    }
    JWT_RE.lastIndex = 0
    return value
  }
  if (Array.isArray(value)) return value.map(item => redactDeep(item))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = redactDeep(child, key)
    }
    return out
  }
  return value
}

function parseMaybeJson(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) return raw
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return raw
    }
  }
  return raw
}

export function redactSensitivePreview(value: unknown): string | undefined {
  if (value == null) return undefined
  try {
    const parsed =
      typeof value === 'string' ? parseMaybeJson(value) : value
    const redacted = redactDeep(parsed)
    if (typeof redacted === 'string') {
      const masked = redacted.replace(JWT_RE, REDACTED)
      return masked.length > 800 ? `${masked.slice(0, 800)}…` : masked
    }
    const text = JSON.stringify(redacted)
    return text.length > 800 ? `${text.slice(0, 800)}…` : text
  } catch {
    return undefined
  }
}

export function previewForE2eErrorLog(args: {
  requestPath: string
  body: unknown
}): string | undefined {
  if (isAuthSensitiveRequestPath(args.requestPath)) return undefined
  return redactSensitivePreview(args.body)
}

export function scrubE2eErrorLogEntry<T extends Pick<E2eErrorLogEntry, 'requestPath' | 'requestBodyPreview' | 'responseBodyPreview'>>(
  entry: T
): T {
  const requestBodyPreview = isAuthSensitiveRequestPath(entry.requestPath)
    ? undefined
    : redactSensitivePreview(entry.requestBodyPreview)
  const responseBodyPreview = redactSensitivePreview(entry.responseBodyPreview)
  if (
    requestBodyPreview === entry.requestBodyPreview &&
    responseBodyPreview === entry.responseBodyPreview
  ) {
    return entry
  }
  return { ...entry, requestBodyPreview, responseBodyPreview }
}

export function scrubE2eErrorLogEntries(items: E2eErrorLogEntry[]): {
  items: E2eErrorLogEntry[]
  changed: boolean
} {
  let changed = false
  const next = items.map(item => {
    const scrubbed = scrubE2eErrorLogEntry(item)
    if (scrubbed !== item) changed = true
    return scrubbed
  })
  return { items: next, changed }
}
