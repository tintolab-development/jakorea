/**
 * 학교 검색: CmsInput 클릭 시 ContentModal
 * - 초·중·고 → NEIS(나이스) 학교 검색 API (`useNeisSchoolSearch`)
 * - 대학교·전문대학 → 커리어넷 SCHOOL API (`useCareerNetUniversitySearch`)
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Flex } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { toPublicSearchErrorMessage } from '@/shared/lib/public-search-error-message'
import {
  CAREER_NET_UNIV_SCH1,
  filterCareerNetUniversitiesBySigungu,
  type CareerNetUniversityItem,
} from '@jakorea/location/career-net'
import { filterNeisSchoolsByRegion, sortNeisSchools } from '@jakorea/location/neis'
import { getSidoOptions, getSigunguOptions } from '@jakorea/location/sido-sigungu'
import {
  getCmsCareerNetMissingKeyMessage,
  getCmsNeisMissingKeyMessage,
  readCareerNetApiKeyFromEnv,
  readNeisApiKeyFromEnv,
  useCareerNetUniversitySearch,
  useNeisSchoolSearch,
  type NeisSchoolItem,
} from '@/shared/hooks'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsCompactPagination } from '@/shared/ui/cms-compact-pagination'
import { CmsInput } from '@/shared/ui/cms-input'
import type { CmsInputProps } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { FieldSearchIcon } from '@/shared/ui/icons'
import './school-search.css'

export const SCHOOL_SEARCH_PAGE_SIZE = 10
const MODAL_KEYWORD_PLACEHOLDER = '예) JA초등학교'
const GUIDE_TEXT = '학교급과 지역을 선택한 후 학교명을 입력해 검색해 주세요.'

export const SCHOOL_LEVEL_OPTIONS = [
  { label: '초등학교', value: '초등학교' },
  { label: '중학교', value: '중학교' },
  { label: '고등학교', value: '고등학교' },
  { label: '대학교', value: '대학교' },
  { label: '전문대학', value: '전문대학' },
] as const

export type SchoolLevel = (typeof SCHOOL_LEVEL_OPTIONS)[number]['value']

/**
 * NEIS(초·중·고)만 노출할 때 사용 — 예: 강사(교사) 소속 학교.
 * 대학교·전문대학(CareerNet)은 포함하지 않는다.
 */
export const SCHOOL_SEARCH_NEIS_LEVELS = ['초등학교', '중학교', '고등학교'] as const satisfies readonly SchoolLevel[]

const K12_LEVELS: ReadonlySet<SchoolLevel> = new Set(SCHOOL_SEARCH_NEIS_LEVELS)
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

/**
 * 학교급 미선택 시 허용 학교급 중 해당 출처가 있으면 함께 검색한다.
 * (QA: 검색어를 제외한 학교급·시도·시군구는 선택하지 않아도 검색 가능)
 */
function resolveSearchSources(
  level: string,
  allowedLevels: readonly SchoolLevel[]
): { neis: boolean; careerNet: boolean } {
  if (level) {
    return { neis: isK12Level(level), careerNet: isHigherEdLevel(level) }
  }
  return {
    neis: allowedLevels.some(isK12Level),
    careerNet: allowedLevels.some(isHigherEdLevel),
  }
}

/** 학교급 미선택 시 허용 대학 학교급이 1개면 그 sch1, 아니면 전체 */
function careerNetSch1ForSearch(
  level: string,
  allowedLevels: readonly SchoolLevel[]
): string | undefined {
  if (level) return careerNetSch1ForLevel(level)
  const higherEdLevels = allowedLevels.filter(isHigherEdLevel)
  return higherEdLevels.length === 1 ? careerNetSch1ForLevel(higherEdLevels[0]) : undefined
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightKeyword(text: string, q: string): ReactNode {
  const needle = q.trim()
  if (!needle) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <span key={`h-${i}-${part}`} className="school-search__keyword-hit">
        {part}
      </span>
    ) : (
      <Fragment key={`t-${i}-${part}`}>{part}</Fragment>
    )
  )
}

export type SchoolSearchSelection =
  | { source: 'neis'; item: NeisSchoolItem }
  | { source: 'careerNet'; item: CareerNetUniversityItem }

function resultKey(result: SchoolSearchSelection) {
  if (result.source === 'neis') {
    const school = result.item
    return `neis-${school.sdSchulCode}-${school.schulNm}-${school.orgRdnma}`
  }
  const item = result.item
  return `careerNet-${item.seq}-${item.schoolName}-${item.campusName}-${item.address}`
}

function universityDisplayName(item: CareerNetUniversityItem) {
  return item.campusName ? `${item.schoolName} (${item.campusName})` : item.schoolName
}

/** 검색 시 선택한 시/도·시/군/구 (서버 `regionSido`/`regionSigungu`용) */
export type SchoolSearchSelectMeta = {
  regionSido: string
  regionSigungu: string
}

export interface SchoolSearchProps extends Pick<
  CmsInputProps,
  'inputSize' | 'width' | 'disabled' | 'className'
> {
  value: string
  onChange: (next: string) => void
  /** 트리거 인풋 placeholder */
  placeholder?: string
  /** NEIS API 키 — 미지정 시 `VITE_NEIS_API_KEY` */
  apiKey?: string
  /** 커리어넷 API 키 — 미지정 시 env */
  careerNetApiKey?: string
  /**
   * 허용 학교급. 1개만 있으면 모달 오픈 시 고정·셀렉트 비활성.
   * 미지정 시 초·중·고·대 전체.
   */
  allowedSchoolLevels?: readonly SchoolLevel[]
  onSelect?: (item: SchoolSearchSelection, meta: SchoolSearchSelectMeta) => void
}

export function SchoolSearch({
  value,
  onChange,
  placeholder = '소속 학교명',
  inputSize = 'medium',
  width = '100%',
  disabled,
  className,
  apiKey: apiKeyProp,
  careerNetApiKey: careerNetApiKeyProp,
  allowedSchoolLevels,
  onSelect,
}: SchoolSearchProps) {
  const levelOptions = useMemo(() => {
    if (!allowedSchoolLevels?.length) return [...SCHOOL_LEVEL_OPTIONS]
    const allowed = new Set(allowedSchoolLevels)
    return SCHOOL_LEVEL_OPTIONS.filter(opt => allowed.has(opt.value))
  }, [allowedSchoolLevels])

  const lockedLevel = allowedSchoolLevels?.length === 1 ? allowedSchoolLevels[0] : undefined

  const [open, setOpen] = useState(false)
  const [schoolLevel, setSchoolLevel] = useState<string>(lockedLevel ?? '')
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [keywordValidationError, setKeywordValidationError] = useState<string | null>(null)

  const neisApiKey = apiKeyProp ?? readNeisApiKeyFromEnv()
  const careerNetApiKey = careerNetApiKeyProp ?? readCareerNetApiKeyFromEnv()
  const sigunguOptions = getSigunguOptions(sido)
  const trimmedKeyword = keyword.trim()
  const allowedLevelValues = useMemo(() => levelOptions.map(opt => opt.value), [levelOptions])
  const sources = resolveSearchSources(schoolLevel, allowedLevelValues)

  const {
    schools,
    loading: neisLoading,
    error: neisError,
    search: searchNeis,
    reset: resetNeis,
  } = useNeisSchoolSearch({
    apiKey: neisApiKey,
    missingKeyMessage: getCmsNeisMissingKeyMessage(),
  })

  const {
    universities,
    loading: careerNetLoading,
    error: careerNetError,
    search: searchCareerNet,
    reset: resetCareerNet,
  } = useCareerNetUniversitySearch({
    apiKey: careerNetApiKey,
    missingKeyMessage: getCmsCareerNetMissingKeyMessage(),
  })

  const resetResults = useCallback(() => {
    resetNeis()
    resetCareerNet()
  }, [resetNeis, resetCareerNet])

  const filteredResults = useMemo<SchoolSearchSelection[]>(() => {
    const items: SchoolSearchSelection[] = []
    if (sources.neis) {
      const byRegion = filterNeisSchoolsByRegion(schools, sido, sigungu)
      // 학교급 미선택 시에도 셀렉트에 있는 초·중·고 학교급만 노출한다.
      const k12Levels: readonly string[] = schoolLevel
        ? [schoolLevel]
        : allowedLevelValues.filter(isK12Level)
      const byLevel = byRegion.filter(school => k12Levels.includes(school.schulKndScNm.trim()))
      for (const item of sortNeisSchools(byLevel)) items.push({ source: 'neis', item })
    }
    if (sources.careerNet) {
      for (const item of filterCareerNetUniversitiesBySigungu(universities, sigungu)) {
        items.push({ source: 'careerNet', item })
      }
    }
    return items
  }, [
    schools,
    universities,
    sido,
    sigungu,
    schoolLevel,
    allowedLevelValues,
    sources.neis,
    sources.careerNet,
  ])

  const filteredTotalCount = filteredResults.length
  const totalPages = Math.max(1, Math.ceil(filteredTotalCount / SCHOOL_SEARCH_PAGE_SIZE))
  const pagedResults = useMemo(
    () =>
      filteredResults.slice(
        (currentPage - 1) * SCHOOL_SEARCH_PAGE_SIZE,
        currentPage * SCHOOL_SEARCH_PAGE_SIZE
      ),
    [filteredResults, currentPage]
  )

  const loading = (sources.neis && neisLoading) || (sources.careerNet && careerNetLoading)
  const hasResults = filteredTotalCount > 0
  const sourceErrors = [
    sources.neis ? neisError : null,
    sources.careerNet ? careerNetError : null,
  ].filter((e): e is Error => e != null)
  // 혼합 검색에서 한쪽만 실패하면 나머지 결과를 그대로 보여 준다.
  const errorMessage = hasResults ? null : [...new Set(sourceErrors.map(toPublicSearchErrorMessage))].join('\n') || null

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const closeModal = useCallback(() => {
    setOpen(false)
    setSchoolLevel(lockedLevel ?? '')
    setSido('')
    setSigungu('')
    setKeyword('')
    setHasSearched(false)
    setCurrentPage(1)
    setKeywordValidationError(null)
    resetResults()
  }, [lockedLevel, resetResults])

  const openModal = useCallback(() => {
    if (disabled) return
    setKeyword(value.trim())
    setSchoolLevel(lockedLevel ?? '')
    setSido('')
    setSigungu('')
    setHasSearched(false)
    setCurrentPage(1)
    setKeywordValidationError(null)
    resetResults()
    setOpen(true)
  }, [disabled, lockedLevel, resetResults, value])

  const handleSchoolLevelChange = (next: string) => {
    setSchoolLevel(next)
    setKeywordValidationError(null)
    setHasSearched(false)
    setCurrentPage(1)
    resetResults()
  }

  const handleSidoChange = (next: string) => {
    setSido(next)
    setSigungu('')
    setKeywordValidationError(null)
    setHasSearched(false)
    setCurrentPage(1)
    resetResults()
  }

  const handleSearch = () => {
    if (loading) return
    setHasSearched(true)
    setCurrentPage(1)
    if (!trimmedKeyword) {
      setHasSearched(false)
      setKeywordValidationError('검색어를 입력해 주세요.')
      resetResults()
      return
    }
    setKeywordValidationError(null)
    if (sources.careerNet) {
      void searchCareerNet(trimmedKeyword, {
        regionSido: sido || undefined,
        sch1: careerNetSch1ForSearch(schoolLevel, allowedLevelValues),
      }).catch(() => {
        // API 오류는 검색 결과 영역에서 사용자에게 표시한다.
      })
    }
    if (sources.neis) {
      void searchNeis(trimmedKeyword, sido || undefined).catch(() => {
        // API 오류는 검색 결과 영역에서 사용자에게 표시한다.
      })
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSigunguChange = (next: string) => {
    setSigungu(next)
    setKeywordValidationError(null)
    setCurrentPage(1)
  }

  const handleSelectNeis = (school: NeisSchoolItem) => {
    onChange(school.schulNm)
    onSelect?.(
      { source: 'neis', item: school },
      {
        regionSido: sido.trim(),
        regionSigungu: sigungu.trim(),
      }
    )
    closeModal()
  }

  const handleSelectUniversity = (item: CareerNetUniversityItem) => {
    onChange(universityDisplayName(item))
    onSelect?.(
      { source: 'careerNet', item },
      {
        regionSido: sido.trim() || item.region.trim(),
        regionSigungu: sigungu.trim(),
      }
    )
    closeModal()
  }

  const handleSelectResult = (result: SchoolSearchSelection) => {
    if (result.source === 'neis') handleSelectNeis(result.item)
    else handleSelectUniversity(result.item)
  }

  const selectColumn: ColumnsType<SchoolSearchSelection>[number] = {
    title: '선택',
    key: 'select',
    width: 120,
    align: 'center',
    className: 'school-search__col-select',
    onHeaderCell: () => ({ className: 'school-search__col-select' }),
    render: (_, record) => (
      <CmsButton
        type="button"
        variant="secondary"
        size="small"
        className="school-search__select-btn"
        onClick={() => handleSelectResult(record)} >
        선택
      </CmsButton>
    ),
  }

  /** 초·중·고 표 — 학교급 미선택 혼합 검색도 같은 열 구성으로 대학을 함께 노출 */
  const neisColumns: ColumnsType<SchoolSearchSelection> = [
    {
      title: '학교급',
      key: 'schoolLevel',
      width: 120,
      ellipsis: true,
      render: (_, record) =>
        (record.source === 'neis' ? record.item.schulKndScNm : record.item.schoolGubun) || '-',
    },
    {
      title: '학교명',
      key: 'schoolName',
      width: 200,
      ellipsis: true,
      render: (_, record) =>
        highlightKeyword(
          record.source === 'neis' ? record.item.schulNm : universityDisplayName(record.item),
          keyword
        ),
    },
    {
      title: '학교 소재지',
      key: 'address',
      ellipsis: true,
      render: (_, record) =>
        (record.source === 'neis' ? record.item.orgRdnma : record.item.address) || '-',
    },
    selectColumn,
  ]

  const universityColumns: ColumnsType<SchoolSearchSelection> = [
    {
      title: '학교유형',
      key: 'schoolGubun',
      width: 110,
      ellipsis: true,
      render: (_, record) => (record.source === 'careerNet' && record.item.schoolGubun) || '-',
    },
    {
      title: '대학교명',
      key: 'schoolName',
      width: 200,
      ellipsis: true,
      render: (_, record) =>
        record.source === 'careerNet' ? highlightKeyword(record.item.schoolName, keyword) : '-',
    },
    {
      title: '캠퍼스',
      key: 'campusName',
      width: 100,
      ellipsis: true,
      render: (_, record) => (record.source === 'careerNet' && record.item.campusName) || '-',
    },
    {
      title: '소재지',
      key: 'address',
      ellipsis: true,
      render: (_, record) => (record.source === 'careerNet' && record.item.address) || '-',
    },
    selectColumn,
  ]

  const isUniversityOnly = sources.careerNet && !sources.neis

  const resolvedWidth = width != null ? (typeof width === 'number' ? `${width}px` : width) : '100%'

  return (
    <>
      <span
        className="school-search__trigger-wrap"
        style={{ width: resolvedWidth }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-disabled={disabled || undefined}
        onClick={openModal}
        onKeyDown={event => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openModal()
          }
        }}
      >
        <CmsInput
          icon={<FieldSearchIcon />}
          value={value}
          readOnly
          placeholder={placeholder}
          inputSize={inputSize}
          width="100%"
          disabled={disabled}
          className={className}
          tabIndex={-1}
        />
      </span>
      <ContentModal
        open={open}
        onCancel={closeModal}
        title="학교 검색"
        titleBodyGap="always"
        width={800}
        className="school-search-modal"
        zIndex={1100}
      >
        <div className="school-search__body">
          <p className="school-search__guide">{GUIDE_TEXT}</p>

          {/* 시안 4718:38736: 선택창 3개 + 검색어 228 + [검색]이 한 줄, 칸 사이 8 */}
          <Flex className="school-search__filter-row" gap={8} align="center" wrap="nowrap">
            <CmsSelect
              placeholder="학교급"
              value={schoolLevel || undefined}
              options={levelOptions.map(opt => ({ label: opt.label, value: opt.value }))}
              onChange={handleSchoolLevelChange}
              inputSize="medium"
              width={120}
              disabled={Boolean(lockedLevel)}
              withAllOption={false}
            />
            <CmsSelect
              placeholder="시/도"
              value={sido}
              options={getSidoOptions()}
              onChange={handleSidoChange}
              inputSize="medium"
              width={120}
              withAllOption={false}
            />
            <CmsSelect
              placeholder="시/군/구"
              value={sigungu}
              options={sigunguOptions}
              onChange={handleSigunguChange}
              inputSize="medium"
              width={120}
              // 시/도 미선택 등 선택할 값이 없으면 비활성화한다(빈 목록 No Data 방지).
              disabled={sigunguOptions.length === 0}
              withAllOption={false}
            />
            <span className="school-search__keyword-wrap">
              <CmsInput
                icon={<FieldSearchIcon />}
                value={keyword}
                onChange={event => {
                  const next = event.target.value
                  setKeyword(next)
                  setKeywordValidationError(null)
                  setHasSearched(false)
                  setCurrentPage(1)
                  resetResults()
                }}
                onPressEnter={handleSearch}
                placeholder={MODAL_KEYWORD_PLACEHOLDER}
                inputSize="medium"
                width="100%"
                // 시안 — 검색어 미입력은 필드 아래 문구 없이 error 테두리만 표시
                error={Boolean(keywordValidationError)}
              />
            </span>
            <CmsButton
              type="button"
              variant="primary"
              size="medium" className="school-search__search-btn"
              disabled={loading}
              onClick={handleSearch} >
              검색
            </CmsButton>
          </Flex>

          {hasSearched ? (
            <div
              className={[
                'school-search__results',
                !loading && !errorMessage && !hasResults ? 'school-search__results--no-results' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {loading && !hasResults ? (
                <p className="school-search__status">검색 중입니다.</p>
              ) : null}
              {errorMessage ? (
                <div className="school-search__result-error" role="alert">
                  {errorMessage.split('\n').map(line => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : null}
              {!loading && !errorMessage && !hasResults ? (
                <div className="school-search__result-empty" role="status">
                  <p className="school-search__result-empty-title">검색 결과가 없습니다</p>
                  <p className="school-search__result-empty-description">
                    검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.
                  </p>
                </div>
              ) : null}
              {hasResults ? (
                <>
                  <div aria-label={isUniversityOnly ? '대학교 검색 결과' : '학교 검색 결과'}>
                    <CmsDataTable
                      className="cms-data-table cms-data-table--skip-auto-no-col school-search__table"
                      columns={isUniversityOnly ? universityColumns : neisColumns}
                      dataSource={pagedResults}
                      rowKey={resultKey}
                      pagination={false}
                      size="small"
                    />
                  </div>
                  <div className="school-search__pagination">
                    <CmsCompactPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      ariaLabel="학교 검색 페이지 이동"
                      variant="modal"
                    />
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </ContentModal>
    </>
  )
}
