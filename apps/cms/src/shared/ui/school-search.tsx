/**
 * 학교 검색: CmsInput 클릭 시 ContentModal + NEIS(나이스) 학교 검색 API
 * @see useNeisSchoolSearch — `VITE_NEIS_API_KEY`
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Flex, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { filterNeisSchoolsByRegion } from '@jakorea/location/neis'
import { getSidoOptions, getSigunguOptions } from '@jakorea/location/sido-sigungu'
import {
  getCmsNeisMissingKeyMessage,
  readNeisApiKeyFromEnv,
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
const MODAL_KEYWORD_PLACEHOLDER = '학교명을 입력해 주세요'

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

export type SchoolSearchSelection = NeisSchoolItem

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
  onSelect?: (item: SchoolSearchSelection) => void
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
  onSelect,
}: SchoolSearchProps) {
  const [open, setOpen] = useState(false)
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const apiKey = apiKeyProp ?? readNeisApiKeyFromEnv()
  const sigunguOptions = getSigunguOptions(sido)
  const trimmedKeyword = keyword.trim()

  const { schools, loading, error, search, reset } = useNeisSchoolSearch({
    apiKey,
    missingKeyMessage: getCmsNeisMissingKeyMessage(),
  })

  const filteredSchools = useMemo(
    () => filterNeisSchoolsByRegion(schools, sido, sigungu),
    [schools, sido, sigungu]
  )

  const filteredTotalCount = filteredSchools.length
  const totalPages = Math.max(1, Math.ceil(filteredTotalCount / SCHOOL_SEARCH_PAGE_SIZE))
  const pagedFilteredSchools = useMemo(
    () =>
      filteredSchools.slice(
        (currentPage - 1) * SCHOOL_SEARCH_PAGE_SIZE,
        currentPage * SCHOOL_SEARCH_PAGE_SIZE
      ),
    [filteredSchools, currentPage]
  )

  const hasResults = filteredTotalCount > 0
  const canSearch = Boolean(sido && trimmedKeyword)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const closeModal = useCallback(() => {
    setOpen(false)
    setSido('')
    setSigungu('')
    setKeyword('')
    setHasSearched(false)
    setCurrentPage(1)
    reset()
  }, [reset])

  const openModal = useCallback(() => {
    if (disabled) return
    setKeyword(value.trim())
    setSido('')
    setSigungu('')
    setHasSearched(false)
    setCurrentPage(1)
    reset()
    setOpen(true)
  }, [disabled, reset, value])

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
    void search(trimmedKeyword, sido)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSigunguChange = (next: string) => {
    setSigungu(next)
    setCurrentPage(1)
  }

  const handleSelect = (school: NeisSchoolItem) => {
    onChange(school.schulNm)
    onSelect?.(school)
    closeModal()
  }

  const columns: ColumnsType<NeisSchoolItem> = [
    {
      title: '학교급',
      dataIndex: 'schulKndScNm',
      key: 'schulKndScNm',
      width: 140,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '학교명',
      dataIndex: 'schulNm',
      key: 'schulNm',
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
      width: 140,
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
        title="학교 검색"
        width={800}
        className="school-search-modal"
        zIndex={1100}
      >
        <div className="school-search__body">
          <Flex className="school-search__filter-row" gap={10} align="center" wrap="wrap">
            <CmsSelect
              placeholder="시/도"
              value={sido || undefined}
              options={getSidoOptions()}
              onChange={handleSidoChange}
              inputSize="medium"
              width={140}
              withAllOption={false}
            />
            <CmsSelect
              placeholder="시/군/구"
              value={sigungu || undefined}
              options={sigunguOptions}
              onChange={handleSigunguChange}
              inputSize="medium"
              width={140}
              disabled={!sido}
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

          <p className="school-search__guide">
            지역을 선택 후 학교명을 입력하여 검색 가능합니다. 소속된 학교명을 선택해 주세요.
          </p>

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
                  <div aria-label="학교 검색 결과">
                    <Table
                      className="cms-data-table cms-data-table--skip-auto-no-col school-search__table"
                      columns={columns}
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
