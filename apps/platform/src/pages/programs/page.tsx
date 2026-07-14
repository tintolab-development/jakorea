import { useMemo, useState } from 'react'
import type { ProgramCategory } from '@/features/program'
import {
  buildProgramsListPath,
  getProgramsListReturnPath,
  getMockPrograms,
  PROGRAM_CATEGORY_ITEMS,
  PROGRAM_SORT_OPTIONS,
  programDetailPath,
  readProgramsListParams,
  ProgramListItemRow,
} from '@/features/program'
import {
  educationTargetFilterOptions,
  participantTypeFilterOptions,
  recruitmentStatusFilterOptions,
} from '@/shared/lib/filter-options'
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

  const updateParams = (next: Partial<typeof params>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    window.location.assign(buildProgramsListPath(merged))
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
              options={participantTypeFilterOptions}
              value={params.recruitmentTarget}
              onChange={recruitmentTarget => updateParams({ recruitmentTarget, page: 1 })}
            />
            <PFSearchFilter
              label="모집현황"
              options={recruitmentStatusFilterOptions}
              value={params.recruitmentStatus}
              onChange={recruitmentStatus => updateParams({ recruitmentStatus, page: 1 })}
            />
            <PFSearchFilter
              label="교육대상"
              options={educationTargetFilterOptions}
              value={params.educationTarget}
              onChange={educationTarget => updateParams({ educationTarget, page: 1 })}
            />
            <PFSearchFilter
              label="교육형태"
              options={educationFormFilterOptions}
              value={params.educationForm}
              onChange={educationForm => updateParams({ educationForm, page: 1 })}
            />
          </>
        }
        onFilterReset={() =>
          updateParams({
            recruitmentTarget: 'all',
            recruitmentStatus: 'all',
            educationTarget: 'all',
            educationForm: 'all',
            page: 1,
          })
        }
        toolbarTitle={`총 ${filteredPrograms.length}개 프로그램`}
        sort={
          <>
            {PROGRAM_SORT_OPTIONS.map(option => (
              <button
                key={option.key}
                type="button"
                className={[
                  styles.sortOption,
                  params.sort === option.key ? styles.sortOptionActive : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => updateParams({ sort: option.key, page: 1 })}
              >
                {option.label}
              </button>
            ))}
          </>
        }
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
