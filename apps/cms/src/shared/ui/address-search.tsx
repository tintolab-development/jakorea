/**
 * 주소 검색: CmsInput 클릭 시 ContentModal + 행안부/주소기반산업지원 도로명주소 검색 API
 * @see useJusoAddressSearch — `VITE_ADDRESS_API_KEY` 또는 `VITE_JUSO_CONFM_KEY`, 선택 `VITE_JUSO_ADDRESS_API_URL`
 */

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Flex, Pagination } from 'antd'
import {
  getCmsJusoMissingKeyMessage,
  readJusoApiUrlFromEnv,
  readJusoConfmKeyFromEnv,
  useJusoAddressSearch,
  type JusoAddressItem,
} from '@/shared/hooks'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import type { CmsInputProps } from '@/shared/ui/cms-input'
import './address-search.css'

const MODAL_SEARCH_PLACEHOLDER = '예) 마곡중앙로 171, 분당 주공, 백현동'

const LIVE_SEARCH_DEBOUNCE_MS = 280
const RESULT_LIST_SCROLL_END_THRESHOLD = 4

function isResultListScrolledToEnd(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= RESULT_LIST_SCROLL_END_THRESHOLD
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 검색어와 일치 구간만 `--JA-mint-01` (시안 자동완성 강조) */
function highlightKeyword(text: string, q: string): ReactNode {
  const needle = q.trim()
  if (!needle) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <span key={`h-${i}-${part}`} className="address-search__suggest-hit">
        {part}
      </span>
    ) : (
      <Fragment key={`t-${i}-${part}`}>{part}</Fragment>
    )
  )
}

/** 자동완성 한 줄: 시군구·읍면동·도로명 조합, 없으면 도로명주소 전체 */
function suggestionPrimaryLine(item: JusoAddressItem): string {
  const base = [item.siNm, item.sggNm, item.emdNm].filter(Boolean).join(' ').trim()
  const rn = item.rn?.trim()
  if (base && rn) return `${base} ${rn}`
  if (base) return base
  return (item.roadAddr || item.jibunAddr).trim() || '-'
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
  inputSize = 'medium',
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
  /** [검색] 후 카드에서 「영문보기」 펼침 키 */
  const [expandedEngKey, setExpandedEngKey] = useState<string | null>(null)
  const resultListRef = useRef<HTMLUListElement>(null)
  const [resultListAtEnd, setResultListAtEnd] = useState(false)

  const confmKey = confmKeyProp ?? readJusoConfmKeyFromEnv()
  const countPerPage = 10

  const { addresses, totalCount, loading, search, reset } = useJusoAddressSearch({
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
    setExpandedEngKey(null)
    reset()
  }, [reset])

  const openModal = () => {
    if (disabled) return
    setKeyword(value.trim())
    setPage(1)
    setHasQueried(false)
    setExpandedEngKey(null)
    reset()
    setOpen(true)
  }

  const runSearch = async (nextPage = 1) => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      setHasQueried(false)
      await search('', 1)
      return
    }
    setHasQueried(true)
    setPage(nextPage)
    await search(trimmed, nextPage)
  }

  useEffect(() => {
    if (!open) return
    const handle = window.setTimeout(() => {
      setPage(1)
      const trimmed = keyword.trim()
      void (trimmed ? search(trimmed, 1) : search('', 1))
    }, LIVE_SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [keyword, open, search])

  const handleSelect = (item: JusoAddressItem) => {
    const line = (item.roadAddr || item.jibunAddr).trim()
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

  const showSuggestList = addresses.length > 0
  const trimmedKeyword = keyword.trim()
  const effectiveHasQueried = hasQueried && trimmedKeyword.length > 0
  const showNoResultsMessage = effectiveHasQueried && !loading && addresses.length === 0
  const showTip = trimmedKeyword.length === 0

  /** 검색결과 11건 이상일 때만 「검색결과가 많습니다」 안내 */
  const showManyResultsNotice = effectiveHasQueried && !loading && totalCount >= 11
  /** 4건 이상: 모달 max 800px · 3건 이하: compact 469 + 목록 333px */
  const isResultsTall = effectiveHasQueried && showSuggestList && !loading && totalCount >= 4
  /** 검색결과 3건 이하: 목록 max 333px */
  const isSparseResults =
    effectiveHasQueried && showSuggestList && !loading && totalCount > 0 && totalCount <= 3
  const modalClassName = [
    'address-search-modal',
    isResultsTall ? 'address-search-modal--results-tall' : 'address-search-modal--compact',
    effectiveHasQueried && showSuggestList ? 'address-search-modal--show-results' : '',
    isSparseResults ? 'address-search-modal--sparse-results' : '',
  ]
    .filter(Boolean)
    .join(' ')

  /** 3건 이하: 즉시 · 4건+: 목록 스크롤 끝 */
  const showPagination =
    effectiveHasQueried && showSuggestList && !loading && (isSparseResults || resultListAtEnd)

  useEffect(() => {
    if (!open || !effectiveHasQueried || !showSuggestList) {
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
    showSuggestList,
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
  }, [page, keyword, effectiveHasQueried])

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
          <Flex className="address-search__search-row" gap={10} align="center">
            <span className="address-search__search-input-wrap">
              <CmsInput
                value={keyword}
                onChange={event => {
                  const next = event.target.value
                  if (!next.trim()) {
                    setHasQueried(false)
                  }
                  setKeyword(next)
                }}
                onPressEnter={() => void runSearch(1)}
                placeholder={MODAL_SEARCH_PLACEHOLDER}
                inputSize="medium"
                width="100%"
              />
              {showSuggestList && !effectiveHasQueried ? (
                <ul
                  className="address-search__suggest-list"
                  role="listbox"
                  aria-label="주소 자동완성"
                >
                  {addresses.map(item => {
                    const line = suggestionPrimaryLine(item)
                    const key = `${item.roadAddr}-${item.zipNo}-${item.jibunAddr}-${line}`
                    return (
                      <li key={key} className="address-search__suggest-item">
                        <button
                          type="button"
                          className="address-search__suggest-btn"
                          role="option"
                          onClick={() => handleSelect(item)}
                        >
                          {highlightKeyword(line, keyword)}
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
              !trimmedKeyword && !showSuggestList && !showNoResultsMessage
                ? 'address-search__results--idle'
                : '',
              effectiveHasQueried && (showSuggestList || showNoResultsMessage)
                ? 'address-search__results--queried'
                : '',
              showNoResultsMessage ? 'address-search__results--no-results' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {showManyResultsNotice ? (
                  <div className="address-search__many-results-notice" role="status">
                    <p className="address-search__many-results-line1">
                      <strong className="address-search__many-results-em">
                        검색결과가 많습니다.
                      </strong>
                      검색어에 아래와 같은 조합을 이용하시면 더욱 정확한 결과가 검색됩니다.
                    </p>
                    <p className="address-search__many-results-line2">
                      {`'도로명+건물번호', '지역명+지번', '지역명+건물명(아파트명)', '사서함명+번호'`}
                    </p>
                  </div>
                ) : null}
                {showSuggestList && effectiveHasQueried ? (
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
                              if (
                                (event.target as HTMLElement).closest('.address-search__eng-link')
                              )
                                return
                              event.preventDefault()
                              handleSelect(item)
                            }}
                          >
                            <div className="address-search__result-card-head">
                              <span className="address-search__result-zip">
                                {item.zipNo || '-'}
                              </span>
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
                      {'검색 결과가 없습니다.\n검색어를 확인한 후 다시 시도해 주세요.'}
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
