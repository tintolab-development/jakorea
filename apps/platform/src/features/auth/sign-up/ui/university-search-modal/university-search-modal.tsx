import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAREER_NET_UNIV_SCH1,
  type CareerNetUniversityItem,
} from '@jakorea/location/career-net'
import { getSidoOptions, getSigunguOptions } from '@jakorea/location/sido-sigungu'
import {
  filterCareerNetUniversitiesBySigungu,
  getPlatformCareerNetMissingKeyMessage,
  readCareerNetApiKeyFromEnv,
  useCareerNetUniversitySearch,
} from '@/shared/hooks'
import { highlightKeyword } from '@/shared/lib/highlight-keyword'
import { PFButton, PFModal, PFPagination, PFSelect, PFText, PFTextInput } from '@/shared/ui'
import schoolStyles from '../school-search-modal/school-search-modal.module.css'

const UNIVERSITY_SEARCH_PAGE_SIZE = 10

const SCH1_OPTIONS = [
  { label: '전체', value: '' },
  { label: '대학(4년제)', value: CAREER_NET_UNIV_SCH1.university4 },
  { label: '전문대학', value: CAREER_NET_UNIV_SCH1.college },
]

export type SelectedUniversity = {
  name: string
  schoolName: string
  campusName?: string
  address?: string
}

type UniversitySearchModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (university: SelectedUniversity) => void
  /** 모달 제목 */
  title?: string
  /** 기본 학교유형(전문대학/4년제). 모달에서 변경 가능 */
  defaultSch1?: string
  /** 트리거 입력값을 키워드 초깃값으로 */
  initialKeyword?: string
}

function universityResultKey(item: CareerNetUniversityItem) {
  return `${item.seq}-${item.schoolName}-${item.campusName}-${item.address}`
}

function toDisplayName(item: CareerNetUniversityItem): string {
  return item.campusName ? `${item.schoolName} (${item.campusName})` : item.schoolName
}

export function UniversitySearchModal({
  open,
  onClose,
  onSelect,
  title = '대학교 검색',
  defaultSch1 = '',
  initialKeyword = '',
}: UniversitySearchModalProps) {
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [sch1, setSch1] = useState(defaultSch1)
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const { universities, loading, error, search, reset } = useCareerNetUniversitySearch({
    apiKey: readCareerNetApiKeyFromEnv(),
    missingKeyMessage: getPlatformCareerNetMissingKeyMessage(),
  })

  const sigunguOptions = getSigunguOptions(sido)
  const trimmedKeyword = keyword.trim()
  const filteredUniversities = useMemo(
    () => filterCareerNetUniversitiesBySigungu(universities, sigungu),
    [universities, sigungu]
  )
  const filteredTotalCount = filteredUniversities.length
  const totalPages = Math.max(1, Math.ceil(filteredTotalCount / UNIVERSITY_SEARCH_PAGE_SIZE))
  const pagedUniversities = useMemo(
    () =>
      filteredUniversities.slice(
        (currentPage - 1) * UNIVERSITY_SEARCH_PAGE_SIZE,
        currentPage * UNIVERSITY_SEARCH_PAGE_SIZE
      ),
    [filteredUniversities, currentPage]
  )
  const hasResults = filteredTotalCount > 0
  const canSearch = Boolean(trimmedKeyword)

  useEffect(() => {
    if (!open) return
    setKeyword(initialKeyword.trim())
    setSido('')
    setSigungu('')
    setSch1(defaultSch1)
    setHasSearched(false)
    setCurrentPage(1)
    reset()
  }, [open, initialKeyword, defaultSch1, reset])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleClose = useCallback(() => {
    setSido('')
    setSigungu('')
    setSch1(defaultSch1)
    setKeyword('')
    setHasSearched(false)
    setCurrentPage(1)
    reset()
    onClose()
  }, [defaultSch1, onClose, reset])

  const handleSidoChange = (value: string) => {
    setSido(value)
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
    if (!item.schoolName) return
    onSelect({
      name: toDisplayName(item),
      schoolName: item.schoolName,
      campusName: item.campusName || undefined,
      address: item.address?.trim() || undefined,
    })
    handleClose()
  }

  return (
    <PFModal open={open} title={title} onClose={handleClose}>
      <div
        className={[
          schoolStyles.schoolModalMain,
          hasSearched ? schoolStyles.schoolModalMainActive : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={schoolStyles.schoolModalRegionRow}>
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
            onValueChange={value => {
              setSigungu(value)
              setCurrentPage(1)
            }}
          />
        </div>

        <div
          className={[
            schoolStyles.schoolModalSearchRow,
            hasSearched ? schoolStyles.schoolModalSearchRowActive : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ gridTemplateColumns: '140px 1fr 160px' }}
        >
          <PFSelect
            size="xlarge"
            placeholder="학교유형"
            aria-label="학교유형"
            value={sch1}
            options={SCH1_OPTIONS}
            onValueChange={value => {
              setSch1(value)
              setHasSearched(false)
              setCurrentPage(1)
              reset()
            }}
          />
          <PFTextInput
            size="xlarge"
            placeholder="학교명을 입력해 주세요"
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
          <PFText as="p" typo="bd-sm-md" className={schoolStyles.schoolModalGuide}>
            학교명을 입력해 검색하세요.
          </PFText>
        ) : (
          <div className={schoolStyles.schoolModalResults}>
            {loading && !hasResults ? (
              <PFText
                typo="bd-sm-rg"
                color="neutral-warm-500"
                className={schoolStyles.schoolResultStatus}
              >
                검색 중입니다.
              </PFText>
            ) : null}
            {error ? (
              <div className={schoolStyles.schoolResultNotice}>
                <PFText typo="bd-md-sb" color="error">
                  {error.message}
                </PFText>
              </div>
            ) : null}
            {!loading && !error && !hasResults ? (
              <div className={schoolStyles.schoolResultNotice}>
                <PFText as="p" typo="bd-md-sb" color="black">
                  검색 결과가 없습니다.
                </PFText>
                <PFText as="p" typo="label-md" color="black">
                  학교명을 다시 확인하거나 시/군/구·학교유형을 변경해 보세요.
                </PFText>
              </div>
            ) : null}
            {hasResults ? (
              <>
                <ul className={schoolStyles.schoolResultList} aria-label="대학교 검색 결과">
                  {pagedUniversities.map(item => (
                    <li key={universityResultKey(item)} className={schoolStyles.schoolResultItem}>
                      <div className={schoolStyles.schoolResultContent}>
                        <PFText
                          as="p"
                          typo="bd-md-bd"
                          color="black"
                          className={schoolStyles.schoolResultName}
                        >
                          {highlightKeyword(
                            toDisplayName(item),
                            keyword,
                            schoolStyles.schoolResultHit
                          )}
                        </PFText>
                        {item.address ? (
                          <div className={schoolStyles.schoolResultAddressRow}>
                            <span className={schoolStyles.schoolResultTag}>소재지</span>
                            <PFText
                              as="span"
                              typo="bd-sm-md"
                              color="black"
                              className={schoolStyles.schoolResultAddress}
                            >
                              {item.address}
                            </PFText>
                          </div>
                        ) : null}
                        {item.schoolGubun ? (
                          <div className={schoolStyles.schoolResultAddressRow}>
                            <span className={schoolStyles.schoolResultTag}>유형</span>
                            <PFText as="span" typo="bd-sm-md" color="black">
                              {item.schoolGubun}
                            </PFText>
                          </div>
                        ) : null}
                      </div>
                      <div className={schoolStyles.schoolResultSelectButton}>
                        <PFButton
                          size="medium"
                          variant="secondary"
                          width="72px"
                          onClick={() => handleSelect(item)}
                        >
                          선택
                        </PFButton>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className={schoolStyles.schoolPagination}>
                  <PFPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    variant="compact"
                    size="small"
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </PFModal>
  )
}
