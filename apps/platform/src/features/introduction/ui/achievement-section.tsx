import { useMemo, useState } from 'react'
import { PFPagination, PFSearchInput, PFTabs, PFText } from '@/shared/ui'
import {
  ACHIEVEMENT_RECORDS_PAGE_SIZE,
  ACHIEVEMENT_SEARCH_PLACEHOLDER,
  ACHIEVEMENT_SECTION_TITLE,
  ACHIEVEMENT_TAB_ITEMS,
  AWARD_DATA,
  CERTIFICATION_DATA,
  DEFAULT_HISTORY_PERIOD_ID,
  DEFAULT_HISTORY_YEAR,
  filterAchievementRecords,
  getHistoryYearData,
  HISTORY_PERIODS,
  type AchievementRecordItem,
  type AchievementTabKey,
} from '../lib/achievement-data'
import styles from './achievement-section.module.css'

type RecordsKind = 'award' | 'certification'

const RECORDS_COLUMNS: Record<
  RecordsKind,
  { date: string; title: string; organization: string }
> = {
  award: {
    date: '수상일',
    title: '상명',
    organization: '수여기관',
  },
  certification: {
    date: '인증일',
    title: '내용',
    organization: '인증기관',
  },
}

function HistoryPeriodNav({
  activePeriodId,
  activeYear,
  onPeriodSelect,
  onYearSelect,
}: {
  activePeriodId: string
  activeYear: number
  onPeriodSelect: (periodId: string) => void
  onYearSelect: (year: number) => void
}) {
  const activePeriod =
    HISTORY_PERIODS.find(period => period.id === activePeriodId) ?? HISTORY_PERIODS[0]!

  const renderYearItems = (years: readonly number[]) =>
    years.map(year => {
      const isYearActive = year === activeYear
      return (
        <li key={year} className={styles.yearItem}>
          <button
            type="button"
            className={[styles.yearButton, isYearActive ? styles.yearButtonActive : undefined]
              .filter(Boolean)
              .join(' ')}
            aria-current={isYearActive ? 'true' : undefined}
            onClick={() => onYearSelect(year)}
          >
            {year}
          </button>
        </li>
      )
    })

  return (
    <nav className={styles.historyNav} aria-label="연혁 기간">
      <div className={styles.periodNav}>
        {HISTORY_PERIODS.map(period => {
          const isPeriodActive = period.id === activePeriodId
          return (
            <div
              key={period.id}
              className={[
                styles.periodGroup,
                isPeriodActive ? styles.periodGroupActive : undefined,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className={[
                  styles.periodButton,
                  isPeriodActive ? styles.periodButtonActive : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={isPeriodActive}
                onClick={() => onPeriodSelect(period.id)}
              >
                {period.label}
              </button>

              {isPeriodActive ? (
                <ul
                  className={styles.yearList}
                  aria-label={`${period.label} 연도`}
                >
                  {renderYearItems(period.years)}
                </ul>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Mobile 전용: periodNav와 독립된 가로 스크롤 yearList */}
      <ul
        className={styles.yearListMobile}
        aria-label={`${activePeriod.label} 연도`}
      >
        {renderYearItems(activePeriod.years)}
      </ul>
    </nav>
  )
}

function HistoryList({ year }: { year: number }) {
  const data = getHistoryYearData(year)

  if (!data) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        해당 연도의 연혁이 없습니다.
      </PFText>
    )
  }

  return (
    <div className={styles.historyList} aria-label={`${year}년 연혁`}>
      {data.months.map(group => (
        <div key={group.month} className={styles.monthBlock}>
          <div className={styles.monthRow}>
            <span className={styles.monthLabel}>{group.month}</span>
            <ul className={styles.monthItems}>
              {group.items.map(item => (
                <li key={item} className={styles.monthItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}

function HistoryContent() {
  const [activePeriodId, setActivePeriodId] = useState(DEFAULT_HISTORY_PERIOD_ID)
  const [activeYear, setActiveYear] = useState(DEFAULT_HISTORY_YEAR)

  const handlePeriodSelect = (periodId: string) => {
    setActivePeriodId(periodId)
    const period = HISTORY_PERIODS.find(item => item.id === periodId)
    const nextYear = period?.years[0]
    if (nextYear != null) setActiveYear(nextYear)
  }

  return (
    <div className={styles.historyLayout}>
      <HistoryPeriodNav
        activePeriodId={activePeriodId}
        activeYear={activeYear}
        onPeriodSelect={handlePeriodSelect}
        onYearSelect={setActiveYear}
      />
      <HistoryList year={activeYear} />
    </div>
  )
}

function RecordsContent({
  kind,
  items,
}: {
  kind: RecordsKind
  items: readonly AchievementRecordItem[]
}) {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const columns = RECORDS_COLUMNS[kind]

  const filtered = useMemo(() => filterAchievementRecords(items, query), [items, query])
  const totalPages = Math.max(1, Math.ceil(filtered.length / ACHIEVEMENT_RECORDS_PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageItems = filtered.slice(
    (safePage - 1) * ACHIEVEMENT_RECORDS_PAGE_SIZE,
    safePage * ACHIEVEMENT_RECORDS_PAGE_SIZE,
  )

  const handleSearch = (value: string) => {
    setQuery(value)
    setCurrentPage(1)
  }

  return (
    <div className={styles.recordsLayout}>
      <div className={styles.recordsToolbar}>
        <PFText as="p" typo="hd-sm" color="black" className={styles.recordsCount}>
          총 {filtered.length.toLocaleString('ko-KR')}건
        </PFText>
        <PFSearchInput
          className={styles.recordsSearch}
          variant="outlined"
          value={query}
          onValueChange={handleSearch}
          placeholder={ACHIEVEMENT_SEARCH_PLACEHOLDER}
          aria-label={ACHIEVEMENT_SEARCH_PLACEHOLDER}
        />
      </div>

      <div className={styles.recordsListWrap}>
        <div className={styles.listHeader} aria-hidden="true">
          <span className={styles.colDate}>{columns.date}</span>
          <span className={styles.colTitle}>{columns.title}</span>
          <span className={styles.colOrg}>{columns.organization}</span>
        </div>

        <div className={styles.list}>
          {pageItems.length === 0 ? (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
              검색 결과가 없습니다.
            </PFText>
          ) : (
            pageItems.map(item => (
              <div key={item.id} className={styles.listItem}>
                <span className={styles.itemDate}>{item.dateLabel}</span>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemOrg}>{item.organization}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.paginationWrap}>
        <PFPagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          variant="numbered"
          size="large"
          ariaLabel={`${columns.title} 목록 페이지`}
        />
      </div>
    </div>
  )
}

/** 기관소개 — 걸어온 길과 성과 (정적 document flow, 모션 없음) */
export function AchievementSection() {
  const [activeTab, setActiveTab] = useState<AchievementTabKey>('history')

  return (
    <section className={styles.section} aria-label={ACHIEVEMENT_SECTION_TITLE}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <PFText as="h2" typo="page-title" color="black" className={styles.title}>
            {ACHIEVEMENT_SECTION_TITLE}
          </PFText>
          <PFTabs
            className={styles.tabs}
            items={[...ACHIEVEMENT_TAB_ITEMS]}
            value={activeTab}
            onChange={key => setActiveTab(key as AchievementTabKey)}
            variant="category"
            ariaLabel="걸어온 길과 성과 카테고리"
          />
        </header>

        <div className={styles.tabContent}>
          {activeTab === 'history' ? <HistoryContent /> : null}
          {activeTab === 'award' ? <RecordsContent kind="award" items={AWARD_DATA} /> : null}
          {activeTab === 'certification' ? (
            <RecordsContent kind="certification" items={CERTIFICATION_DATA} />
          ) : null}
        </div>
      </div>
    </section>
  )
}
