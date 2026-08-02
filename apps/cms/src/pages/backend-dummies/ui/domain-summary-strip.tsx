import type { BackendDummyDomain } from '../data/types'

export function DomainSummaryStrip({
  domain,
  menuCount,
  avgApiPct,
  avgDummyPct,
  avgUiPct,
  mockOnlyMenus,
  hybridMenus,
  gateReady,
}: {
  domain: BackendDummyDomain
  menuCount: number
  avgApiPct: number
  avgDummyPct: number
  /** programs 탭만 — 화면 UI% 평균 */
  avgUiPct?: number | null
  mockOnlyMenus: number
  hybridMenus: number
  gateReady: boolean
}) {
  return (
    <section className="bd-summary" aria-label={`${domain.label} 요약 지표`}>
      <div className="bd-summary__title">
        <strong>{domain.label}</strong>
        <span>{domain.description}</span>
      </div>
      <div className="bd-summary__metrics">
        <div className="bd-metric">
          <span className="bd-metric__label">하위 메뉴</span>
          <span className="bd-metric__value">{menuCount}</span>
        </div>
        <div className="bd-metric">
          <span className="bd-metric__label">평균 API%</span>
          <span className="bd-metric__value bd-metric__value--api">{avgApiPct}%</span>
        </div>
        <div className="bd-metric">
          <span className="bd-metric__label">평균 더미%</span>
          <span className="bd-metric__value bd-metric__value--dummy">{avgDummyPct}%</span>
        </div>
        {avgUiPct != null ? (
          <div className="bd-metric">
            <span className="bd-metric__label">평균 화면 UI%</span>
            <span className="bd-metric__value bd-metric__value--ui">{avgUiPct}%</span>
          </div>
        ) : null}
        <div className="bd-metric">
          <span className="bd-metric__label">mock-only 메뉴</span>
          <span className="bd-metric__value">{mockOnlyMenus}</span>
        </div>
        <div className="bd-metric">
          <span className="bd-metric__label">hybrid 메뉴</span>
          <span className="bd-metric__value">{hybridMenus}</span>
        </div>
        <div className="bd-metric">
          <span className="bd-metric__label">탭 게이트</span>
          <span className={gateReady ? 'bd-pill bd-pill--on' : 'bd-pill bd-pill--off'}>
            {gateReady ? '충족' : '미충족'}
          </span>
        </div>
      </div>
    </section>
  )
}
