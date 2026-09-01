/**
 * 학교 검색: CmsInput 클릭 시 ContentModal
 * - 초·중·고 → NEIS(나이스) 학교 검색 API (`useNeisSchoolSearch`)
 * - 대학교·전문대학 → 커리어넷 SCHOOL API (`useCareerNetUniversitySearch`)
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Flex, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CAREER_NET_UNIV_SCH1,
  filterCareerNetUniversitiesBySigungu,
  type CareerNetUniversityItem,
} from '@jakorea/location/career-net'
import { filterNeisSchoolsByRegion } from '@jakorea/location/neis'
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
import './school-search.css'

const SCHOOL_SEARCH_PAGE_SIZE = 5
const MODAL_KEYWORD_PLACEHOLDER = '예) JA초등학교'
const GUIDE_TEXT = '학교급과 지역을 선택한 후 학교명을 입력해 검색하세요.'

export const SCHOOL_LEVEL_OPTIONS = [
  { label: '초등학교', value: '초등학교' },
  { label: '중학교', value: '중학교' },
  { label: '고등학교', value: '고등학교' },
  { label: '대학교', value: '대학교' },
  { label: '전문대학', value: '전문대학' },
] as const

export type SchoolLevel = (typeof SCHOOL_LEVEL_OPTIONS)[number]['value']

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

function schoolResultKey(school: NeisSchoolItem) {
  return `${school.sdSchulCode}-${school.schulNm}-${school.orgRdnma}`
}

function universityResultKey(item: CareerNetUniversityItem) {
  return `${item.seq}-${item.schoolName}-${item.campusName}-${item.address}`
}

export type SchoolSearchSelection =
  | { source: 'neis'; item: NeisSchoolItem }
  | { source: 'careerNet'; item: CareerNetUniversityItem }

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

  const neisApiKey = apiKeyProp ?? readNeisApiKeyFromEnv()
  const careerNetApiKey = careerNetApiKeyProp ?? readCareerNetApiKeyFromEnv()
  const sigunguOptions = getSigunguOptions(sido)
  const trimmedKeyword = keyword.trim()
  const isHigherEd = isHigherEdLevel(schoolLevel)

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

  const filteredSchools = useMemo(() => {
    if (!isK12Level(schoolLevel)) return []
    const byRegion = filterNeisSchoolsByRegion(schools, sido, sigungu)
    return byRegion.filter(school => school.schulKndScNm.trim() === schoolLevel)
  }, [schools, sido, sigungu, schoolLevel])

  const filteredUniversities = useMemo(
    () => (isHigherEd ? filterCareerNetUniversitiesBySigungu(universities, sigungu) : []),
    [universities, sigungu, isHigherEd]
  )

  const filteredTotalCount = isHigherEd ? filteredUniversities.length : filteredSchools.length
  const totalPages = Math.max(1, Math.ceil(filteredTotalCount / SCHOOL_SEARCH_PAGE_SIZE))
  const pagedFilteredSchools = useMemo(
    () =>
      filteredSchools.slice(
        (currentPage - 1) * SCHOOL_SEARCH_PAGE_SIZE,
        currentPage * SCHOOL_SEARCH_PAGE_SIZE
      ),
    [filteredSchools, currentPage]
  )
  const pagedUniversities = useMemo(
    () =>
      filteredUniversities.slice(
        (currentPage - 1) * SCHOOL_SEARCH_PAGE_SIZE,
        currentPage * SCHOOL_SEARCH_PAGE_SIZE
      ),
    [filteredUniversities, currentPage]
  )

  const loading = isHigherEd ? careerNetLoading : neisLoading
  const error = isHigherEd ? careerNetError : neisError
  const hasResults = filteredTotalCount > 0
  const canSearch = Boolean(schoolLevel && trimmedKeyword)

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
    resetResults()
    setOpen(true)
  }, [disabled, lockedLevel, resetResults, value])

  const handleSchoolLevelChange = (next: string) => {
    setSchoolLevel(next)
    setHasSearched(false)
    setCurrentPage(1)
    resetResults()
  }

  const handleSidoChange = (next: string) => {
    setSido(next)
    setSigungu('')
    setHasSearched(false)
    setCurrentPage(1)
    resetResults()
  }

  const handleSearch = () => {
    if (!canSearch || loading) return
    setHasSearched(true)
    setCurrentPage(1)
    if (isHigherEdLevel(schoolLevel)) {
      void searchCareerNet(trimmedKeyword, {
        regionSido: sido || undefined,
        sch1: careerNetSch1ForLevel(schoolLevel),
      })
      return
    }
    void searchNeis(trimmedKeyword, sido || undefined)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSigunguChange = (next: string) => {
    setSigungu(next)
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
    const displayName = item.campusName
      ? `${item.schoolName} (${item.campusName})`
      : item.schoolName
    onChange(displayName)
    onSelect?.(
      { source: 'careerNet', item },
      {
        regionSido: sido.trim() || item.region.trim(),
        regionSigungu: sigungu.trim(),
      }
    )
    closeModal()
  }

  const neisColumns: ColumnsType<NeisSchoolItem> = [
    {
      title: '학교급',
      dataIndex: 'schulKndScNm',
      key: 'schulKndScNm',
      width: 100,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '학교명',
      dataIndex: 'schulNm',
      key: 'schulNm',
      width: 220,
      ellipsis: true,
      render: (text: string) => highlightKeyword(text, keyword),
    },
    {
      title: '학교 소재지',
      dataIndex: 'orgRdnma',
      key: 'orgRdnma',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
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
          onClick={() => handleSelectNeis(record)}
        >
          선택
        </CmsButton>
      ),
    },
  ]

  const universityColumns: ColumnsType<CareerNetUniversityItem> = [
    {
      title: '학교유형',
      dataIndex: 'schoolGubun',
      key: 'schoolGubun',
      width: 110,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '대학교명',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 200,
      ellipsis: true,
      render: (text: string) => highlightKeyword(text, keyword),
    },
    {
      title: '캠퍼스',
      dataIndex: 'campusName',
      key: 'campusName',
      width: 100,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '소재지',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
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
          onClick={() => handleSelectUniversity(record)}
        >
          선택
        </CmsButton>
      ),
    },
  ]

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
          icon={<SearchOutlined />}
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
        width={1000}
        className="school-search-modal"
        zIndex={1100}
      >
        <div className="school-search__body">
          <p className="school-search__guide">{GUIDE_TEXT}</p>

          <Flex className="school-search__filter-row" gap={16} align="center" wrap="wrap">
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
              withAllOption={false}
            />
            <span className="school-search__keyword-wrap">
              <CmsInput
                icon={<SearchOutlined />}
                value={keyword}
                onChange={event => {
                  const next = event.target.value
                  setKeyword(next)
                  setHasSearched(false)
                  setCurrentPage(1)
                  if (!next.trim()) {
                    resetResults()
                  }
                }}
                onPressEnter={handleSearch}
                placeholder={MODAL_KEYWORD_PLACEHOLDER}
                inputSize="medium"
                width="100%"
              />
            </span>
            <CmsButton
              type="button"
              variant="primary"
              size="medium"
              className="school-search__search-btn"
              disabled={!canSearch || loading}
              onClick={handleSearch}
            >
              검색
            </CmsButton>
          </Flex>

          {hasSearched ? (
            <div
              className={[
                'school-search__results',
                !loading && !error && !hasResults ? 'school-search__results--no-results' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {loading && !hasResults ? (
                <p className="school-search__status">검색 중입니다.</p>
              ) : null}
              {error ? (
                <div className="school-search__result-error" role="alert">
                  <p>{error.message}</p>
                </div>
              ) : null}
              {!loading && !error && !hasResults ? (
                <div className="school-search__result-empty" role="status">
                  {'검색 결과가 없습니다.\n검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.'}
                </div>
              ) : null}
              {hasResults && isHigherEd ? (
                <>
                  <div aria-label="대학교 검색 결과">
                    <Table
                      className="cms-data-table cms-data-table--skip-auto-no-col school-search__table"
                      columns={universityColumns}
                      dataSource={pagedUniversities}
                      rowKey={universityResultKey}
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
                    />
                  </div>
                </>
              ) : null}
              {hasResults && !isHigherEd ? (
                <>
                  <div aria-label="학교 검색 결과">
                    <Table
                      className="cms-data-table cms-data-table--skip-auto-no-col school-search__table"
                      columns={neisColumns}
                      dataSource={pagedFilteredSchools}
                      rowKey={schoolResultKey}
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
