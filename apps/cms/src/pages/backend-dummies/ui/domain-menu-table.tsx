import { Link } from 'react-router-dom'
import type { BackendDummyCategory } from '../data/types'
import { computeSurfaceRates } from '../lib/compute-rates'
import { getLiveGateSnapshot } from '../lib/gate-status'
import { getSurfacesForCategory } from '../data/surfaces'
import { StatusBadge } from './status-badge'

function MiniBar({ pct, tone }: { pct: number; tone: 'api' | 'dummy' }) {
  return (
    <div className="bd-mini-bar">
      <div className="bd-mini-bar__track">
        <div
          className={
            tone === 'api' ? 'bd-mini-bar__fill bd-mini-bar__fill--api' : 'bd-mini-bar__fill bd-mini-bar__fill--dummy'
          }
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className="bd-mini-bar__pct">{pct}%</span>
    </div>
  )
}

export function DomainMenuTable({ categories }: { categories: readonly BackendDummyCategory[] }) {
  return (
    <div className="bd-table-wrap bd-table-wrap--sticky-head">
      <table className="bd-table bd-table--compare">
        <thead>
          <tr>
            <th>메뉴</th>
            <th>경로</th>
            <th>게이트</th>
            <th>CRUD</th>
            <th>신청·핵심</th>
            <th>상세·하위</th>
            <th>API%</th>
            <th>더미%</th>
            <th>문서%</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => {
            const surfaces = getSurfacesForCategory(cat.id)
            const rates = computeSurfaceRates(surfaces)
            const gate = getLiveGateSnapshot(cat.gateKeys)
            const apiPct = rates.totalWeight > 0 ? rates.apiPct : cat.detailPct
            const dummyPct = rates.totalWeight > 0 ? rates.dummyPct : cat.dummyPct
            const warn = cat.listCrudStatus === 'mock-only' || dummyPct >= 50
            return (
              <tr key={cat.id} className={warn ? 'bd-table__row--warn' : undefined}>
                <td>
                  <div className="bd-menu-cell">
                    <strong>{cat.label}</strong>
                    {cat.confidence === 'estimated' ? (
                      <span className="bd-pill bd-pill--warn">estimated</span>
                    ) : null}
                  </div>
                </td>
                <td className="bd-table__mono">{cat.lnbPath}</td>
                <td>
                  <div className="bd-menu-cell">
                    <span className={gate.runtimeRemoteReady ? 'bd-pill bd-pill--on' : 'bd-pill bd-pill--off'}>
                      {gate.runtimeRemoteReady ? 'ON' : 'OFF'}
                    </span>
                    {cat.gateKeys.length > 0 ? (
                      <span className="bd-table__mono" title={cat.gateKeys.join(', ')}>
                        {cat.gateKeys.slice(0, 2).join(', ')}
                        {cat.gateKeys.length > 2 ? ` +${cat.gateKeys.length - 2}` : ''}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <StatusBadge status={cat.listCrudStatus} />
                </td>
                <td>
                  <StatusBadge status={cat.applicationsStatus} />
                </td>
                <td>
                  <StatusBadge status={cat.progressNestedStatus} />
                </td>
                <td>
                  <MiniBar pct={apiPct} tone="api" />
                </td>
                <td>
                  <MiniBar pct={dummyPct} tone="dummy" />
                </td>
                <td className="bd-table__mono">
                  {cat.detailPct}/{cat.crudPct}
                </td>
                <td>
                  <Link to={`/backend-dummies/${cat.id}`} className="bd-link">
                    보기
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
