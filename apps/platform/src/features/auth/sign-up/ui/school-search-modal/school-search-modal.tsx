import { useCallback, useEffect, useMemo, useState } from 'react'
import { CAREER_NET_UNIV_SCH1 } from '@jakorea/location/career-net'
import { filterNeisSchoolsByRegion } from '@jakorea/location/neis'
import { getSidoOptions, getSigunguOptions } from '@jakorea/location/sido-sigungu'
import {
  filterCareerNetUniversitiesBySigungu,
  getPlatformCareerNetMissingKeyMessage,
  getPlatformNeisMissingKeyMessage,
  readCareerNetApiKeyFromEnv,
  readNeisApiKeyFromEnv,
  useCareerNetUniversitySearch,
  useNeisSchoolSearch,
} from '@/shared/hooks'
import { highlightKeyword } from '@/shared/lib/highlight-keyword'
import { PFButton, PFModal, PFPagination, PFSelect, PFText, PFTextInput } from '@/shared/ui'
import {
  compareSchoolSearchResults,
  getResultDisplayName,
  getResultKey,
  getResultLocation,
  toCareerNetDisplayName,
  type SchoolSearchResultItem,
} from './school-search-sort'
import styles from './school-search-modal.module.css'

const SCHOOL_SEARCH_PAGE_SIZE = 10
const GUIDE_TEXT = '학교급과 지역을 선택한 후 학교명을 입력해 검색하세요.'

const SCHOOL_LEVEL_OPTIONS = [
  { label: '초등학교', value: '초등학교' },
  { label: '중학교', value: '중학교' },
  { label: '고등학교', value: '고등학교' },
  { label: '대학교', value: '대학교' },
  { label: '전문대학', value: '전문대학' },
] as const

type SchoolLevel = (typeof SCHOOL_LEVEL_OPTIONS)[number]['value']

const K12_LEVELS: ReadonlySet<SchoolLevel> = new Set(['초등학교', '중학교', '고등학교'])
const HIGHER_ED_LEVELS: ReadonlySet<SchoolLevel> = new Set(['대학교', '전문대학'])

function isHigherEdLevel(level: string): level is '대학교' | '전문대학' {
  return HIGHER_ED_LEVELS.has(level as SchoolLevel)
}

function isK12Level(level: string): level is '초등학교' | '중학교' | '고등학교' {
  return K12_LEVELS.has(level as SchoolLevel)
}

function careerNetSch1ForLevel(level: string): string | undefined {
  if (level === '대학교') return CAREER_NET_UNIV_SCH1.university4
  if (level === '전문대학') return CAREER_NET_UNIV_SCH1.college
  return undefined
}

function resolveSearchMode(effectiveSchoolLevel: string): {
  searchNeis: boolean
  searchCareerNet: boolean
} {
  if (!effectiveSchoolLevel) {
    return { searchNeis: true, searchCareerNet: true }
  }
  if (isHigherEdLevel(effectiveSchoolLevel)) {
    return { searchNeis: false, searchCareerNet: true }
  }
  return { searchNeis: true, searchCareerNet: false }
}

export type SelectedSchool = {
  name: string
  organizationId?: number
  /** NEIS 학교 코드 — CMS와 동일 출처 */
  neisCode?: string
  /** NEIS 소재지 도로명 주소 — 확인 화면 소속/학교 표시용 */
  address?: string
  source?: 'neis' | 'careerNet'
}

type SchoolSearchModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (school: SelectedSchool) => void
  /** 모달 제목 (기본: 소속/학교 검색) */
  title?: string
  /**
   * 학교급 고정 (예: `고등학교`, `전문대학`, `대학교`).
   * 지정 시 해당 급만 검색하고 학교급 셀렉트를 비활성화한다.
   */
  schoolKindFilter?: string
}

function combineSearchErrors(
  includeCareerNet: boolean,
  neisError: Error | null,
  careerNetError: Error | null,
): Error | null {
  if (includeCareerNet && neisError && careerNetError) {
    return new Error(`${neisError.message}\n${careerNetError.message}`)
  }
  if (neisError) return neisError
  if (includeCareerNet && careerNetError) return careerNetError
  return null
}

export function SchoolSearchModal({
  open,
  onClose,
  onSelect,
  title = '소속/학교 검색',
  schoolKindFilter,
}: SchoolSearchModalProps) {
  const lockedSchoolLevel = schoolKindFilter?.trim() || ''
  const [schoolLevel, setSchoolLevel] = useState(lockedSchoolLevel)
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [keywordRequired, setKeywordRequired] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const effectiveSchoolLevel = lockedSchoolLevel || schoolLevel
  const { searchNeis: shouldSearchNeis, searchCareerNet: shouldSearchCareerNet } =
    resolveSearchMode(effectiveSchoolLevel)

  useEffect(() => {
    if (!open) return
    setSchoolLevel(lockedSchoolLevel)
  }, [open, lockedSchoolLevel])

  const {
    schools,
    loading: neisLoading,
    error: neisError,
    search: searchNeis,
    reset: resetNeis,
  } = useNeisSchoolSearch({
    apiKey: readNeisApiKeyFromEnv(),
    missingKeyMessage: getPlatformNeisMissingKeyMessage(),
  })

  const {
    universities,
    loading: careerNetLoading,
    error: careerNetError,
    search: searchCareerNet,
    reset: resetCareerNet,
  } = useCareerNetUniversitySearch({
    apiKey: readCareerNetApiKeyFromEnv(),
    missingKeyMessage: getPlatformCareerNetMissingKeyMessage(),
  })

  const resetResults = useCallback(() => {
    resetNeis()
    resetCareerNet()
  }, [resetNeis, resetCareerNet])

  const sigunguOptions = getSigunguOptions(sido)
  const trimmedKeyword = keyword.trim()

  const filteredResults = useMemo(() => {
    const items: SchoolSearchResultItem[] = []

    const byRegion = filterNeisSchoolsByRegion(schools, sido, sigungu)
    const neisFiltered =
      effectiveSchoolLevel && isK12Level(effectiveSchoolLevel)
        ? byRegion.filter(school => school.schulKndScNm.trim() === effectiveSchoolLevel)
        : shouldSearchNeis
          ? byRegion
          : []

    for (const item of neisFiltered) {
      items.push({ source: 'neis', item })
    }

    if (shouldSearchCareerNet) {
      const filteredUniversities = filterCareerNetUniversitiesBySigungu(universities, sigungu)
      for (const item of filteredUniversities) {
        items.push({ source: 'careerNet', item })
      }
    }

    return items.sort(compareSchoolSearchResults)
  }, [
    schools,
    universities,
    sido,
    sigungu,
    effectiveSchoolLevel,
    shouldSearchNeis,
    shouldSearchCareerNet,
  ])

  const filteredTotalCount = filteredResults.length
  const totalPages = Math.max(1, Math.ceil(filteredTotalCount / SCHOOL_SEARCH_PAGE_SIZE))
  const pagedResults = useMemo(
    () =>
      filteredResults.slice(
        (currentPage - 1) * SCHOOL_SEARCH_PAGE_SIZE,
        currentPage * SCHOOL_SEARCH_PAGE_SIZE,
      ),
    [filteredResults, currentPage],
  )
  const hasResults = filteredTotalCount > 0
  const loading =
    (shouldSearchNeis && neisLoading) || (shouldSearchCareerNet && careerNetLoading)
  const combinedError = useMemo(
    () =>
      hasResults
        ? null
        : combineSearchErrors(shouldSearchCareerNet, neisError, careerNetError),
    [hasResults, shouldSearchCareerNet, neisError, careerNetError],
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleClose = useCallback(() => {
    setSchoolLevel(lockedSchoolLevel)
    setSido('')
    setSigungu('')
    setKeyword('')
    setHasSearched(false)
    setKeywordRequired(false)
    setCurrentPage(1)
    resetResults()
    onClose()
  }, [lockedSchoolLevel, onClose, resetResults])

  const handleSchoolLevelChange = (value: string) => {
    setSchoolLevel(value)
    setHasSearched(false)
    setCurrentPage(1)
    resetResults()
  }

  const handleSidoChange = (value: string) => {
    setSido(value)
    setSigungu('')
    setHasSearched(false)
    setCurrentPage(1)
    resetResults()
  }

  const handleSearch = () => {
    if (loading) return

    if (!trimmedKeyword) {
      setKeywordRequired(true)
      return
    }

    setKeywordRequired(false)
    setHasSearched(true)
    setCurrentPage(1)
    if (shouldSearchNeis) {
      void searchNeis(trimmedKeyword, sido || undefined)
    }
    if (shouldSearchCareerNet) {
      void searchCareerNet(trimmedKeyword, {
        regionSido: sido || undefined,
        sch1: isHigherEdLevel(effectiveSchoolLevel)
          ? careerNetSch1ForLevel(effectiveSchoolLevel)
          : undefined,
      })
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSigunguChange = (value: string) => {
    setSigungu(value)
    setCurrentPage(1)
  }

  const handleSelectResult = (result: SchoolSearchResultItem) => {
    if (result.source === 'neis') {
      const school = result.item
      if (!school.schulNm) return

      onSelect({
        name: school.schulNm,
        neisCode: school.sdSchulCode || undefined,
        address: school.orgRdnma?.trim() || undefined,
        source: 'neis',
      })
    } else {
      const university = result.item
      const name = toCareerNetDisplayName(university)
      if (!name) return

      onSelect({
        name,
        address: getResultLocation(result) !== '-' ? getResultLocation(result) : undefined,
        source: 'careerNet',
      })
    }

    handleClose()
  }

  return (
    <PFModal open={open} title={title} onClose={handleClose}>
      <div
        className={[
          styles.schoolModalMain,
          hasSearched ? styles.schoolModalMainActive : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.schoolModalFilterRow}>
          <PFSelect
            size="xlarge"
            placeholder="학교급"
            aria-label="학교급"
            value={effectiveSchoolLevel}
            options={SCHOOL_LEVEL_OPTIONS.map(option => ({
              label: option.label,
              value: option.value,
            }))}
            disabled={Boolean(lockedSchoolLevel)}
            onValueChange={handleSchoolLevelChange}
          />
          <PFSelect
            size="xlarge"
            placeholder="시/도"
            aria-label="시/도"
            value={sido}
            options={getSidoOptions()}
            onValueChange={handleSidoChange}
          />
          <PFSelect
            size="xlarge"
            placeholder="시/군/구"
            aria-label="시/군/구"
            value={sigungu}
            options={sigunguOptions}
            disabled={!sido}
            onValueChange={handleSigunguChange}
          />
        </div>

        <div
          className={[
            styles.schoolModalSearchRow,
            hasSearched ? styles.schoolModalSearchRowActive : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <PFTextInput
            size="xlarge"
            placeholder="소속 또는 학교를 입력해 주세요"
            value={keyword}
            error={keywordRequired}
            onValueChange={next => {
              setKeyword(next)
              setHasSearched(false)
              setCurrentPage(1)
              if (next.trim()) {
                setKeywordRequired(false)
              }
              if (!next.trim()) {
                resetResults()
              }
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                handleSearch()
              }
            }}
          />
          <PFButton size="xlarge" width="160px" disabled={loading} onClick={handleSearch}>
            검색
          </PFButton>
        </div>

        {!hasSearched ? (
          <PFText as="p" typo="bd-sm-md" className={styles.schoolModalGuide}>
            {GUIDE_TEXT}
          </PFText>
        ) : null}

        {hasSearched ? (
          <div className={styles.schoolModalResults}>
            {loading && !hasResults ? (
              <PFText
                typo="bd-sm-rg"
                color="neutral-warm-500"
                className={styles.schoolResultStatus}
              >
                검색 중입니다.
              </PFText>
            ) : null}
            {combinedError ? (
              <div className={styles.schoolResultNotice}>
                <PFText typo="bd-md-sb" color="error">
                  {combinedError.message}
                </PFText>
              </div>
            ) : null}
            {!loading && !combinedError && !hasResults ? (
              <div className={styles.schoolResultNotice}>
                <PFText as="p" typo="bd-md-sb" color="black">
                  검색 결과가 없습니다.
                </PFText>
                <PFText as="p" typo="label-md" color="black">
                  학교명을 다시 확인하거나 시/군/구를 변경해 보세요.
                </PFText>
              </div>
            ) : null}
            {hasResults ? (
              <>
                <ul className={styles.schoolResultList} aria-label="학교 검색 결과">
                  {pagedResults.map(result => {
                    const displayName = getResultDisplayName(result)
                    const location = getResultLocation(result)

                    return (
                      <li key={getResultKey(result)} className={styles.schoolResultItem}>
                        <div className={styles.schoolResultHeader}>
                          <PFText
                            as="p"
                            typo="bd-md-bd"
                            color="black"
                            className={styles.schoolResultName}
                          >
                            {highlightKeyword(displayName, keyword, styles.schoolResultHit)}
                          </PFText>
                          <PFButton
                            size="small"
                            variant="secondary"
                            onClick={() => {
                              handleSelectResult(result)
                            }}
                          >
                            선택
                          </PFButton>
                        </div>
                        {location !== '-' ? (
                          <div className={styles.schoolResultAddressRow}>
                            <span className={styles.schoolResultTag}>소재지</span>
                            <PFText
                              as="span"
                              typo="bd-sm-md"
                              color="black"
                              className={styles.schoolResultAddress}
                            >
                              {location}
                            </PFText>
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
                <div className={styles.schoolPagination}>
                  <PFPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    variant="compact"
                    size="small"
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </PFModal>
  )
}
