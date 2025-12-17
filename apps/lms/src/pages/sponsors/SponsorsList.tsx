/**
 * 스폰서 목록 페이지
 * Phase 1.3: 카드 그리드 레이아웃 (테이블 대신 시각적 표현)
 * URL 쿼리 파라미터와 동기화
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSponsorStore } from '../../store/sponsorStore'
import { MdTextField, MdPagination, MdCard, MdChip, CardGridSkeleton } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import { useQueryParams } from '../../hooks/useQueryParams'
import './SponsorsList.css'

export default function SponsorsList() {
  const navigate = useNavigate()
  const { params, updateParams } = useQueryParams()
  const {
    sponsors,
    pagination,
    filters,
    sortBy,
    sortOrder,
    isLoading,
    error,
    fetchSponsors,
    setFilters,
    setSort,
    setPage,
    setPageSize,
  } = useSponsorStore()

  // URL 파라미터에서 초기값으로 스토어 동기화
  useEffect(() => {
    const urlPage = params.page || 1
    const urlPageSize = params.pageSize || 10
    const urlSearch = params.search || undefined
    const urlSortBy = (params.sortBy as 'name' | 'createdAt') || 'createdAt'
    const urlSortOrder = params.sortOrder || 'desc'

    if (pagination.page !== urlPage) setPage(urlPage)
    if (pagination.pageSize !== urlPageSize) setPageSize(urlPageSize)
    if (filters.search !== urlSearch) setFilters({ search: urlSearch })
    if (sortBy !== urlSortBy) setSort(urlSortBy, urlSortOrder)
    if (sortOrder !== urlSortOrder && sortBy === urlSortBy) setSort(sortBy, urlSortOrder)
  }, [params])

  // 초기 로드 시 기본 파라미터 설정 (URL에 파라미터가 없을 때)
  useEffect(() => {
    const hasAnyParams = Object.keys(params).length > 0
    if (!hasAnyParams) {
      updateParams(
        {
          page: 1,
          pageSize: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
        true
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 최초 1회만 실행

  // 스토어 상태 변경 시 URL 업데이트
  useEffect(() => {
    updateParams(
      {
        page: pagination.page > 1 ? pagination.page : undefined,
        pageSize: pagination.pageSize !== 10 ? pagination.pageSize : undefined,
        search: filters.search || undefined,
        sortBy: sortBy !== 'createdAt' ? sortBy : undefined,
        sortOrder: sortOrder !== 'desc' ? sortOrder : undefined,
      },
      true
    )
  }, [pagination.page, pagination.pageSize, filters.search, sortBy, sortOrder, updateParams])

  // 필터/정렬/페이지 변경 시 데이터 재조회
  useEffect(() => {
    fetchSponsors()
  }, [filters, sortBy, sortOrder, pagination.page, pagination.pageSize, fetchSponsors])

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: { search?: string }) => {
    setFilters(newFilters)
    setPage(1)
  }

  // 정렬 변경 핸들러
  const handleSortChange = (newSortBy: 'name' | 'createdAt') => {
    if (sortBy === newSortBy) {
      setSort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(newSortBy, 'asc')
    }
  }

  return (
    <div className="sponsors-list-page">
      <div className="page-header">
        <div>
          <h1>스폰서 관리</h1>
          <p className="page-subtitle">스폰서 정보를 확인하고 관리할 수 있습니다</p>
        </div>
        <CustomButton variant="primary" onClick={() => navigate('/sponsors/new')}>
          스폰서 등록
        </CustomButton>
      </div>

      {/* 필터 및 정렬 */}
      <div className="filters-section">
        <div className="filters">
          <div className="filter-group filter-group--search">
            <MdTextField
              label="검색"
              placeholder="스폰서명, 설명, 연락처 검색"
              value={filters.search ?? ''}
              onChange={value => handleFilterChange({ search: value || undefined })}
            />
          </div>
        </div>
        <div className="sort-controls">
          <span className="sort-label">정렬:</span>
          <CustomButton
            variant={sortBy === 'name' ? 'primary' : 'tertiary'}
            onClick={() => handleSortChange('name')}
          >
            이름 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </CustomButton>
          <CustomButton
            variant={sortBy === 'createdAt' ? 'primary' : 'tertiary'}
            onClick={() => handleSortChange('createdAt')}
          >
            등록일 {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
          </CustomButton>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && <div className="error-message">{error}</div>}

      {/* 카드 그리드 */}
      <div className="cards-container">
        {isLoading ? (
          <CardGridSkeleton cards={pagination.pageSize} />
        ) : sponsors.length === 0 ? (
          <div className="empty-state">
            <p>스폰서가 없습니다.</p>
            <CustomButton variant="primary" onClick={() => navigate('/sponsors/new')}>
              첫 스폰서 등록하기
            </CustomButton>
          </div>
        ) : (
          <div className="cards-grid">
            {sponsors.map(sponsor => (
              <div
                key={sponsor.id}
                className="sponsor-card-wrapper"
                onClick={() => navigate(`/sponsors/${sponsor.id}`)}
              >
                <MdCard variant="elevated" className="sponsor-card">
                  <div className="card-content">
                    <div className="card-header">
                      <h3 className="sponsor-name">{sponsor.name}</h3>
                      {sponsor.securityMemo && (
                        <MdChip label="보안 메모" selected={false} disabled />
                      )}
                    </div>
                    {sponsor.description && (
                      <p className="sponsor-description">{sponsor.description}</p>
                    )}
                    {sponsor.contactInfo && (
                      <div className="sponsor-contact">
                        <div className="contact-item">
                          <span className="contact-label">연락처</span>
                        </div>
                        <div className="contact-content">
                          {sponsor.contactInfo.split(/[/,]/).map((contact, index) => {
                            const trimmedContact = contact.trim()
                            const isEmail = trimmedContact.includes('@')
                            return (
                              <div key={index} className="contact-line">
                                {isEmail ? (
                                  <>
                                    <span className="contact-type">이메일:</span>
                                    <span className="contact-value">{trimmedContact}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="contact-type">전화:</span>
                                    <span className="contact-value">{trimmedContact}</span>
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div className="card-footer">
                      <span className="created-date">
                        등록일: {new Date(sponsor.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                      <CustomButton
                        variant="tertiary"
                        onClick={() => {
                          navigate(`/sponsors/${sponsor.id}`)
                        }}
                      >
                        상세보기 →
                      </CustomButton>
                    </div>
                  </div>
                </MdCard>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {sponsors.length > 0 && (
        <div className="pagination-wrapper">
          <MdPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  )
}
