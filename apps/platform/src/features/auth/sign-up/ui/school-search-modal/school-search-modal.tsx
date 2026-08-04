import { useCallback, useEffect, useMemo, useState } from 'react'
import { filterNeisSchoolsByRegion, type NeisSchoolItem } from '@jakorea/location/neis'
import { getSidoOptions, getSigunguOptions } from '@jakorea/location/sido-sigungu'
import {
  getPlatformNeisMissingKeyMessage,
  readNeisApiKeyFromEnv,
  useNeisSchoolSearch,
} from '@/shared/hooks'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { highlightKeyword } from '@/shared/lib/highlight-keyword'
import { PFButton, PFModal, PFPagination, PFSelect, PFText, PFTextInput } from '@/shared/ui'
import { searchHomepageSchools } from '../../api/client'
import styles from './school-search-modal.module.css'

const SCHOOL_SEARCH_PAGE_SIZE = 10

export type SelectedSchool = {
  name: string
  organizationId?: number
  /** NEIS 학교 코드 — CMS와 동일 출처 */
  neisCode?: string
}

type SchoolSearchModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (school: SelectedSchool) => void
}

function schoolResultKey(school: NeisSchoolItem) {
  return `${school.sdSchulCode}-${school.schulNm}-${school.orgRdnma}`
}

/**
 * 가입용 organizationId 보강.
 * 검색 UX는 CMS와 같이 NEIS를 쓰고, remote일 때만 홈페이지 기관 캐시에서 ID를 찾는다.
 */
async function resolveOrganizationId(input: {
  schoolName: string
  regionSido: string
  regionSigungu: string
}): Promise<number | undefined> {
  if (!isRemoteApiConfigured()) return undefined

  const attempts: Array<{
    keyword: string
    regionSido?: string
    regionSigungu?: string
  }> = [
    {
      keyword: input.schoolName,
      regionSido: input.regionSido || undefined,
      regionSigungu: input.regionSigungu || undefined,
    },
    {
      keyword: input.schoolName,
      regionSido: input.regionSido || undefined,
    },
    { keyword: input.schoolName },
  ]

  for (const params of attempts) {
    try {
      const response = await searchHomepageSchools({
        ...params,
        page: 0,
        size: 20,
      })
      const content = response.content ?? []
      if (content.length === 0) continue

      const exact = content.find(item => item.name?.trim() === input.schoolName)
      if (exact?.organizationId != null) return exact.organizationId

      const partial = content.find(item => item.name?.includes(input.schoolName))
      if (partial?.organizationId != null) return partial.organizationId

      if (content.length === 1 && content[0]?.organizationId != null) {
        return content[0].organizationId
      }
    } catch {
      // 다음 시도
    }
  }

  return undefined
}

export function SchoolSearchModal({ open, onClose, onSelect }: SchoolSearchModalProps) {
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isResolvingSelect, setIsResolvingSelect] = useState(false)
  const [selectError, setSelectError] = useState('')

  const { schools, loading, error, search, reset } = useNeisSchoolSearch({
    apiKey: readNeisApiKeyFromEnv(),
    missingKeyMessage: getPlatformNeisMissingKeyMessage(),
  })

  const sigunguOptions = getSigunguOptions(sido)
  const trimmedKeyword = keyword.trim()
  const filteredSchools = useMemo(
    () => filterNeisSchoolsByRegion(schools, sido, sigungu),
    [schools, sido, sigungu],
  )
  const filteredTotalCount = filteredSchools.length
  const totalPages = Math.max(1, Math.ceil(filteredTotalCount / SCHOOL_SEARCH_PAGE_SIZE))
  const pagedFilteredSchools = useMemo(
    () =>
      filteredSchools.slice(
        (currentPage - 1) * SCHOOL_SEARCH_PAGE_SIZE,
        currentPage * SCHOOL_SEARCH_PAGE_SIZE,
      ),
    [filteredSchools, currentPage],
  )
  const hasResults = filteredTotalCount > 0
  const canSearch = Boolean(sido && trimmedKeyword)
  const busy = loading || isResolvingSelect

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleClose = useCallback(() => {
    setSido('')
    setSigungu('')
    setKeyword('')
    setHasSearched(false)
    setCurrentPage(1)
    setIsResolvingSelect(false)
    setSelectError('')
    reset()
    onClose()
  }, [onClose, reset])

  const handleSidoChange = (value: string) => {
    setSido(value)
    setSigungu('')
    setHasSearched(false)
    setCurrentPage(1)
    setSelectError('')
    reset()
  }

  const handleSearch = () => {
    if (!canSearch || busy) {
      return
    }

    setHasSearched(true)
    setCurrentPage(1)
    setSelectError('')
    void search(trimmedKeyword, sido)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSigunguChange = (value: string) => {
    setSigungu(value)
    setCurrentPage(1)
  }

  const handleSelect = async (school: NeisSchoolItem) => {
    if (!school.schulNm || isResolvingSelect) return

    setIsResolvingSelect(true)
    setSelectError('')

    try {
      const organizationId = await resolveOrganizationId({
        schoolName: school.schulNm,
        regionSido: sido,
        regionSigungu: sigungu,
      })

      // 실 API 가입은 schoolOrganizationId가 필수 — 기관 캐시 매칭 실패 시 이름만 넘기지 않는다.
      if (isRemoteApiConfigured() && organizationId == null) {
        setSelectError(
          '선택한 학교를 시스템에 연결하지 못했어요. 다른 학교를 선택하거나, 학교 정보가 등록된 뒤 다시 시도해 주세요.',
        )
        return
      }

      onSelect({
        name: school.schulNm,
        organizationId,
        neisCode: school.sdSchulCode || undefined,
      })
      handleClose()
    } catch {
      setSelectError('학교 선택에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsResolvingSelect(false)
    }
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
            onValueChange={handleSigunguChange}
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
              setSelectError('')
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
            disabled={!canSearch || busy}
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
            {selectError ? (
              <div className={styles.schoolResultNotice}>
                <PFText typo="bd-md-sb" color="error">
                  {selectError}
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
                  {pagedFilteredSchools.map((school: NeisSchoolItem) => (
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
                          disabled={isResolvingSelect}
                          onClick={() => {
                            void handleSelect(school)
                          }}
                        >
                          선택
                        </PFButton>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className={styles.schoolPagination}>
                  <PFPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    variant="compact"
                    size="small"
                    onPageChange={handlePageChange}
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
