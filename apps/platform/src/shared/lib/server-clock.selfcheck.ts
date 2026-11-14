/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/server-clock.selfcheck.ts
 *
 * Session GET 401의 Access 만료 판단은 PC 시계가 아니라 `serverNow`로 보정한 서버 기준 시각을 쓴다.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readJwtExpiresAtMs } from '@jakorea/domain/session'
import {
  getServerClockOffsetMs,
  getServerCorrectedNowMs,
  resetServerClockOffset,
  setServerClockOffsetMs,
} from './server-clock.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

/** axios-instance의 `ACCESS_EXPIRY_HINT_SKEW_MS`와 같은 값 */
const SKEW_MS = 5_000

function makeJwt(expSeconds: number): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '1', exp: expSeconds })}.signature`
}

/** axios-instance `isAccessTokenExpiredByHint`와 같은 비교(기본 nowMs = 서버 보정 시각) */
function isExpiredByHint(token: string, clientNowMs: number): boolean {
  const expMs = readJwtExpiresAtMs(token)
  return expMs != null && expMs <= getServerCorrectedNowMs(clientNowMs) + SKEW_MS
}

const clientNowMs = Date.parse('2026-11-13T00:00:00.000Z')
const TEN_MIN = 10 * 60_000

{
  resetServerClockOffset()
  assert(getServerClockOffsetMs() === 0, 'default offset must be 0')
  assert(getServerCorrectedNowMs(clientNowMs) === clientNowMs, 'no offset → client clock')
}

{
  // PC 시계가 서버보다 10분 느림: 서버 기준으론 이미 만료된 토큰
  const token = makeJwt((clientNowMs + 5 * 60_000) / 1000)
  resetServerClockOffset()
  assert(!isExpiredByHint(token, clientNowMs), 'client clock alone sees token as valid')
  setServerClockOffsetMs(TEN_MIN)
  assert(getServerCorrectedNowMs(clientNowMs) === clientNowMs + TEN_MIN, 'offset applied')
  assert(isExpiredByHint(token, clientNowMs), 'server clock (+10m) must judge token expired')
}

{
  // PC 시계가 서버보다 10분 빠름: PC 시계로는 만료지만 서버 기준으론 유효
  const token = makeJwt((clientNowMs - 5 * 60_000) / 1000)
  resetServerClockOffset()
  assert(isExpiredByHint(token, clientNowMs), 'client clock alone sees token as expired')
  setServerClockOffsetMs(-TEN_MIN)
  assert(!isExpiredByHint(token, clientNowMs), 'server clock (-10m) must judge token still valid')
}

{
  setServerClockOffsetMs(Number.NaN)
  assert(getServerClockOffsetMs() === 0, 'non-finite offset falls back to 0')
  setServerClockOffsetMs(TEN_MIN)
  resetServerClockOffset()
  assert(getServerClockOffsetMs() === 0, 'reset clears offset (logout)')
}

{
  // 배선 확인: 인터셉터 기본 nowMs와 세션 훅의 저장·초기화
  const libDir = dirname(fileURLToPath(import.meta.url))
  const axiosSource = readFileSync(join(libDir, '../api/axios-instance.ts'), 'utf8')
  assert(
    /function isAccessTokenExpiredByHint\([\s\S]*?nowMs = getServerCorrectedNowMs\(\)/.test(axiosSource),
    'isAccessTokenExpiredByHint default nowMs must be server-corrected',
  )
  const hookSource = readFileSync(
    join(libDir, '../../features/auth/session/use-portal-session-timeout.ts'),
    'utf8',
  )
  assert(/storeServerClockOffsetMs\(offsetMs\)/.test(hookSource), 'session hook must store offset')
  assert(/resetServerClockOffset\(\)/.test(hookSource), 'session hook must reset offset on logout')
}

resetServerClockOffset()
console.log('server-clock selfcheck ok')
