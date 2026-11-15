import { execFileSync } from 'node:child_process'
import type { APIRequestContext, APIResponse } from '@playwright/test'
import {
  DEV_LOGIN_MFA_CODE,
  DEV_LOGIN_QA_ACCOUNTS,
  DEV_LOGIN_QA_PASSWORD,
} from '../../../src/features/auth/lib/dev-login-accounts'

export const SETTLEMENT_API_ORIGIN = process.env.E2E_API_ORIGIN?.trim() || 'http://localhost:8080'

const REDACT_KEY = /account|resident|email|token|password|rrn|bank|phone|address|birth|holder|secret/i

export type ApiCallResult = {
  status: number
  body: unknown
  code: string | null
}

export class SettlementApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message)
    this.name = 'SettlementApiError'
  }
}

export function seoulIsoDate(dayOffset: number): string {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const [year, month, day] = today.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + dayOffset))
  return shifted.toISOString().slice(0, 10)
}

export function readErrorCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const record = body as { code?: unknown; error?: { code?: unknown } }
  const nested = record.error?.code
  const raw = typeof nested === 'string' ? nested : typeof record.code === 'string' ? record.code : ''
  const stable = raw.trim().split(':', 1)[0]?.trim() ?? ''
  return stable ? stable.toUpperCase() : null
}

export function redactBody(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(item => redactBody(item))
  if (!value || typeof value !== 'object') return value
  const output: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (REDACT_KEY.test(key) && !/ids?$/i.test(key)) continue
    output[key] = redactBody(item)
  }
  return output
}

function memberEmail(memberId: number): string {
  const output = execFileSync(
    'docker',
    [
      'run',
      '--rm',
      '-e',
      'PGPASSWORD=ja_cms',
      'postgres:16',
      'psql',
      '-X',
      '-q',
      '-t',
      '-A',
      'postgresql://ja_cms@host.docker.internal:5432/ja_cms_local?sslmode=disable',
      '-c',
      `SELECT email FROM member WHERE id = ${Number(memberId)};`,
    ],
    { encoding: 'utf8' },
  ).trim()
  if (!output || output.includes('\n') || !output.includes('@')) {
    throw new Error(`member ${memberId} login id lookup failed`)
  }
  return output
}

function findString(value: unknown, key: string): string | null {
  if (!value || typeof value !== 'object') return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findString(item, key)
      if (found) return found
    }
    return null
  }
  const record = value as Record<string, unknown>
  const direct = record[key]
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  for (const item of Object.values(record)) {
    const found = findString(item, key)
    if (found) return found
  }
  return null
}

export function listItems(body: unknown): Record<string, unknown>[] {
  const unwrapped = unwrapData(body)
  if (Array.isArray(unwrapped)) return unwrapped.filter(isRecord)
  if (!isRecord(unwrapped)) return []
  for (const key of ['items', 'content', 'schedules'] as const) {
    const value = unwrapped[key]
    if (Array.isArray(value)) return value.filter(isRecord)
  }
  return []
}

export function unwrapData(body: unknown): unknown {
  if (!isRecord(body)) return body
  if ('data' in body && body.data != null && body.success !== false) return unwrapData(body.data)
  return body
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function assertCall(
  result: ApiCallResult,
  expected: { status?: number; code?: string; ok?: boolean },
): void {
  if (expected.ok && (result.status < 200 || result.status >= 300)) {
    throw new SettlementApiError(
      `expected success but HTTP ${result.status} ${result.code ?? ''}`.trim(),
      result.status,
      result.code,
    )
  }
  if (expected.status != null && result.status !== expected.status) {
    throw new SettlementApiError(
      `expected HTTP ${expected.status} but ${result.status} ${result.code ?? ''}`.trim(),
      result.status,
      result.code,
    )
  }
  if (expected.code && result.code !== expected.code) {
    throw new SettlementApiError(
      `expected ${expected.code} but ${result.code ?? 'none'} (HTTP ${result.status})`,
      result.status,
      result.code,
    )
  }
}

export class SettlementApi {
  adminToken = ''
  private readonly memberTokens = new Map<number, string>()

  constructor(private readonly request: APIRequestContext) {}

  async call(
    token: string,
    method: 'GET' | 'POST' | 'PATCH',
    path: string,
    body?: unknown,
  ): Promise<ApiCallResult> {
    const response = await this.request.fetch(`${SETTLEMENT_API_ORIGIN}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      data: body,
      failOnStatusCode: false,
    })
    return readResult(response)
  }

  async loginAdmin(email: string): Promise<void> {
    this.adminToken = await this.loginAdminAccount(email, DEV_LOGIN_QA_PASSWORD)
  }

  async loginAdminAccount(email: string, password: string): Promise<string> {
    const challenge = await this.rawJson('/api/admin/auth/login', { email, password })
    if (challenge.status < 200 || challenge.status >= 300) {
      throw new SettlementApiError('admin login failed', challenge.status, readErrorCode(challenge.json))
    }
    const challengeUuid = findString(challenge.json, 'challengeUuid')
    if (!challengeUuid) throw new Error('admin MFA challenge missing')
    const verified = await this.rawJson('/api/admin/auth/mfa/verify', {
      challengeUuid,
      verificationCode: process.env.E2E_MFA_CODE?.trim() || DEV_LOGIN_MFA_CODE,
    })
    if (verified.status < 200 || verified.status >= 300) {
      throw new SettlementApiError('admin MFA failed', verified.status, readErrorCode(verified.json))
    }
    const token = findString(verified.json, 'accessToken')
    if (!token) throw new Error('admin access token missing')
    return token
  }

  async loginMember(memberId: number): Promise<string> {
    const cached = this.memberTokens.get(memberId)
    if (cached) return cached
    const password = process.env.E2E_PLATFORM_PASSWORD?.trim()
    if (!password) throw new Error('E2E_PLATFORM_PASSWORD 환경변수가 필요합니다.')
    const loggedIn = await this.rawJson('/api/portal/auth/login', {
      email: memberEmail(memberId),
      password,
    })
    if (loggedIn.status !== 200) {
      throw new SettlementApiError(
        `member ${memberId} login failed`,
        loggedIn.status,
        readErrorCode(loggedIn.json),
      )
    }
    const token = findString(loggedIn.json, 'accessToken')
    if (!token) throw new Error(`member ${memberId} access token missing`)
    this.memberTokens.set(memberId, token)
    return token
  }

  async publicCall(method: 'POST', path: string, body: unknown): Promise<ApiCallResult> {
    const response = await this.request.fetch(`${SETTLEMENT_API_ORIGIN}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      data: body,
      failOnStatusCode: false,
    })
    return readResult(response)
  }

  private async rawJson(path: string, body: unknown): Promise<{ status: number; json: unknown }> {
    const response = await this.request.fetch(`${SETTLEMENT_API_ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
      failOnStatusCode: false,
    })
    const text = await response.text()
    let json: unknown = null
    if (text) {
      try {
        json = JSON.parse(text) as unknown
      } catch {
        json = null
      }
    }
    return { status: response.status(), json }
  }
}

async function readResult(response: APIResponse): Promise<ApiCallResult> {
  const contentType = response.headers()['content-type'] ?? ''
  if (!contentType.includes('json')) {
    const bytes = (await response.body()).byteLength
    return { status: response.status(), body: { byteLength: bytes, contentType }, code: null }
  }
  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = { unparsed: true }
    }
  }
  return { status: response.status(), body: redactBody(body), code: readErrorCode(body) }
}

export function adminAccount(key: 'master' | 'partner'): { email: string } {
  const account = DEV_LOGIN_QA_ACCOUNTS.find(item => item.key === key)
  if (!account) throw new Error(`admin account ${key} missing`)
  return { email: account.email }
}
