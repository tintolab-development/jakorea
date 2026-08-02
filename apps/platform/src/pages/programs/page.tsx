import { useMemo, useState } from 'react'
import type { ProgramCategory, ProgramsListParams } from '@/features/program'
import {
  buildProgramsListPath,
  DEFAULT_PROGRAMS_LIST_PARAMS,
  getProgramsListReturnPath,
  getMockPrograms,
  OPERATING_PERIOD_FILTER_OPTIONS,
  PROGRAM_CATEGORY_ITEMS,
  PROGRAM_FILTER_KEYS,
  programDetailPath,
  programOverlapsOperatingYear,
  ProgramListItemRow,
  ProgramSort,
  readProgramsListParams,
  withSyncedAudience,
} from '@/features/program'
import {
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

const educationFormFilterOptions = [
  { value: 'all', label: '전체' },
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '혼합' },
]

const AUDIENCE_VALUES = new Set<ProgramCategory>(['all', 'youth', 'institution', 'instructor'])

function parseAudienceValue(value: string): ProgramCategory {
  return AUDIENCE_VALUES.has(value as ProgramCategory)
    ? (value as ProgramCategory)
    : DEFAULT_PROGRAMS_LIST_PARAMS.category
}

export function ProgramsPage() {
  const [params, setParams] = useState(readProgramsListParams)

  const updateParams = (next: Partial<ProgramsListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    window.location.assign(buildProgramsListPath(merged))
  }

  const setAudience = (audience: ProgramCategory) => {
    updateParams({ ...withSyncedAudience(audience), page: 1 })
  }

  const { bindFilter, bindSort } = useSearchFilters({
    params,
    updateParams,
    defaultValues: DEFAULT_PROGRAMS_LIST_PARAMS,
    filterKeys: PROGRAM_FILTER_KEYS,
  })

  /** 필터 초기화 시 모집대상 ↔ 탭도 함께 전체로 */
  const reset = () => {
    updateParams({
      ...Object.fromEntries(
        PROGRAM_FILTER_KEYS.map(key => [key, DEFAULT_PROGRAMS_LIST_PARAMS[key]])
      ),
      ...withSyncedAudience(DEFAULT_PROGRAMS_LIST_PARAMS.category),
      page: 1,
    })
  }

  const filteredPrograms = useMemo(() => {
    let items = getMockPrograms()

    if (params.category !== 'all') {
      items = items.filter(program => program.category === params.category)
    }

    if (params.q.trim()) {
      const query = params.q.trim().toLowerCase()
      items = items.filter(program => program.title.toLowerCase().includes(query))
    }

    if (params.operatingPeriod !== DEFAULT_PROGRAMS_LIST_PARAMS.operatingPeriod) {
      items = items.filter(program =>
        programOverlapsOperatingYear(program, params.operatingPeriod)
      )
    }

    if (params.sort === 'name') {
      items = [...items].sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    }

    return items
  }, [params.category, params.q, params.operatingPeriod, params.sort])

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
            placeholder="프로그램명 또는 키워드를 검색해 보세요"
          />
        }
        filters={
          <>
            <PFSearchFilter
              label="모집대상"
              options={recruitmentTargetFilterOptions}
              value={params.recruitmentTarget}
              onChange={value => setAudience(parseAudienceValue(value))}
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
