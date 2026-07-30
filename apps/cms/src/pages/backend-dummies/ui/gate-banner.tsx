import type { GateChip } from '../lib/gate-status'

export function GateBanner({
  remoteConfigured,
  hasJwt,
  chips,
  runtimeRemoteReady,
}: {
  remoteConfigured: boolean
  hasJwt: boolean
  chips: GateChip[]
  runtimeRemoteReady: boolean
}) {
  return (
    <section className="bd-gate" aria-label="Remote 게이트 상태">
      <div className="bd-gate__row">
        <span className={remoteConfigured ? 'bd-pill bd-pill--on' : 'bd-pill bd-pill--off'}>
          API URL {remoteConfigured ? 'ON' : 'OFF'}
        </span>
        <span className={hasJwt ? 'bd-pill bd-pill--on' : 'bd-pill bd-pill--off'}>
          Admin JWT {hasJwt ? 'ON' : 'OFF'}
        </span>
        <span className={runtimeRemoteReady ? 'bd-pill bd-pill--on' : 'bd-pill bd-pill--warn'}>
          런타임 remote {runtimeRemoteReady ? '준비됨' : '미충족 → mock 폴백'}
        </span>
      </div>
      {chips.length > 0 ? (
        <div className="bd-gate__chips">
          {chips.map(c => (
            <span
              key={c.key}
              className={c.enabled ? 'bd-chip bd-chip--on' : 'bd-chip bd-chip--off'}
              title={c.key}
            >
              {c.label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  )
}
