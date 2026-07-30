/**
 * `/backend-dummies/:categoryId` — 상세 (표면 | 시드 | BE 갭 Tabs)
 */

import { Tabs } from 'antd'
import { useEffect, useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  BACKEND_DUMMIES_AS_OF,
  getAllCategoryIds,
  getBackendDummyCategory,
  getCategoriesByDomain,
} from './data/categories'
import { getBackendDummyDomain } from './data/domains'
import { getGapsForCategory } from './data/gaps'
import { getSeedCasesForCategory } from './data/seed-cases'
import { getSurfacesForCategory } from './data/surfaces'
import { computeSurfaceRates } from './lib/compute-rates'
import { getLiveGateSnapshot } from './lib/gate-status'
import { GapsList } from './ui/gaps-list'
import { GateBanner } from './ui/gate-banner'
import { SeedCaseTable } from './ui/seed-case-table'
import { SurfaceMatrixTable } from './ui/surface-matrix-table'
import './page.css'

export function BackendDummiesCategoryPage() {
  const { categoryId = '' } = useParams()
  const validIds = useMemo(() => new Set(getAllCategoryIds()), [])

  useEffect(() => {
    document.body.classList.add('bd-page-active')
    return () => {
      document.body.classList.remove('bd-page-active')
    }
  }, [])

  if (!validIds.has(categoryId)) {
    return <Navigate to="/backend-dummies?tab=programs" replace />
  }

  const cat = getBackendDummyCategory(categoryId)
  if (!cat) {
    return (
      <div className="bd-shell">
        <div className="bd-not-found">
          <p>카테고리를 찾을 수 없습니다.</p>
          <Link to="/backend-dummies">목록으로</Link>
        </div>
      </div>
    )
  }

  const domain = getBackendDummyDomain(cat.domainId)
  const siblings = getCategoriesByDomain(cat.domainId)
  const surfaces = getSurfacesForCategory(cat.id)
  const seeds = getSeedCasesForCategory(cat.id)
  const gaps = getGapsForCategory(cat.id)
  const rates = computeSurfaceRates(surfaces)
  const gate = getLiveGateSnapshot(cat.gateKeys)
  const nested = surfaces.filter(s => s.area === 'nested')
  const apiPct = rates.totalWeight > 0 ? rates.apiPct : cat.detailPct
  const dummyPct = rates.totalWeight > 0 ? rates.dummyPct : cat.dummyPct

  return (
    <div className="bd-shell">
      <div className="bd-page">
        <header className="bd-detail-sticky">
          <div className="bd-detail-sticky__row">
            <div>
              <p className="bd-hero__eyebrow">
                {domain?.label ?? cat.domainId} · {BACKEND_DUMMIES_AS_OF}
                {cat.confidence === 'estimated' ? ' · estimated' : ''}
              </p>
              <h1 className="bd-hero__title">{cat.label}</h1>
              <p className="bd-hero__meta">
                API <strong>{apiPct}%</strong> · 더미 <strong>{dummyPct}%</strong> · mock-only{' '}
                {rates.mockOnlyCount} · hybrid {rates.hybridCount} · 문서 {cat.detailPct}/{cat.crudPct}
              </p>
            </div>
            <div className="bd-actions bd-actions--compact">
              <Link to={`/backend-dummies?tab=${cat.domainId}`}>← {domain?.shortLabel ?? '목록'}</Link>
              <a href={cat.lnbPath} target="_blank" rel="noreferrer">
                화면 열기
              </a>
            </div>
          </div>
          <nav className="bd-sibling" aria-label="같은 도메인 메뉴">
            {siblings.map(s => (
              <Link
                key={s.id}
                to={`/backend-dummies/${s.id}`}
                className={
                  s.id === cat.id ? 'bd-sibling__link bd-sibling__link--active' : 'bd-sibling__link'
                }
              >
                {s.shortLabel}
              </Link>
            ))}
          </nav>
        </header>

        <p className="bd-hero__lead">{cat.summary}</p>

        <GateBanner
          remoteConfigured={gate.remoteConfigured}
          hasJwt={gate.hasJwt}
          chips={gate.chips}
          runtimeRemoteReady={gate.runtimeRemoteReady}
        />

        <Tabs
          className="bd-detail-tabs"
          defaultActiveKey="surfaces"
          items={[
            {
              key: 'surfaces',
              label: `표면 (${surfaces.length})`,
              children: (
                <div className="bd-tab-panel">
                  <p className="bd-section__desc">
                    빨간 배경 행은 중첩 또는 mock-only. 「런타임」은 현재 env·JWT·모듈 기준.
                  </p>
                  <SurfaceMatrixTable rows={surfaces} runtimeRemoteReady={gate.runtimeRemoteReady} />
                  {nested.length > 0 ? (
                    <>
                      <h3 className="bd-section__title bd-section__title--sm">중첩 강조</h3>
                      <SurfaceMatrixTable
                        rows={nested}
                        runtimeRemoteReady={gate.runtimeRemoteReady}
                      />
                    </>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'seeds',
              label: `시드 CASE (${seeds.length})`,
              children: (
                <div className="bd-tab-panel">
                  {seeds.length === 0 ? (
                    <p className="bd-empty">이 메뉴에 등록된 시드 CASE가 없습니다.</p>
                  ) : (
                    <SeedCaseTable rows={seeds} />
                  )}
                </div>
              ),
            },
            {
              key: 'gaps',
              label: `BE 갭 (${gaps.length})`,
              children: (
                <div className="bd-tab-panel">
                  <GapsList rows={gaps} />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}

export default BackendDummiesCategoryPage
