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
import {
  PROGRAM_UI_COMPLETENESS_AS_OF,
  getProgramUiCompleteness,
  notionUiAlignmentLabel,
} from './data/ui-completeness'
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
  const uiRow = getProgramUiCompleteness(cat.id)

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
                API <strong>{apiPct}%</strong> · 더미 <strong>{dummyPct}%</strong>
                {uiRow ? (
                  <>
                    {' '}
                    · 화면 UI <strong>{uiRow.uiPct}%</strong>
                  </>
                ) : null}{' '}
                · mock-only {rates.mockOnlyCount} · hybrid {rates.hybridCount} · 문서{' '}
                {cat.detailPct}/{cat.crudPct}
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

        {uiRow ? (
          <section className="bd-ui-panel" aria-label="화면 UI 완성도">
            <div className="bd-ui-panel__head">
              <h2 className="bd-section__title bd-section__title--sm">화면 UI 완성도</h2>
              <span className={`bd-pill bd-pill--align-${uiRow.notionAlignment}`}>
                {notionUiAlignmentLabel(uiRow.notionAlignment)}
              </span>
              <span className="bd-ui-panel__asof">기준 {PROGRAM_UI_COMPLETENESS_AS_OF}</span>
            </div>
            <div className="bd-rate bd-ui-panel__bar">
              <div className="bd-rate__label">
                <span>렌더·네비 가능 화면 (API와 별축)</span>
                <strong>{uiRow.uiPct}%</strong>
              </div>
              <div
                className="bd-rate__track"
                role="progressbar"
                aria-valuenow={uiRow.uiPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="bd-rate__fill bd-rate__fill--ui"
                  style={{ width: `${uiRow.uiPct}%` }}
                />
              </div>
            </div>
            <p className="bd-ui-panel__verdict">{uiRow.verdict}</p>
            <p className="bd-ui-panel__notion">
              Notion 화면 개발: {uiRow.notionScreenDevSummary}
            </p>
            {uiRow.mismatches.length > 0 ? (
              <ul className="bd-ui-panel__list">
                {uiRow.mismatches.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="bd-empty">등록된 UI 불일치·stub 메모 없음.</p>
            )}
          </section>
        ) : null}

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
