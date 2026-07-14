import { useCallback, useMemo, useState } from 'react'
import { filterNeisSchoolsByRegion, type NeisSchoolItem } from '@jakorea/location/neis'
import { getSidoOptions, getSigunguOptions } from '@jakorea/location/sido-sigungu'
import chevronRightGrayUrl from '@/shared/assets/icons/chevron-right-gray.svg'
import {
  getPlatformNeisMissingKeyMessage,
  readNeisApiKeyFromEnv,
  useNeisSchoolSearch,
} from '@/shared/hooks'
import { highlightKeyword } from '@/shared/lib/highlight-keyword'
import { PFButton, PFModal, PFPagination, PFText, PFTextInput } from '@/shared/ui'
import styles from './school-search-modal.module.css'

const SCHOOL_SEARCH_PAGE_SIZE = 10

type SchoolSearchModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (schoolName: string) => void
}

type RegionSelectProps = {
  placeholder: string
  value: string
  options: { label: string; value: string }[]
  disabled?: boolean
  onChange: (value: string) => void
}

function schoolResultKey(school: NeisSchoolItem) {
  return `${school.sdSchulCode}-${school.schulNm}-${school.orgRdnma}`
}

function RegionSelect({
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
}: RegionSelectProps) {
  return (
    <div
      className={[
        styles.schoolModalSelectWrap,
        disabled ? styles.schoolModalSelectWrapDisabled : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <select
        className={styles.schoolModalSelect}
        disabled={disabled}
        value={value}
        onChange={event => onChange(event.target.value)}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <img
        className={styles.schoolModalSelectArrow}
        src={chevronRightGrayUrl}
        alt=""
        aria-hidden="true"
      />
    </div>
  )
}

export function SchoolSearchModal({ open, onClose, onSelect }: SchoolSearchModalProps) {
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const { schools, totalCount, loading, error, search, reset } = useNeisSchoolSearch({
    apiKey: readNeisApiKeyFromEnv(),
    pageSize: SCHOOL_SEARCH_PAGE_SIZE,
    missingKeyMessage: getPlatformNeisMissingKeyMessage(),
  })

  const sigunguOptions = getSigunguOptions(sido)
  const trimmedKeyword = keyword.trim()
  const filteredSchools = useMemo(
    () => filterNeisSchoolsByRegion(schools, sido, sigungu),
    [schools, sido, sigungu]
  )
  const totalPages = Math.max(1, Math.ceil(totalCount / SCHOOL_SEARCH_PAGE_SIZE))
  const hasResults = filteredSchools.length > 0
  const canSearch = Boolean(sido && trimmedKeyword)

  const handleClose = useCallback(() => {
    setSido('')
    setSigungu('')
    setKeyword('')
    setHasSearched(false)
    setCurrentPage(1)
    reset()
    onClose()
  }, [onClose, reset])

  const handleSidoChange = (value: string) => {
    setSido(value)
    setSigungu('')
    setHasSearched(false)
    setCurrentPage(1)
    reset()
  }

  const handleSearch = () => {
    if (!canSearch || loading) {
      return
    }

    setHasSearched(true)
    setCurrentPage(1)
    void search(trimmedKeyword, 1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    void search(trimmedKeyword, page)
  }

  const handleSelect = (school: NeisSchoolItem) => {
    onSelect(school.schulNm)
    handleClose()
  }

  return (
    <PFModal open={open} title="소속/학교 검색" onClose={handleClose}>
      <div
        className={[
          styles.schoolModalMain,
          hasSearched ? styles.schoolModalMainActive : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.schoolModalRegionRow}>
          <RegionSelect
            placeholder="시/도"
            value={sido}
            options={getSidoOptions()}
            onChange={handleSidoChange}
          />
          <RegionSelect
            placeholder="시/군/구"
            value={sigungu}
            options={sigunguOptions}
            disabled={!sido}
            onChange={setSigungu}
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
            onValueChange={next => {
              setKeyword(next)
              setHasSearched(false)
              setCurrentPage(1)
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
            width="160px"
            disabled={!canSearch || loading}
            onClick={handleSearch}
          >
            검색
          </PFButton>
        </div>

        {!hasSearched ? (
          <PFText as="p" typo="bd-sm-md" className={styles.schoolModalGuide}>
            지역을 먼저 선택 후 소속 또는 학교를 입력해 주세요.
          </PFText>
        ) : (
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
            {error ? (
              <div className={styles.schoolResultNotice}>
                <PFText typo="bd-md-sb" color="error">
                  {error.message}
                </PFText>
              </div>
            ) : null}
            {!loading && !error && !hasResults ? (
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
                  {filteredSchools.map((school: NeisSchoolItem) => (
                    <li key={schoolResultKey(school)} className={styles.schoolResultItem}>
                      <div className={styles.schoolResultContent}>
                        <PFText
                          as="p"
                          typo="bd-md-bd"
                          color="black"
                          className={styles.schoolResultName}
                        >
                          {highlightKeyword(school.schulNm, keyword, styles.schoolResultHit)}
                        </PFText>
                        {school.orgRdnma ? (
                          <div className={styles.schoolResultAddressRow}>
                            <span className={styles.schoolResultTag}>소재지</span>
                            <PFText
                              as="span"
                              typo="bd-sm-md"
                              color="black"
                              className={styles.schoolResultAddress}
                            >
                              {school.orgRdnma}
                            </PFText>
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.schoolResultSelectButton}>
                        <PFButton
                          size="medium"
                          variant="secondary"
                          width="72px"
                          onClick={() => handleSelect(school)}
                        >
                          선택
                        </PFButton>
                      </div>
                    </li>
                  ))}
                </ul>
                {totalCount > SCHOOL_SEARCH_PAGE_SIZE ? (
                  <div className={styles.schoolPagination}>
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
        )}
      </div>
    </PFModal>
  )
}
