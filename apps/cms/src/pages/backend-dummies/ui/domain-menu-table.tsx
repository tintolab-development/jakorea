import { Link } from 'react-router-dom'
import type { BackendDummyCategory, IntegrationStatus } from '../data/types'
import {
  getProgramUiCompleteness,
  type NotionUiAlignment,
} from '../data/ui-completeness'
import { computeSurfaceRates } from '../lib/compute-rates'
import { getLiveGateSnapshot } from '../lib/gate-status'
import { getSurfacesForCategory } from '../data/surfaces'
import { StatusBadge } from './status-badge'

function shortAlign(alignment: NotionUiAlignment): string {
  switch (alignment) {
    case 'aligned':
      return '일치'
    case 'understated':
      return '과소'
    case 'overstated':
      return '과대'
  }
}

function ProgressStack({
  apiPct,
  dummyPct,
  uiPct,
  uiAlign,
  uiTitle,
}: {
  apiPct: number
  dummyPct: number
  uiPct?: number
  uiAlign?: NotionUiAlignment
  uiTitle?: string
}) {
  return (
    <div className="bd-progress-stack">
      <div className="bd-progress-row">
        <span className="bd-progress-row__lab">API</span>
        <div className="bd-progress-row__track" aria-hidden>
          <div
            className="bd-progress-row__fill bd-progress-row__fill--api"
            style={{ width: `${apiPct}%` }}
          />
        </div>
        <span className="bd-progress-row__val bd-progress-row__val--api">{apiPct}%</span>
      </div>
      <div className="bd-progress-row">
        <span className="bd-progress-row__lab">더미</span>
        <div className="bd-progress-row__track" aria-hidden>
          <div
            className="bd-progress-row__fill bd-progress-row__fill--dummy"
            style={{ width: `${dummyPct}%` }}
          />
        </div>
        <span className="bd-progress-row__val bd-progress-row__val--dummy">{dummyPct}%</span>
      </div>
      {uiPct != null ? (
        <div className="bd-progress-row" title={uiTitle}>
          <span className="bd-progress-row__lab">UI</span>
          <div className="bd-progress-row__track" aria-hidden>
            <div
              className="bd-progress-row__fill bd-progress-row__fill--ui"
              style={{ width: `${uiPct}%` }}
            />
          </div>
          <span className="bd-progress-row__val bd-progress-row__val--ui">
            {uiPct}%
            {uiAlign ? (
              <em className={`bd-progress-row__tag bd-progress-row__tag--${uiAlign}`}>
                {shortAlign(uiAlign)}
              </em>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function StatusCluster({
  crud,
  applications,
  progress,
}: {
  crud: IntegrationStatus
  applications: IntegrationStatus
  progress: IntegrationStatus
}) {
  return (
    <div className="bd-status-cluster" title="CRUD · 신청·핵심 · 상세·하위">
      <StatusBadge status={crud} />
      <StatusBadge status={applications} />
      <StatusBadge status={progress} />
    </div>
  )
}

export function DomainMenuTable({
  categories,
  showUiCompleteness = false,
}: {
  categories: readonly BackendDummyCategory[]
  /** programs 탭 — API%와 별축 「화면 UI%」 */
  showUiCompleteness?: boolean
}) {
  return (
    <div className="bd-table-wrap bd-table-wrap--sticky-head">
      <table className="bd-table bd-table--compare bd-table--compare-compact">
        <thead>
          <tr>
            <th>메뉴</th>
            <th>게이트</th>
            <th>연동</th>
            <th>진행률</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => {
            const surfaces = getSurfacesForCategory(cat.id)
            const rates = computeSurfaceRates(surfaces)
            const gate = getLiveGateSnapshot(cat.gateKeys)
            const apiPct = rates.totalWeight > 0 ? rates.apiPct : cat.detailPct
            const dummyPct = rates.totalWeight > 0 ? rates.dummyPct : cat.dummyPct
            const uiRow = showUiCompleteness ? getProgramUiCompleteness(cat.id) : undefined
            const warn = cat.listCrudStatus === 'mock-only' || dummyPct >= 50
            const gateTitle =
              cat.gateKeys.length > 0 ? cat.gateKeys.join(', ') : '게이트 키 없음'

            return (
              <tr key={cat.id} className={warn ? 'bd-table__row--warn' : undefined}>
                <td>
                  <div className="bd-menu-cell">
                    <strong>{cat.label}</strong>
                    <span className="bd-menu-cell__path" title={cat.lnbPath}>
                      {cat.lnbPath}
                    </span>
                    <span className="bd-menu-cell__meta">
                      문서 {cat.detailPct}/{cat.crudPct}
                      {cat.confidence === 'estimated' ? (
                        <span className="bd-pill bd-pill--warn">estimated</span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    className={
                      gate.runtimeRemoteReady ? 'bd-pill bd-pill--on' : 'bd-pill bd-pill--off'
                    }
                    title={gateTitle}
                  >
                    {gate.runtimeRemoteReady ? 'ON' : 'OFF'}
                  </span>
                </td>
                <td>
                  <StatusCluster
                    crud={cat.listCrudStatus}
                    applications={cat.applicationsStatus}
                    progress={cat.progressNestedStatus}
                  />
                </td>
                <td>
                  <ProgressStack
                    apiPct={apiPct}
                    dummyPct={dummyPct}
                    uiPct={uiRow?.uiPct}
                    uiAlign={uiRow?.notionAlignment}
                    uiTitle={uiRow?.verdict}
                  />
                </td>
                <td className="bd-table__action">
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
