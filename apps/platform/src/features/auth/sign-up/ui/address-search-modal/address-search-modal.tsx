import { useCallback, useEffect, useMemo, useState } from 'react'
import { pickJusoRoadAddressLine } from '@jakorea/location/juso'
import {
  getPlatformJusoMissingKeyMessage,
  readJusoApiUrlFromEnv,
  readJusoConfmKeyFromEnv,
  useAddressSearch,
} from '@/shared/hooks'
import type { JusoAddressItem } from '@/shared/hooks'
import { highlightKeywordTokens } from '@/shared/lib/highlight-keyword'
import { PFButton, PFLoadingSpinner, PFModal, PFPagination, PFText, PFTextInput } from '@/shared/ui'
import { buildAddressSuggestions, isAddressSuggestKeywordEligible } from './address-suggestions'
import styles from './address-search-modal.module.css'

const LIVE_SEARCH_DEBOUNCE_MS = 280
const SUGGEST_COUNT_PER_PAGE = 10
const RESULT_COUNT_PER_PAGE = 10
/** `address`=도로명(roadAddr), 상세는 별도 `addressDetail` — BE geocoding: road + detail, 우편번호 제외 */
export type SelectedAddress = {
  address: string
  postalCode?: string
  regionSido?: string
  regionSigungu?: string
}

type AddressSearchModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (selection: SelectedAddress) => void
}

export function AddressSearchModal({ open, onClose, onSelect }: AddressSearchModalProps) {
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  // 한글 조합 중(compositionstart~compositionend)에는 자동완성을 호출하지 않는다
  const [isComposing, setIsComposing] = useState(false)
  const { addresses, totalCount, loading, error, search, reset } = useAddressSearch({
    confmKey: readJusoConfmKeyFromEnv(),
    countPerPage: RESULT_COUNT_PER_PAGE,
    apiUrl: readJusoApiUrlFromEnv(),
    missingKeyMessage: getPlatformJusoMissingKeyMessage(),
  })

  const trimmedKeyword = keyword.trim()
  const totalPages = Math.max(1, Math.ceil(totalCount / RESULT_COUNT_PER_PAGE))
  const hasAddressResults = addresses.length > 0
  const isSuggestKeywordEligible = isAddressSuggestKeywordEligible(keyword)
  const suggestions = useMemo(
    () => (hasSearched ? [] : buildAddressSuggestions(addresses, keyword)),
    [addresses, hasSearched, keyword],
  )
  // 자동완성 실패는 제안 목록을 비우는 것으로 처리한다(오류 원문을 화면에 쓰지 않는다)
  const showSuggestOverlay =
    !hasSearched && isSuggestKeywordEligible && !error && suggestions.length > 0
  const isEmptySearchResult = hasSearched && !loading && !error && !hasAddressResults

  const handleClose = useCallback(() => {
    setKeyword('')
    setHasSearched(false)
    setCurrentPage(1)
    reset()
    onClose()
  }, [onClose, reset])

  const handleSearch = () => {
    if (!trimmedKeyword) {
      setHasSearched(false)
      setCurrentPage(1)
      void search('', 1)
      return
    }

    setHasSearched(true)
    setCurrentPage(1)
    void search(trimmedKeyword, 1, RESULT_COUNT_PER_PAGE)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    void search(trimmedKeyword, page, RESULT_COUNT_PER_PAGE)
  }

  const handleSelect = (item: JusoAddressItem) => {
    onSelect({
      address: pickJusoRoadAddressLine(item.roadAddr, item.jibunAddr),
      postalCode: item.zipNo?.trim() || undefined,
      regionSido: item.siNm?.trim() || undefined,
      regionSigungu: item.sggNm?.trim() || undefined,
    })
    handleClose()
  }

  useEffect(() => {
    if (!open || hasSearched || isComposing) return

    const handle = window.setTimeout(() => {
      setCurrentPage(1)

      if (isSuggestKeywordEligible) {
        // 실패하면 훅이 제안 목록을 비운다 — 오류는 화면에 띄우지 않는다
        search(trimmedKeyword, 1, SUGGEST_COUNT_PER_PAGE).catch(() => undefined)
        return
      }

      void search('', 1)
    }, LIVE_SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(handle)
  }, [hasSearched, isComposing, isSuggestKeywordEligible, keyword, open, search, trimmedKeyword])

  return (
    <PFModal
      open={open}
      title="주소 검색"
      onClose={handleClose}
      mobilePlacement="full"
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <div
        className={[
          styles.addressModalMain,
          hasSearched ? styles.addressModalMainActive : undefined,
          isEmptySearchResult ? styles.addressModalMainEmpty : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.addressModalSearchArea}>
          <div className={styles.addressModalSearchRow}>
            <PFTextInput
              size="xlarge"
              placeholder="예) 마곡중앙로 171, 분당 주공, 백현동"
              value={keyword}
              onValueChange={next => {
                setHasSearched(false)
                setKeyword(next)
                if (!next.trim()) {
                  reset()
                }
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  handleSearch()
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
            />
            <PFButton
              size="xlarge"
              className={styles.addressModalSearchButton}
              onClick={handleSearch}
            >
              검색
            </PFButton>
          </div>

          {showSuggestOverlay ? (
            <div className={styles.addressSuggestOverlay}>
              <ul className={styles.addressSuggestList} aria-label="주소 자동완성">
                {suggestions.map(({ line, item }) => (
                  <li key={line} className={styles.addressSuggestItem}>
                    <button
                      type="button"
                      className={styles.addressSuggestButton}
                      onClick={() => handleSelect(item)}
                    >
                      {highlightKeywordTokens(line, keyword, styles.addressSuggestHit)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className={styles.addressModalBody} aria-busy={loading || undefined}>
          {loading && hasSearched ? (
            <div className={styles.addressModalLoading}>
              <PFLoadingSpinner label="주소 검색 중" />
            </div>
          ) : null}
          {!hasSearched ? (
            <div className={styles.addressModalTip}>
              <PFText as="div" typo="bd-lg-sb" color="black">
                Tip
              </PFText>
              <PFText as="p" typo="bd-sm-md" color="black" className={styles.addressModalTipLead}>
                아래와 같은 조합으로 검색을 하시면 더욱 정확한 결과가 검색됩니다.
              </PFText>
              <div className={styles.addressModalTipList}>
                <div className={styles.addressModalTipItem}>
                  <PFText typo="bd-sm-md" color="black">
                    도로명 + 건물번호
                  </PFText>
                  <PFText typo="bd-sm-md" color="primary-500">
                    예) 마곡중앙로 171, 제주 첨단로 242
                  </PFText>
                </div>
                <div className={styles.addressModalTipItem}>
                  <PFText typo="bd-sm-md" color="black">
                    지역명(동/리) + 번지
                  </PFText>
                  <PFText typo="bd-sm-md" color="primary-500">
                    예) 백현동 532, 제주 영평동 2181
                  </PFText>
                </div>
                <div className={styles.addressModalTipItem}>
                  <PFText typo="bd-sm-md" color="black">
                    지역명(동/리) + 건물명(아파트명)
                  </PFText>
                  <PFText typo="bd-sm-md" color="primary-500">
                    예) 분당 주공, 연수동 주공3차
                  </PFText>
                </div>
                <div className={styles.addressModalTipItem}>
                  <PFText typo="bd-sm-md" color="black">
                    사서함명 + 번호
                  </PFText>
                  <PFText typo="bd-sm-md" color="primary-500">
                    예) 분당우체국사서함 1~100
                  </PFText>
                </div>
              </div>
            </div>
          ) : null}

          {hasSearched && !loading ? (
            <div className={styles.addressModalResults}>
              {error ? (
                <div className={styles.addressResultNotice}>
                  <PFText typo="bd-md-sb" color="error">
                    {error.message}
                  </PFText>
                </div>
              ) : null}
              {!error && totalPages > 1 ? (
                <div className={styles.addressResultNotice}>
                  <PFText as="p" typo="bd-md-sb" color="black">
                    검색 결과가 많아요
                  </PFText>
                  <PFText as="p" typo="label-md" color="black">
                    <PFText typo="label-md" color="primary-500">
                      지역명, 도로명, 건물명
                    </PFText>
                    을 함께 입력하면 더 정확하게 찾을 수 있어요.
                  </PFText>
                </div>
              ) : null}
              {isEmptySearchResult ? (
                <div className={styles.addressResultNotice}>
                  <PFText as="p" typo="bd-md-sb" color="black">
                    검색 결과가 없어요
                  </PFText>
                  <PFText as="p" typo="label-md" color="black">
                    <PFText typo="label-md" color="primary-500">
                      지역명, 도로명, 건물명
                    </PFText>
                    을 함께 입력하면 더 정확하게 찾을 수 있어요.
                  </PFText>
                </div>
              ) : null}
              {hasAddressResults ? (
                <>
                  <div className={styles.addressResultList}>
                    {addresses.map((item: JusoAddressItem) => (
                      <button
                        className={styles.addressResultButton}
                        type="button"
                        key={`${item.zipNo}-${item.roadAddr}-${item.jibunAddr}`}
                        onClick={() => handleSelect(item)}
                      >
                        <PFText
                          as="span"
                          typo="bd-md-bd"
                          color="primary-500"
                          className={styles.addressResultZip}
                        >
                          {item.zipNo || '-'}
                        </PFText>
                        <span className={styles.addressResultLine}>
                          <span className={styles.addressResultTag}>도로명</span>
                          <PFText as="span" typo="bd-sm-md" color="black">
                            {item.roadAddr || '-'}
                          </PFText>
                        </span>
                        <span className={styles.addressResultLine}>
                          <span className={styles.addressResultTag}>지번</span>
                          <PFText as="span" typo="bd-sm-md" color="black">
                            {item.jibunAddr || '-'}
                          </PFText>
                        </span>
                      </button>
                    ))}
                  </div>
                  {totalCount > RESULT_COUNT_PER_PAGE ? (
                    <div className={styles.addressPagination}>
                      <PFPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        variant="compact"
                        size="small"
                        onPageChange={handlePageChange}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </PFModal>
  )
}
