import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ANNUAL_REPORTS_PAGE_SIZE,
  AUDIT_REPORTS_PAGE_SIZE,
  ReportCard,
  TRANSPARENCY_ANNUAL_REPORTS_PATH,
  TRANSPARENCY_AUDIT_REPORTS_PATH,
  buildReportsListPath,
  filterReports,
  getMockAnnualReports,
  getMockAuditReports,
  readReportsListParams,
  type TransparencyReportType,
  type TransparencyReportsListParams,
} from '@/features/transparency'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
import { PFPagination, PFSearchInput, PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

const PAGE_CONFIG: Record<
  TransparencyReportType,
  {
    heroTitle: string
    path: string
    pageSize: number
  }
> = {
  annual: {
    heroTitle: '한 해의 활동과 재정 현황을\n투명하게 공개합니다',
    path: TRANSPARENCY_ANNUAL_REPORTS_PATH,
    pageSize: ANNUAL_REPORTS_PAGE_SIZE,
  },
  audit: {
    heroTitle: '기부금 운영의 투명성을\n확인하고 있습니다',
    path: TRANSPARENCY_AUDIT_REPORTS_PATH,
    pageSize: AUDIT_REPORTS_PAGE_SIZE,
  },
}

const TAB_ITEMS = [
  { key: 'annual', label: '연차보고서' },
  { key: 'audit', label: '회계감사 보고서' },
] as const

export type TransparencyReportsPageProps = {
  type: TransparencyReportType
}

export function TransparencyReportsPage({ type }: TransparencyReportsPageProps) {
  useShouldUsePlatformMockData()
  const navigate = useNavigate()
  const config = PAGE_CONFIG[type]
  const reports = type === 'annual' ? getMockAnnualReports() : getMockAuditReports()
  const [params, setParams] = useState(readReportsListParams)

  // 탭 전환(라우트 변경) 시 URL 기준으로 검색어·페이지 재동기화
  const [prevType, setPrevType] = useState(type)
  if (prevType !== type) {
    setPrevType(type)
    setParams(readReportsListParams())
  }

  useEffect(() => {
    const onPopState = () => {
      setParams(readReportsListParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateParams = (next: Partial<TransparencyReportsListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildReportsListPath(config.path, merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const filteredReports = useMemo(
    () => filterReports(reports, params.q),
    [reports, params.q]
  )

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / config.pageSize))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = filteredReports.slice(
    (currentPage - 1) * config.pageSize,
    currentPage * config.pageSize
  )

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
              {`총 ${filteredReports.length}건`}
            </PFText>
            <div className={styles.search}>
              <PFSearchInput
                className={styles.searchField}
                variant="outlined"
                value={params.q}
                onValueChange={q => updateParams({ q, page: 1 })}
                placeholder="제목, 내용으로 검색해 보세요"
              />
            </div>
          </div>

          {pageItems.length === 0 ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
              검색 결과가 없습니다.
            </PFText>
          ) : (
            <div className={[styles.grid, type === 'annual' ? styles.gridAnnual : styles.gridAudit].join(' ')}>
              {pageItems.map(report => (
                <ReportCard key={report.id} report={report} variant={type} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.pagination}>
          <PFPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => updateParams({ page })}
          />
        </div>
      </div>
    </section>
  )
}
