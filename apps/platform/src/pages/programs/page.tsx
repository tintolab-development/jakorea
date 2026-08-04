import { useEffect, useMemo, useState } from 'react'
import type { ProgramCategory, ProgramsListParams } from '@/features/program'
import {
  buildProgramsListPath,
  DEFAULT_PROGRAMS_LIST_PARAMS,
  filterAndSortPrograms,
  getProgramsListReturnPath,
  OPERATING_PERIOD_FILTER_OPTIONS,
  PROGRAM_CATEGORY_ITEMS,
  PROGRAM_FILTER_KEYS,
  programDetailPath,
  ProgramListItemRow,
  ProgramSort,
  readProgramsListParams,
  useMockProgramsCatalog,
} from '@/features/program'
import {
  educationFormFilterOptions,
  educationTargetFilterOptions,
  recruitmentStatusFilterOptions,
  recruitmentTargetFilterOptions,
} from '@/shared/lib/filter-options'
import { useSearchFilters } from '@/shared/hooks'
import { PFPagination, PFSearchFilter, PFSearchInput, PFTabs, PFText } from '@/shared/ui'
import jaArrowUrl from '@/shared/assets/brand/ja-arrow.svg'
import { SearchListLayout } from '@/widgets/search-list-layout'
import styles from './page.module.css'

const PAGE_SIZE = 10

const AUDIENCE_VALUES = new Set<ProgramCategory>(['all', 'youth', 'institution', 'instructor'])

function parseAudienceValue(value: string): ProgramCategory {
  return AUDIENCE_VALUES.has(value as ProgramCategory)
    ? (value as ProgramCategory)
    : DEFAULT_PROGRAMS_LIST_PARAMS.category
}

export function ProgramsPage() {
  const [params, setParams] = useState(readProgramsListParams)
  const programs = useMockProgramsCatalog()

  /** 탭·필터는 soft navigation — full reload 없이 URL·state만 동기화 (카탈로그 재요청 방지) */
  useEffect(() => {
    const onPopState = () => {
      setParams(readProgramsListParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateParams = (next: Partial<ProgramsListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildProgramsListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const setAudience = (audience: ProgramCategory) => {
    updateParams({ category: audience, page: 1 })
  }

  const { bindFilter, bindSort } = useSearchFilters({
    params,
    updateParams,
    defaultValues: DEFAULT_PROGRAMS_LIST_PARAMS,
    filterKeys: PROGRAM_FILTER_KEYS,
  })

  /** 필터 초기화 — 탭은 유지하지 않고 전체로 */
  const reset = () => {
    updateParams({
      ...Object.fromEntries(
        PROGRAM_FILTER_KEYS.map(key => [key, DEFAULT_PROGRAMS_LIST_PARAMS[key]])
      ),
      category: DEFAULT_PROGRAMS_LIST_PARAMS.category,
      page: 1,
    })
  }

  const filteredPrograms = useMemo(
    () => filterAndSortPrograms(programs, params),
    [programs, params]
  )

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / PAGE_SIZE))
  const currentPage = Math.min(params.page, totalPages)
  const pageItems = filteredPrograms.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <PFText as="h1" typo="page-title" color="gradient-primary-01" className={styles.heroTitle}>
          <span className={styles.heroFirstLine}>
            <img className={styles.heroIcon} src={jaArrowUrl} alt="" aria-hidden="true" />
            나에게 맞는
          </span>
          <span className={styles.heroSecondLine}>프로그램을 찾아볼까요?</span>
        </PFText>
      </header>

      <div className={styles.categories}>
        <PFTabs
          items={PROGRAM_CATEGORY_ITEMS.map(item => ({ key: item.key, label: item.label }))}
          value={params.category}
          onChange={value => setAudience(parseAudienceValue(value))}
          variant="pill"
          size="large"
        />
      </div>

      <SearchListLayout
        search={
          <PFSearchInput
            value={params.q}
            onValueChange={q => updateParams({ q, page: 1 })}
            placeholder="프로그램 검색 (예: 기업가 정신, 금융 문해력)"
          />
        }
        filters={
          <>
            <PFSearchFilter
              label="모집대상"
              options={recruitmentTargetFilterOptions}
              {...bindFilter('recruitmentTarget')}
            />
            <PFSearchFilter
              label="모집현황"
              options={recruitmentStatusFilterOptions}
              {...bindFilter('recruitmentStatus')}
            />
            <PFSearchFilter
              label="운영기간"
              options={[...OPERATING_PERIOD_FILTER_OPTIONS]}
              {...bindFilter('operatingPeriod')}
            />
            <PFSearchFilter
              label="교육대상"
              options={educationTargetFilterOptions}
              {...bindFilter('educationTarget')}
            />
            <PFSearchFilter
              label="교육형태"
              options={educationFormFilterOptions}
              {...bindFilter('educationForm')}
            />
          </>
        }
        onFilterReset={reset}
        toolbarTitle={`총 ${filteredPrograms.length}개 프로그램`}
        sort={<ProgramSort {...bindSort('sort')} />}
        pagination={
          <PFPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => updateParams({ page })}
          />
        }
      >
        <div className={styles.list}>
          {pageItems.map(program => (
            <ProgramListItemRow
              key={program.id}
              program={program}
              onClick={() =>
                window.location.assign(programDetailPath(program.id, getProgramsListReturnPath()))
              }
            />
          ))}
        </div>
      </SearchListLayout>
    </section>
  )
}
