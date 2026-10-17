import { useEffect, useState } from 'react'
import type { ProgramCategory, ProgramsListParams } from '@/features/program'
import {
  buildProgramsListPath,
  DEFAULT_PROGRAMS_LIST_PARAMS,
  getProgramsListReturnPath,
  PROGRAM_CATEGORY_ITEMS,
  PROGRAM_FILTER_KEYS,
  focusFromListItem,
  programDetailPath,
  programListEntryKey,
  ProgramListItemRow,
  ProgramSort,
  readProgramsListParams,
  usePortalProgramsList,
} from '@/features/program'
import {
  educationFormFilterOptions,
  educationTargetFilterOptions,
  programTypeFilterOptions,
  recruitmentStatusFilterOptions,
  recruitmentTargetFilterOptions,
} from '@/shared/lib/filter-options'
import { useDebouncedValue, useSearchFilters } from '@/shared/hooks'
import {
  PFPagination,
  PFLoadingSpinner,
  PFSearchDateFilter,
  PFSearchFilter,
  PFSearchInput,
  PFTabs,
  PFText,
} from '@/shared/ui'
import jaArrowUrl from '@/shared/assets/brand/ja-arrow.svg'
import { SearchListLayout } from '@/widgets/search-list-layout'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

const AUDIENCE_VALUES = new Set<ProgramCategory>(['all', 'youth', 'institution', 'instructor'])
const SEARCH_DEBOUNCE_MS = 500

function parseAudienceValue(value: string): ProgramCategory {
  return AUDIENCE_VALUES.has(value as ProgramCategory)
    ? (value as ProgramCategory)
    : DEFAULT_PROGRAMS_LIST_PARAMS.category
}

export function ProgramsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState(readProgramsListParams)
  const [draftQ, setDraftQ] = useState(() => readProgramsListParams().q)
  const debouncedQ = useDebouncedValue(draftQ, SEARCH_DEBOUNCE_MS)
  const { items: pageItems, totalCount, totalPages, currentPage, isPending, isError } =
    usePortalProgramsList(params)

  /** 탭·필터는 soft navigation — URL·state만 동기화 */
  useEffect(() => {
    const onPopState = () => {
      const next = readProgramsListParams()
      setParams(next)
      setDraftQ(next.q)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setParams(prev => {
      if (prev.q === debouncedQ) return prev
      const merged: ProgramsListParams = { ...prev, q: debouncedQ, page: 1 }
      const nextPath = buildProgramsListPath(merged)
      const currentPath = `${window.location.pathname}${window.location.search}`
      if (nextPath !== currentPath) {
        window.history.pushState(null, '', nextPath)
      }
      return merged
    })
  }, [debouncedQ])

  const updateParams = (next: Partial<ProgramsListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    if (next.q !== undefined) {
      setDraftQ(next.q)
    }
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
            value={draftQ}
            onValueChange={setDraftQ}
            placeholder="프로그램 검색 (예: 기업가 정신, 금융 문해력)"
          />
        }
        filters={
          <>
            <PFSearchFilter
              label="프로그램 유형"
              options={programTypeFilterOptions}
              {...bindFilter('programType')}
            />
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
            <PFSearchDateFilter
              label="운영기간"
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
        toolbarTitle={`총 ${totalCount}개 프로그램`}
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
          {isPending ? (
            <PFLoadingSpinner centered label="프로그램을 불러오는 중" />
          ) : isError ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
              프로그램을 불러오지 못했습니다.
            </PFText>
          ) : pageItems.length === 0 ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
              등록된 프로그램이 없습니다.
            </PFText>
          ) : (
            pageItems.map(program => (
              <ProgramListItemRow
                key={programListEntryKey(program)}
                program={program}
                activeTab={params.category}
                onClick={() =>
                  navigate(
                    programDetailPath(
                      program.id,
                      getProgramsListReturnPath(),
                      focusFromListItem(program, params.category),
                    ),
                  )
                }
              />
            ))
          )}
        </div>
      </SearchListLayout>
    </section>
  )
}
