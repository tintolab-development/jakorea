import { useMemo, useState } from 'react'
import type { ProgramCategory, ProgramsListParams } from '@/features/program'
import {
  buildProgramsListPath,
  DEFAULT_PROGRAMS_LIST_PARAMS,
  getProgramsListReturnPath,
  getMockPrograms,
  PROGRAM_CATEGORY_ITEMS,
  PROGRAM_FILTER_KEYS,
  programDetailPath,
  ProgramListItemRow,
  ProgramSort,
  readProgramsListParams,
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

export function ProgramsPage() {
  const [params, setParams] = useState(readProgramsListParams)

  const updateParams = (next: Partial<ProgramsListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    window.location.assign(buildProgramsListPath(merged))
  }

  const { bindFilter, bindSort, reset } = useSearchFilters({
    params,
    updateParams,
    defaultValues: DEFAULT_PROGRAMS_LIST_PARAMS,
    filterKeys: PROGRAM_FILTER_KEYS,
  })

  const filteredPrograms = useMemo(() => {
    let items = getMockPrograms()

    if (params.category !== 'all') {
      items = items.filter(program => program.category === params.category)
    }

    if (params.q.trim()) {
      const query = params.q.trim().toLowerCase()
      items = items.filter(program => program.title.toLowerCase().includes(query))
    }

    if (params.sort === 'name') {
      items = [...items].sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    }

    return items
  }, [params.category, params.q, params.sort])

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
          onChange={category => updateParams({ category: category as ProgramCategory, page: 1 })}
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
              {...bindFilter('recruitmentTarget')}
            />
            <PFSearchFilter
              label="모집현황"
              options={recruitmentStatusFilterOptions}
              {...bindFilter('recruitmentStatus')}
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
