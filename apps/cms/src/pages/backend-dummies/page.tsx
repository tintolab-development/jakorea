/**
 * `/backend-dummies` — LNB 전체 도메인 탭 · 지표 · 비교 표
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BACKEND_DUMMIES_AS_OF,
  BACKEND_DUMMIES_DOC_HINT,
  getCategoriesByDomain,
} from './data/categories'
import {
  BACKEND_DUMMY_DOMAINS,
  DEFAULT_DOMAIN_TAB,
  getBackendDummyDomain,
  isBackendDummyDomainId,
  collectAllDomainGateKeys,
} from './data/domains'
import {
  PROGRAM_UI_COMPLETENESS_AS_OF,
  averageProgramUiPct,
} from './data/ui-completeness'
import type { BackendDummyDomainId } from './data/types'
import { computeSurfaceRates } from './lib/compute-rates'
import { getActiveRealApiModuleList, getLiveGateSnapshot } from './lib/gate-status'
import { getSurfacesForCategory } from './data/surfaces'
import { DomainMenuTable } from './ui/domain-menu-table'
import { DomainSummaryStrip } from './ui/domain-summary-strip'
import { DomainTabs } from './ui/domain-tabs'
import { GateBanner } from './ui/gate-banner'
import { OverviewCards } from './ui/overview-cards'
import { StatusBadge } from './ui/status-badge'
import './page.css'

export function BackendDummiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const tabParam = searchParams.get('tab') ?? DEFAULT_DOMAIN_TAB
  const activeTab: BackendDummyDomainId = isBackendDummyDomainId(tabParam)
    ? tabParam
    : DEFAULT_DOMAIN_TAB

  useEffect(() => {
    document.body.classList.add('bd-page-active')
    return () => {
      document.body.classList.remove('bd-page-active')
    }
  }, [])

  useEffect(() => {
    if (!isBackendDummyDomainId(tabParam)) {
      setSearchParams({ tab: DEFAULT_DOMAIN_TAB }, { replace: true })
    }
  }, [tabParam, setSearchParams])

  const domain = getBackendDummyDomain(activeTab)!
  const categories = getCategoriesByDomain(activeTab)
  const envModules = getActiveRealApiModuleList()
  const globalGate = getLiveGateSnapshot(collectAllDomainGateKeys())
  const domainGate = getLiveGateSnapshot(domain.gateKeys)

  const showUiCompleteness = activeTab === 'programs'

  const summary = useMemo(() => {
    let apiSum = 0
    let dummySum = 0
    let mockOnlyMenus = 0
    let hybridMenus = 0
    for (const cat of categories) {
      const rates = computeSurfaceRates(getSurfacesForCategory(cat.id))
      apiSum += rates.totalWeight > 0 ? rates.apiPct : cat.detailPct
      dummySum += rates.totalWeight > 0 ? rates.dummyPct : cat.dummyPct
      if (cat.listCrudStatus === 'mock-only') mockOnlyMenus += 1
      if (cat.listCrudStatus === 'hybrid') hybridMenus += 1
    }
    const n = categories.length || 1
    return {
      avgApiPct: Math.round(apiSum / n),
      avgDummyPct: Math.round(dummySum / n),
      avgUiPct: showUiCompleteness
        ? averageProgramUiPct(categories.map(c => c.id))
        : null,
      mockOnlyMenus,
      hybridMenus,
    }
  }, [categories, showUiCompleteness])

  const onTabChange = (tab: BackendDummyDomainId) => {
    setSearchParams({ tab })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="bd-shell">
      <div className="bd-page">
        <header className="bd-hero">
          <p className="bd-hero__eyebrow">CMS Internal</p>
          <h1 className="bd-hero__title">Backend dummies — API 전환 · 더미 · 화면 UI</h1>
        </header>

        <DomainTabs activeTab={activeTab} onChange={onTabChange} />

        <div className="bd-hero bd-hero--compact">
          <p className="bd-hero__lead">
            CMS LNB 1뎁스 전체를 탭으로 구분하고, 탭별 지표·비교 표로 FE 연동/더미 잔존을 확인합니다.
            hybrid여도 게이트 OFF면 런타임은 mock입니다.
            {showUiCompleteness
              ? ' 프로그램 탭은 Notion 대조 기준 「화면 UI%」를 API%와 별축으로 표시합니다.'
              : null}
          </p>
          <p className="bd-hero__meta">
            기준일 <strong>{BACKEND_DUMMIES_AS_OF}</strong>
            {showUiCompleteness ? (
              <>
                {' '}
                · 화면 UI <strong>{PROGRAM_UI_COMPLETENESS_AS_OF}</strong>
              </>
            ) : null}{' '}
            · <code>{BACKEND_DUMMIES_DOC_HINT}</code>
          </p>
        </div>
        <div className="bd-legend" aria-label="상태 범례">
          <span>
            <StatusBadge status="api-wired" /> 실 API만
          </span>
          <span>
            <StatusBadge status="hybrid" /> 게이트 ON 시 API
          </span>
          <span>
            <StatusBadge status="mock-only" /> 항상 mock
          </span>
          <span>
            <StatusBadge status="n-a" /> 해당 없음
          </span>
        </div>

        <GateBanner
          remoteConfigured={globalGate.remoteConfigured}
          hasJwt={globalGate.hasJwt}
          chips={domainGate.chips}
          runtimeRemoteReady={domainGate.runtimeRemoteReady}
        />

        <section className="bd-section bd-section--tight" aria-labelledby="bd-modules-title">
          <h2 id="bd-modules-title" className="bd-section__title bd-section__title--sm">
            VITE_REAL_API_MODULES
          </h2>
          <div className="bd-modules">
            {envModules.length === 0 ? (
              <span className="bd-chip bd-chip--off">미설정 → 전부 mock</span>
            ) : (
              envModules.map(m => (
                <span key={m} className="bd-chip bd-chip--on">
                  {m}
                </span>
              ))
            )}
          </div>
        </section>

        <DomainSummaryStrip
          domain={domain}
          menuCount={categories.length}
          avgApiPct={summary.avgApiPct}
          avgDummyPct={summary.avgDummyPct}
          avgUiPct={summary.avgUiPct}
          mockOnlyMenus={summary.mockOnlyMenus}
          hybridMenus={summary.hybridMenus}
          gateReady={domainGate.runtimeRemoteReady}
        />

        <div className="bd-view-toggle" role="group" aria-label="보기 전환">
          <button
            type="button"
            className={viewMode === 'table' ? 'bd-toggle bd-toggle--on' : 'bd-toggle'}
            onClick={() => setViewMode('table')}
          >
            표
          </button>
          <button
            type="button"
            className={viewMode === 'cards' ? 'bd-toggle bd-toggle--on' : 'bd-toggle'}
            onClick={() => setViewMode('cards')}
          >
            카드
          </button>
        </div>

        <section className="bd-section" aria-labelledby="bd-table-title">
          <h2 id="bd-table-title" className="bd-section__title">
            {domain.label} — 메뉴별 비교
          </h2>
          <p className="bd-section__desc">
            연동 = CRUD · 신청 · 상세 상태. 진행률의 API/더미는 surface 가중(없으면 문서 %).
            {showUiCompleteness
              ? ' UI는 렌더·네비 비중(API와 합산 안 함). 「일치/과소/과대」는 Notion 화면 개발 대비.'
              : null}{' '}
            게이트 키·경로는 셀에 마우스를 올리면 확인할 수 있습니다.
          </p>
          {viewMode === 'table' ? (
            <DomainMenuTable categories={categories} showUiCompleteness={showUiCompleteness} />
          ) : (
            <OverviewCards categories={categories} showUiCompleteness={showUiCompleteness} />
          )}
        </section>

        <p className="bd-footer-hint">
          도메인 탭: {BACKEND_DUMMY_DOMAINS.map(d => d.shortLabel).join(' · ')}
        </p>
      </div>
    </div>
  )
}

export default BackendDummiesPage
