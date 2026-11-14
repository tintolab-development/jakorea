/**
 * 서버 시각 보정값(serverNow - clientNow) 모듈 저장소.
 * - 세션 훅(`usePortalSessionTimeout`)이 `GET /api/portal/auth/session`의 `serverNow`로 갱신하고, 로그아웃 시 0으로 되돌린다.
 * - React 밖(Axios 인터셉터)에서도 PC 시계가 아닌 서버 기준 현재 시각으로 판단할 수 있게 한다.
 */
import { correctedNowMs } from '@jakorea/domain/session'

let serverClockOffsetMs = 0

export function setServerClockOffsetMs(ms: number): void {
  serverClockOffsetMs = Number.isFinite(ms) ? ms : 0
}

export function getServerClockOffsetMs(): number {
  return serverClockOffsetMs
}

export function resetServerClockOffset(): void {
  serverClockOffsetMs = 0
}

/** 서버 시각 보정을 적용한 현재 시각(ms). 보정값이 없으면 PC 시계와 같다. */
export function getServerCorrectedNowMs(clientNowMs: number = Date.now()): number {
  return correctedNowMs(clientNowMs, serverClockOffsetMs)
}
