/**
 * 대학교 검색: CmsInput 클릭 시 ContentModal + 커리어넷 학교정보(SCHOOL) API
 * @see useCareerNetUniversitySearch — `VITE_CAREER_NET_API_KEY` / `VITE_CAREEAR_NET_API_KEY`
 * @see https://www.career.go.kr/cnet/front/openapi/openApiSchoolCenter.do
 *
 * UI 시안이 없어 초·중·고 `SchoolSearch`와 동일 레이아웃을 재사용한다.
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
import { getSidoOptions, getSigunguOptions } from '@jakorea/location/sido-sigungu'
import {
  getCmsCareerNetMissingKeyMessage,
  readCareerNetApiKeyFromEnv,
  useCareerNetUniversitySearch,
} from '@/shared/hooks'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsCompactPagination } from '@/shared/ui/cms-compact-pagination'
import { CmsInput } from '@/shared/ui/cms-input'
import type { CmsInputProps } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/shared/ui/school-search.css'

const PAGE_SIZE = 5
const MODAL_KEYWORD_PLACEHOLDER = '대학교명을 입력해 주세요'

const SCH1_OPTIONS = [
  { label: '전체', value: '' },
  { label: '대학(4년제)', value: CAREER_NET_UNIV_SCH1.university4 },
  { label: '전문대학', value: CAREER_NET_UNIV_SCH1.college },
]

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

function universityResultKey(item: CareerNetUniversityItem) {
  return `${item.seq}-${item.schoolName}-${item.campusName}-${item.address}`
}

export type UniversitySearchSelection = CareerNetUniversityItem

export type UniversitySearchSelectMeta = {
  regionSido: string
  regionSigungu: string
}

export interface UniversitySearchProps extends Pick<
  CmsInputProps,
  'inputSize' | 'width' | 'disabled' | 'className'
> {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  /** 커리어넷 API 키 — 미지정 시 env */
  apiKey?: string
  /** 기본 학교유형(전문대학/4년제). 모달에서 변경 가능 */
  defaultSch1?: string
  onSelect?: (item: UniversitySearchSelection, meta: UniversitySearchSelectMeta) => void
}

export function UniversitySearch({
  value,
  onChange,
  placeholder = '대학교명',
  inputSize = 'medium',
  width = '100%',
  disabled,
  className,
  apiKey: apiKeyProp,
  defaultSch1 = '',
  onSelect,
}: UniversitySearchProps) {
  const [open, setOpen] = useState(false)
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [sch1, setSch1] = useState(defaultSch1)
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const apiKey = apiKeyProp ?? readCareerNetApiKeyFromEnv()
  const sigunguOptions = getSigunguOptions(sido)
  const trimmedKeyword = keyword.trim()

  const { universities, loading, error, search, reset } = useCareerNetUniversitySearch({
    apiKey,
    missingKeyMessage: getCmsCareerNetMissingKeyMessage(),
  })

  const filteredUniversities = useMemo(
    () => filterCareerNetUniversitiesBySigungu(universities, sigungu),
    [universities, sigungu]
  )

  const filteredTotalCount = filteredUniversities.length
  const totalPages = Math.max(1, Math.ceil(filteredTotalCount / PAGE_SIZE))
  const pagedUniversities = useMemo(
    () => filteredUniversities.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredUniversities, currentPage]
  )

  const hasResults = filteredTotalCount > 0
  const canSearch = Boolean(trimmedKeyword)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const closeModal = useCallback(() => {
    setOpen(false)
    setSido('')
    setSigungu('')
    setSch1(defaultSch1)
    setKeyword('')
    setHasSearched(false)
    setCurrentPage(1)
    reset()
  }, [defaultSch1, reset])

  const openModal = useCallback(() => {
    if (disabled) return
    setKeyword(value.trim())
    setSido('')
    setSigungu('')
    setSch1(defaultSch1)
    setHasSearched(false)
    setCurrentPage(1)
    reset()
    setOpen(true)
  }, [defaultSch1, disabled, reset, value])

  const handleSidoChange = (next: string) => {
    setSido(next)
    setSigungu('')
    setHasSearched(false)
    setCurrentPage(1)
    reset()
  }

  const handleSearch = () => {
    if (!canSearch || loading) return
    setHasSearched(true)
    setCurrentPage(1)
    void search(trimmedKeyword, {
      regionSido: sido || undefined,
      sch1: sch1 || undefined,
    })
  }

  const handleSelect = (item: CareerNetUniversityItem) => {
    const displayName = item.campusName
      ? `${item.schoolName} (${item.campusName})`
      : item.schoolName
    onChange(displayName)
    onSelect?.(item, {
      regionSido: sido.trim() || item.region.trim(),
      regionSigungu: sigungu.trim(),
    })
    closeModal()
  }

  const columns: ColumnsType<CareerNetUniversityItem> = [
    {
      title: '학교유형',
      dataIndex: 'schoolGubun',
      key: 'schoolGubun',
      width: 120,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '대학교명',
      dataIndex: 'schoolName',
      key: 'schoolName',
      ellipsis: true,
      render: (text: string) => highlightKeyword(text, keyword),
    },
    {
      title: '캠퍼스',
      dataIndex: 'campusName',
      key: 'campusName',
      width: 110,
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
      width: 100,
      align: 'center',
      render: (_, record) => (
        <CmsButton
          type="button"
          variant="secondary"
          size="small"
          onClick={() => handleSelect(record)}
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
        title="대학교 검색"
        titleBodyGap="always"
        width={880}
        className="school-search-modal"
        zIndex={1100}
      >
        <div className="school-search__body">
          <Flex className="school-search__filter-row" gap={10} align="center" wrap="wrap">
            <CmsSelect
              placeholder="시/도"
              value={sido}
              options={getSidoOptions()}
              onChange={handleSidoChange}
              inputSize="medium"
              width={140}
              withAllOption
            />
            <CmsSelect
              placeholder="시/군/구"
              value={sigungu}
              options={sigunguOptions}
              onChange={next => {
                setSigungu(next)
                setCurrentPage(1)
              }}
              inputSize="medium"
              width={140}
              disabled={!sido}
              withAllOption
            />
            <CmsSelect
              placeholder="학교유형"
              value={sch1}
              options={SCH1_OPTIONS}
              onChange={next => {
                setSch1(next)
                setHasSearched(false)
                setCurrentPage(1)
                reset()
              }}
              inputSize="medium"
              width={140}
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
                    reset()
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

          <p className="school-search__guide">대학교명을 입력해 검색하세요.</p>

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
              {hasResults ? (
                <>
                  <div aria-label="대학교 검색 결과">
                    <Table
                      className="cms-data-table cms-data-table--skip-auto-no-col school-search__table"
                      columns={columns}
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
                      onPageChange={setCurrentPage}
                      ariaLabel="대학교 검색 페이지 이동"
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
