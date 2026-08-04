import { Link } from 'react-router-dom'
import type { BackendDummyCategory } from '../data/types'
import {
  getProgramUiCompleteness,
  notionUiAlignmentLabel,
} from '../data/ui-completeness'
import { computeSurfaceRates } from '../lib/compute-rates'
import { getLiveGateSnapshot } from '../lib/gate-status'
import { getSurfacesForCategory } from '../data/surfaces'
import { StatusBadge } from './status-badge'

function RateBar({ label, pct, tone }: { label: string; pct: number; tone: 'api' | 'dummy' | 'ui' }) {
  return (
    <div className="bd-rate">
      <div className="bd-rate__label">
        <span>{label}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="bd-rate__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`bd-rate__fill bd-rate__fill--${tone}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}

export function OverviewCards({
  categories,
  showUiCompleteness = false,
}: {
  categories: readonly BackendDummyCategory[]
  showUiCompleteness?: boolean
}) {
  return (
    <div className="bd-cards">
      {categories.map(cat => {
        const surfaces = getSurfacesForCategory(cat.id)
        const rates = computeSurfaceRates(surfaces)
        const gate = getLiveGateSnapshot(cat.gateKeys)
        const apiPct = rates.totalWeight > 0 ? rates.apiPct : cat.detailPct
        const dummyPct = rates.totalWeight > 0 ? rates.dummyPct : cat.dummyPct
        const uiRow = showUiCompleteness ? getProgramUiCompleteness(cat.id) : undefined

        return (
          <Link key={cat.id} to={`/backend-dummies/${cat.id}`} className="bd-card">
            <header className="bd-card__head">
              <h2 className="bd-card__title">{cat.label}</h2>
              <span className={gate.runtimeRemoteReady ? 'bd-pill bd-pill--on' : 'bd-pill bd-pill--off'}>
                gate {gate.runtimeRemoteReady ? 'ON' : 'OFF'}
              </span>
            </header>
            <p className="bd-card__summary">{cat.summary}</p>
            <p className="bd-card__meta">
              <code>{cat.lnbPath}</code>
            </p>
            <RateBar label="API 전환 (surface 가중)" pct={apiPct} tone="api" />
            <RateBar label="더미 잔존" pct={dummyPct} tone="dummy" />
            {uiRow ? (
              <>
                <RateBar label="화면 UI (렌더·네비)" pct={uiRow.uiPct} tone="ui" />
                <p className="bd-card__ui-note">
                  <span className={`bd-pill bd-pill--align-${uiRow.notionAlignment}`}>
                    {notionUiAlignmentLabel(uiRow.notionAlignment)}
                  </span>{' '}
                  {uiRow.verdict}
                </p>
              </>
            ) : null}
            <div className="bd-card__meta">
              <span>문서 CRUD {cat.crudPct}%</span>
              <span>문서 상세 {cat.detailPct}%</span>
            </div>
            <div className="bd-card__statuses">
              <StatusBadge status={cat.listCrudStatus} />
              <StatusBadge status={cat.applicationsStatus} />
              <StatusBadge status={cat.progressNestedStatus} />
              <StatusBadge status={cat.surveyManagersStatus} />
            </div>
            <p className="bd-card__hint">상세 매트릭스 →</p>
          </Link>
        )
      })}
    </div>
  )
}
