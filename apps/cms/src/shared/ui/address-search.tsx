/**
 * 주소 검색: CmsInput 클릭 시 ContentModal + 백엔드 주소 검색 프록시
 * (`GET /api/portal/public/addresses/search`). 원격 API 미설정 시에만 Juso 직접 호출.
 * @see useAddressSearch
 * 입력 중에는 debounce 자동완성, [검색] / Enter 시에는 전체 결과 조회를 사용한다.
 *
 * BE 거리 geocoding: roadAddr + 상세(addressDetail), 우편번호 제외 — `@jakorea/location/juso` `BE_MEMBER_ADDRESS_GEOCODING_QA_ONE_LINER`
 */

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Flex, Pagination } from 'antd'
import { pickJusoRoadAddressLine } from '@jakorea/location/juso'
import {
  getCmsJusoMissingKeyMessage,
  readJusoApiUrlFromEnv,
  readJusoConfmKeyFromEnv,
  useAddressSearch,
  type JusoAddressItem,
} from '@/shared/hooks'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import type { CmsInputProps } from '@/shared/ui/cms-input'
import './address-search.css'

const MODAL_SEARCH_PLACEHOLDER = '예) 마곡중앙로 171, 분당 주공, 백현동'
const AUTOCOMPLETE_MIN_LENGTH = 2
const AUTOCOMPLETE_DEBOUNCE_MS = 300

const RESULT_LIST_SCROLL_END_THRESHOLD = 4

function isResultListScrolledToEnd(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= RESULT_LIST_SCROLL_END_THRESHOLD
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightKeyword(text: string, keyword: string): ReactNode {
  const needle = keyword.trim()
  if (!needle) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'))
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <span key={`hit-${index}-${part}`} className="address-search__suggest-hit">
        {part}
      </span>
    ) : (
      <Fragment key={`text-${index}-${part}`}>{part}</Fragment>
    )
  )
}

const ADDRESS_TIPS: { label: string; example: string }[] = [
  {
    label: '도로명 + 건물번호',
    example: '예) 마곡중앙로 171, 제주 첨단로 242',
  },
  {
    label: '지역명(동/리) + 번지',
    example: '예) 백현동 532, 제주 영평동 2181',
  },
  {
    label: '지역명(동/리) + 건물명(아파트명)',
    example: '예) 분당 주공, 연수동 주공3차',
  },
  {
    label: '사서함명 + 번호',
    example: '예) 분당우체국사서함 1~100',
  },
]

export interface AddressSearchProps extends Pick<
  CmsInputProps,
  'inputSize' | 'width' | 'disabled' | 'className'
> {
  value: string
  onChange: (next: string) => void
  /** 트리거 인풋 placeholder */
  placeholder?: string
  /** 미지정 시 `VITE_ADDRESS_API_KEY` 또는 `VITE_JUSO_CONFM_KEY` */
  confmKey?: string
  onSelect?: (item: JusoAddressItem) => void
  /** 다른 모달(동의서 작성 등) 위에 겹칠 때 */
  modalZIndex?: number
}

export function AddressSearch({
  value,
  onChange,
  placeholder = '건물명, 도로명 또는 지번',
  inputSize = 'large',
  width = '100%',
  disabled,
  className,
  confmKey: confmKeyProp,
  onSelect,
  modalZIndex,
}: AddressSearchProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [hasQueried, setHasQueried] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [keywordValidationError, setKeywordValidationError] = useState<string | null>(null)
  /** [검색] 후 카드에서 「영문보기」 펼침 키 */
  const [expandedEngKey, setExpandedEngKey] = useState<string | null>(null)
  const resultListRef = useRef<HTMLUListElement>(null)
  const [resultListAtEnd, setResultListAtEnd] = useState(false)

  const confmKey = confmKeyProp ?? readJusoConfmKeyFromEnv()
  const countPerPage = 10

  const { addresses, totalCount, loading, error, search, reset } = useAddressSearch({
    confmKey,
    countPerPage,
    apiUrl: readJusoApiUrlFromEnv(),
    missingKeyMessage: getCmsJusoMissingKeyMessage(),
  })

  const closeModal = useCallback(() => {
    setOpen(false)
    setKeyword('')
    setPage(1)
    setHasQueried(false)
    setIsSuggesting(false)
    setKeywordValidationError(null)
    setExpandedEngKey(null)
    reset()
  }, [reset])

  const openModal = () => {
    if (disabled) return
    setKeyword(value.trim())
    setPage(1)
    setHasQueried(false)
    setIsSuggesting(false)
    setKeywordValidationError(null)
    setExpandedEngKey(null)
    reset()
    setOpen(true)
  }

  const runSearch = async (nextPage = 1) => {
    const trimmed = keyword.trim()
    setIsSuggesting(false)
    setKeywordValidationError(null)
    if (!trimmed) {
      setHasQueried(true)
      setPage(1)
      reset()
      setKeywordValidationError('검색어를 입력해 주세요.')
      return
    }
    setHasQueried(true)
    setPage(nextPage)
    try {
      await search(trimmed, nextPage)
    } catch {
      // API 오류는 검색 결과 영역에서 사용자에게 표시한다.
    }
  }

  const handleSelect = (item: JusoAddressItem) => {
    const line = pickJusoRoadAddressLine(item.roadAddr, item.jibunAddr)
    onChange(line)
    onSelect?.(item)
    closeModal()
  }

  const syncResultListScrollEnd = useCallback(() => {
    const el = resultListRef.current
    if (!el) {
      setResultListAtEnd(false)
      return
    }
    setResultListAtEnd(isResultListScrolledToEnd(el))
  }, [])

  const handleResultListScroll = useCallback(() => {
    syncResultListScrollEnd()
  }, [syncResultListScrollEnd])

  const trimmedKeyword = keyword.trim()
  const effectiveHasQueried = hasQueried && trimmedKeyword.length > 0
  const showSuggestList = isSuggesting && !loading && !error && addresses.length > 0
  const showResultList = effectiveHasQueried && !loading && !error && addresses.length > 0
  const showApiError = (effectiveHasQueried || isSuggesting) && !loading && Boolean(error)
  const showNoResultsMessage = effectiveHasQueried && !loading && !error && addresses.length === 0
  const showTip = trimmedKeyword.length === 0

  useEffect(() => {
    if (!open || !isSuggesting) return
    if (trimmedKeyword.length < AUTOCOMPLETE_MIN_LENGTH) return

    const timer = window.setTimeout(() => {
      void search(trimmedKeyword, 1).catch(() => {
        // API 오류는 검색 결과 영역에서 사용자에게 표시한다.
      })
    }, AUTOCOMPLETE_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [isSuggesting, open, search, trimmedKeyword])

  /** 검색결과 1건 이상·11건 미만: 검색어 조합 안내 */
  const showResultsHint =
    effectiveHasQueried && !loading && addresses.length >= 1 && totalCount < 11
  /** 검색결과 11건 이상: 「검색결과가 많습니다」 안내 */
  const showManyResultsNotice = effectiveHasQueried && !loading && totalCount >= 11
  /** 4건 이상: 모달 max 800px · 3건 이하: compact 469 + 목록 333px */
  const isResultsTall = effectiveHasQueried && showResultList && !loading && totalCount >= 4
  /** 검색결과 3건 이하: 목록 max 333px */
  const isSparseResults =
    effectiveHasQueried && showResultList && !loading && totalCount > 0 && totalCount <= 3
  const modalClassName = [
    'address-search-modal',
    isResultsTall ? 'address-search-modal--results-tall' : 'address-search-modal--compact',
    effectiveHasQueried && (showResultList || showNoResultsMessage || showApiError)
      ? 'address-search-modal--show-results'
      : '',
    isSparseResults ? 'address-search-modal--sparse-results' : '',
  ]
    .filter(Boolean)
    .join(' ')

  /** 3건 이하: 즉시 · 4건+: 목록 스크롤 끝 */
  const showPagination =
    effectiveHasQueried && showResultList && !loading && (isSparseResults || resultListAtEnd)

  useEffect(() => {
    if (!open || !effectiveHasQueried || !showResultList) {
      setResultListAtEnd(false)
      return
    }

    const el = resultListRef.current
    if (!el) return

    const raf = requestAnimationFrame(() => syncResultListScrollEnd())
    const ro = new ResizeObserver(() => syncResultListScrollEnd())
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [
    open,
    effectiveHasQueried,
    showResultList,
    addresses,
    expandedEngKey,
    isResultsTall,
    syncResultListScrollEnd,
  ])

  useEffect(() => {
    const el = resultListRef.current
    if (el) {
      el.scrollTop = 0
    }
    setResultListAtEnd(false)
  }, [page, effectiveHasQueried])

  return (
    <>
      <span className="address-search__trigger-wrap" style={{ width: width || '100%' }}>
        <CmsInput
          icon={<SearchOutlined />}
          value={value}
          readOnly
          onClick={openModal}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openModal()
            }
          }}
          placeholder={placeholder}
          inputSize={inputSize}
          width="100%"
          disabled={disabled}
          className={className}
          aria-haspopup="dialog"
        />
      </span>
      <ContentModal
        open={open}
        onCancel={closeModal}
        title="주소 검색"
        titleBodyGap="always"
        width={600}
        className={modalClassName}
        zIndex={modalZIndex}
      >
        <div className="address-search__body">
          <Flex className="address-search__search-row" gap={8} align="center">
            <span className="address-search__search-input-wrap">
              <CmsInput
                value={keyword}
                onChange={event => {
                  const next = event.target.value
                  setKeyword(next)
                  setKeywordValidationError(null)
                  setHasQueried(false)
                  setPage(1)
                  setIsSuggesting(next.trim().length >= AUTOCOMPLETE_MIN_LENGTH)
                  setExpandedEngKey(null)
                  reset()
                }}
                onPressEnter={() => void runSearch(1)}
                placeholder={MODAL_SEARCH_PLACEHOLDER}
                inputSize="medium"
                width="100%"
                error={Boolean(keywordValidationError)}
                message={keywordValidationError ?? undefined}
              />
              {showSuggestList ? (
                <ul className="address-search__suggest-list" aria-label="주소 검색 자동완성">
                  {addresses.slice(0, countPerPage).map(item => {
                    const label = item.roadAddr || item.jibunAddr
                    const itemKey = `${item.zipNo}-${item.roadAddr}-${item.jibunAddr}`
                    return (
                      <li key={itemKey} className="address-search__suggest-item">
                        <button
                          type="button"
                          className="address-search__suggest-btn"
                          onClick={() => handleSelect(item)}
                        >
                          {highlightKeyword(label, keyword)}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </span>
            <CmsButton
              type="button"
              variant="primary"
              size="medium"
              onClick={() => void runSearch(1)}
            >
              검색
            </CmsButton>
          </Flex>

          <section
            className={`address-search__tip${showTip ? '' : ' address-search__tip--hidden'}`}
            aria-label="주소 검색 안내"
            aria-hidden={!showTip}
          >
            <span className="address-search__tip-title">Tip</span>
            <span className="address-search__tip-lead">
              아래와 같은 조합으로 검색을 하시면 더욱 정확한 결과가 검색됩니다.
            </span>
            <ul className="address-search__tip-list">
              {ADDRESS_TIPS.map(row => (
                <li key={row.label}>
                  <span className="address-search__tip-item-label">{row.label}</span>
                  <span className="address-search__tip-item-example">{row.example}</span>
                </li>
              ))}
            </ul>
          </section>

          <div
            className={[
              'address-search__results',
              !trimmedKeyword && !showSuggestList && !showNoResultsMessage && !showApiError
                ? 'address-search__results--idle'
                : '',
              effectiveHasQueried && (showResultList || showNoResultsMessage || showApiError)
                ? 'address-search__results--queried'
                : '',
              showNoResultsMessage ? 'address-search__results--no-results' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {showResultsHint ? (
              <div className="address-search__search-hint-notice" role="status">
                <p className="address-search__search-hint-line1">
                  검색어에 아래와 같은 조합을 이용하시면 더욱 정확한 결과가 검색됩니다.
                </p>
                <p className="address-search__search-hint-line2">
                  {`'도로명+건물번호', '지역명+지번', '지역명+건물명(아파트명)', '사서함명+번호'`}
                </p>
              </div>
            ) : null}
            {showManyResultsNotice ? (
              <div className="address-search__many-results-notice" role="status">
                <p className="address-search__many-results-line1">
                  <strong className="address-search__many-results-em">검색결과가 많습니다.</strong>
                  검색어에 아래와 같은 조합을 이용하시면 더욱 정확한 결과가 검색됩니다.
                </p>
                <p className="address-search__many-results-line2">
                  {`'도로명+건물번호', '지역명+지번', '지역명+건물명(아파트명)', '사서함명+번호'`}
                </p>
              </div>
            ) : null}
            {showApiError ? (
              <div className="address-search__result-error" role="alert">
                {error?.message ?? '주소 검색 중 오류가 발생했습니다.'}
              </div>
            ) : null}
            {showResultList ? (
              <ul
                ref={resultListRef}
                className="address-search__result-card-list"
                aria-label="주소 검색 결과"
                onScroll={handleResultListScroll}
              >
                {addresses.map(item => {
                  const cardKey = `${item.zipNo}-${item.roadAddr}-${item.jibunAddr}`
                  const engOpen = expandedEngKey === cardKey
                  return (
                    <li key={cardKey} className="address-search__result-card-item">
                      <div
                        className="address-search__result-card-body"
                        tabIndex={0}
                        role="group"
                        aria-label={`${item.roadAddr || item.jibunAddr} 선택`}
                        onClick={() => handleSelect(item)}
                        onKeyDown={event => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          if ((event.target as HTMLElement).closest('.address-search__eng-link'))
                            return
                          event.preventDefault()
                          handleSelect(item)
                        }}
                      >
                        <div className="address-search__result-card-head">
                          <span className="address-search__result-zip">{item.zipNo || '-'}</span>
                          <button
                            type="button"
                            className={`address-search__eng-link${
                              item.engAddr ? '' : ' address-search__eng-link--disabled'
                            }`}
                            disabled={!item.engAddr}
                            aria-expanded={engOpen}
                            aria-label="영문 주소 보기"
                            onClick={event => {
                              event.stopPropagation()
                              if (!item.engAddr) return
                              setExpandedEngKey(engOpen ? null : cardKey)
                            }}
                          >
                            영문보기
                          </button>
                        </div>
                        {engOpen && item.engAddr ? (
                          <p
                            className="address-search__eng-preview"
                            onClick={event => event.stopPropagation()}
                          >
                            {item.engAddr}
                          </p>
                        ) : null}
                        <div className="address-search__result-lines">
                          <div className="address-search__result-line">
                            <span className="address-search__type-badge">도로명</span>
                            <span className="address-search__addr-text">
                              {item.roadAddr || '-'}
                            </span>
                          </div>
                          <div className="address-search__result-line">
                            <span className="address-search__type-badge">지 번</span>
                            <span className="address-search__addr-text">
                              {item.jibunAddr || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : null}
            {showNoResultsMessage ? (
              <>
                <div className="address-search__search-hint-notice" role="status">
                  <p className="address-search__search-hint-line1">
                    검색어에 아래와 같은 조합을 이용하시면 더욱 정확한 결과가 검색됩니다.
                  </p>
                  <p className="address-search__search-hint-line2">
                    {`'도로명+건물번호', '지역명+지번', '지역명+건물명(아파트명)', '사서함명+번호'`}
                  </p>
                </div>
                <div className="address-search__result-empty" role="status">
                  <p className="address-search__result-empty-title">검색 결과가 없습니다</p>
                  <p className="address-search__result-empty-description">
                    검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.
                  </p>
                </div>
              </>
            ) : null}
            {showPagination ? (
              <div className="address-search__pagination">
                <Pagination
                  size="small"
                  current={page}
                  total={totalCount}
                  pageSize={countPerPage}
                  onChange={p => void runSearch(p)}
                  showSizeChanger={false}
                />
              </div>
            ) : null}
          </div>
        </div>
      </ContentModal>
    </>
  )
}
