import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ReportCard,
  TRANSPARENCY_ANNUAL_REPORTS_PATH,
  TRANSPARENCY_AUDIT_REPORTS_PATH,
  buildReportsListPath,
  readReportsListParams,
  usePublicTransparencyReports,
  type TransparencyReportType,
  type TransparencyReportsListParams,
} from '@/features/transparency'
import { useDebouncedValue } from '@/shared/hooks'
import { PFLoadingSpinner, PFPagination, PFSearchInput, PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

const PAGE_CONFIG: Record<
  TransparencyReportType,
  {
    heroTitle: string
    path: string
  }
> = {
  annual: {
    heroTitle: '한 해의 활동과 재정 현황을\n투명하게 공개합니다',
    path: TRANSPARENCY_ANNUAL_REPORTS_PATH,
  },
  audit: {
    heroTitle: '기부금 운영의 투명성을\n확인하고 있습니다',
    path: TRANSPARENCY_AUDIT_REPORTS_PATH,
  },
}

const TAB_ITEMS = [
  { key: 'annual', label: '연차보고서' },
  { key: 'audit', label: '회계감사 보고서' },
] as const

const SEARCH_DEBOUNCE_MS = 500

export type TransparencyReportsPageProps = {
  type: TransparencyReportType
}

export function TransparencyReportsPage({ type }: TransparencyReportsPageProps) {
  const navigate = useNavigate()
  const config = PAGE_CONFIG[type]
  const [params, setParams] = useState(readReportsListParams)
  const [draftQ, setDraftQ] = useState(() => readReportsListParams().q)
  const debouncedQ = useDebouncedValue(draftQ, SEARCH_DEBOUNCE_MS)

  // 탭 전환(라우트 변경) 시 URL 기준으로 검색어·페이지 재동기화
  const [prevType, setPrevType] = useState(type)
  if (prevType !== type) {
    setPrevType(type)
    const next = readReportsListParams()
    setParams(next)
    setDraftQ(next.q)
  }

  useEffect(() => {
    const onPopState = () => {
      const next = readReportsListParams()
      setParams(next)
      setDraftQ(next.q)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setParams(prev => {
      if (prev.q === debouncedQ) return prev
      const merged: TransparencyReportsListParams = { ...prev, q: debouncedQ, page: 1 }
      const nextPath = buildReportsListPath(config.path, merged)
      const currentPath = `${window.location.pathname}${window.location.search}`
      if (nextPath !== currentPath) {
        window.history.pushState(null, '', nextPath)
      }
      return merged
    })
  }, [config.path, debouncedQ])

  const updateParams = (next: Partial<TransparencyReportsListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    if (next.q !== undefined) {
      setDraftQ(next.q)
    }
    const nextPath = buildReportsListPath(config.path, merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const listQuery = usePublicTransparencyReports(type, {
    q: params.q,
    page: params.page,
  })

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.top}>
          <header className={styles.hero}>
            <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
              {config.heroTitle.split('\n').map((line, index) => (
                <Fragment key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </PFText>
          </header>

          <nav className={styles.tabs}>
            <PFTabs
              items={[...TAB_ITEMS]}
              value={type}
              variant="category"
              ariaLabel="보고서 유형"
              onChange={key => {
                const next = key as TransparencyReportType
                if (next !== type) navigate(PAGE_CONFIG[next].path)
              }}
            />
          </nav>
        </div>

        <div className={styles.body}>
          <div className={styles.toolbar}>
            <PFText as="span" typo="hd-sm" color="black" className={styles.count}>
              {listQuery.isPending ? (
                <PFLoadingSpinner label="보고서 건수를 불러오는 중" />
              ) : (
                `총 ${listQuery.totalCount}건`
              )}
            </PFText>
            <div className={styles.search}>
              <PFSearchInput
                className={styles.searchField}
                variant="outlined"
                value={draftQ}
                onValueChange={setDraftQ}
                placeholder="제목, 내용으로 검색해 보세요"
              />
            </div>
          </div>

          {listQuery.isError ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
              보고서 목록을 불러오지 못했습니다.
            </PFText>
          ) : listQuery.isPending ? (
            <PFLoadingSpinner centered label="보고서 목록을 불러오는 중" />
          ) : listQuery.items.length === 0 ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
              검색 결과가 없습니다.
            </PFText>
          ) : (
            <div
              className={[styles.grid, type === 'annual' ? styles.gridAnnual : styles.gridAudit].join(
                ' ',
              )}
            >
              {listQuery.items.map(report => (
                <ReportCard key={report.id} report={report} variant={type} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.pagination}>
          <PFPagination
            currentPage={listQuery.currentPage}
            totalPages={listQuery.totalPages}
            onPageChange={page => updateParams({ page })}
          />
        </div>
      </div>
    </section>
  )
}
