import { useCallback, useEffect, useState } from 'react'
import {
  getPlatformJusoMissingKeyMessage,
  readJusoApiUrlFromEnv,
  readJusoConfmKeyFromEnv,
  useJusoAddressSearch,
} from '@/shared/hooks'
import type { JusoAddressItem } from '@/shared/hooks'
import { highlightKeyword } from '@/shared/lib/highlight-keyword'
import { PFButton, PFModal, PFPagination, PFText, PFTextInput } from '@/shared/ui'
import styles from './address-search-modal.module.css'

const LIVE_SEARCH_DEBOUNCE_MS = 280
const SUGGEST_COUNT_PER_PAGE = 10
const RESULT_COUNT_PER_PAGE = 10
const KEYWORD_TOO_SHORT_MESSAGE = '검색어는 두글자 이상 입력되어야 합니다.'

function isKeywordTooShortError(message: string) {
  return message.includes(KEYWORD_TOO_SHORT_MESSAGE) || message.includes('두글자')
}

type AddressSearchModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (address: string) => void
}

function suggestionPrimaryLine(item: JusoAddressItem) {
  const base = [item.siNm, item.sggNm, item.emdNm].filter(Boolean).join(' ').trim()
  const roadName = item.rn?.trim()

  if (base && roadName) return `${base} ${roadName}`
  if (base) return base
  return (item.roadAddr || item.jibunAddr).trim() || '-'
}

export function AddressSearchModal({ open, onClose, onSelect }: AddressSearchModalProps) {
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { addresses, totalCount, loading, error, search, reset } = useJusoAddressSearch({
    confmKey: readJusoConfmKeyFromEnv(),
    countPerPage: RESULT_COUNT_PER_PAGE,
    apiUrl: readJusoApiUrlFromEnv(),
    missingKeyMessage: getPlatformJusoMissingKeyMessage(),
  })

  const trimmedKeyword = keyword.trim()
  const totalPages = Math.max(1, Math.ceil(totalCount / RESULT_COUNT_PER_PAGE))
  const hasAddressResults = addresses.length > 0
  const suggestOverlayError =
    error && !isKeywordTooShortError(error.message) ? error.message : null
  const showSuggestOverlay =
    !hasSearched && trimmedKeyword.length > 0 && Boolean(suggestOverlayError || hasAddressResults)

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
    onSelect(item.roadAddr || item.jibunAddr)
    handleClose()
  }

  useEffect(() => {
    if (!open || hasSearched) return

    const handle = window.setTimeout(() => {
      setCurrentPage(1)

      if (trimmedKeyword.length > 0) {
        void search(trimmedKeyword, 1, SUGGEST_COUNT_PER_PAGE)
        return
      }

      void search('', 1)
    }, LIVE_SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(handle)
  }, [hasSearched, keyword, open, search, trimmedKeyword])

  return (
    <PFModal open={open} title="주소 검색" onClose={handleClose} mobilePlacement="bottom">
      <div
        className={[
          styles.addressModalMain,
          hasSearched ? styles.addressModalMainActive : undefined,
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
              {suggestOverlayError ? (
                <div className={styles.addressSuggestError}>
                  <PFText typo="bd-md-sb" color="error">
                    {suggestOverlayError}
                  </PFText>
                </div>
              ) : null}
              {hasAddressResults ? (
                <ul className={styles.addressSuggestList} aria-label="주소 자동완성">
                  {addresses.map((item: JusoAddressItem) => {
                    const line = suggestionPrimaryLine(item)
                    const key = `${item.roadAddr}-${item.zipNo}-${item.jibunAddr}-${line}`

                    return (
                      <li key={key} className={styles.addressSuggestItem}>
                        <button
                          type="button"
                          className={styles.addressSuggestButton}
                          onClick={() => handleSelect(item)}
                        >
                          {highlightKeyword(line, keyword, styles.addressSuggestHit)}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={styles.addressModalBody}>
          {!hasSearched ? (
            <div className={styles.addressModalTip}>
              <PFText as="div" typo="bd-lg-sb" color="black">
                Tip
              </PFText>
              <PFText
                as="p"
                typo="bd-sm-md"
                color="black"
                className={styles.addressModalTipLead}
              >
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

          {hasSearched ? (
            <div className={styles.addressModalResults}>
              {loading && !hasAddressResults ? (
                <PFText typo="bd-sm-rg" color="neutral-warm-500">
                  검색 중입니다.
                </PFText>
              ) : null}
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
              {!loading && !error && !hasAddressResults ? (
                <div className={styles.addressResultNotice}>
                  <PFText as="p" typo="bd-md-sb" color="black">
                    검색 결과가 없습니다.
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
