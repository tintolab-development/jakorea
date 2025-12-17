/**
 * 학교 목록 페이지
 * Phase 1.4: 리스트 레이아웃 (Instructor: 테이블, Sponsor: 카드 그리드와 차별화)
 * 색감 variation 적용
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSchoolStore } from '../../store/schoolStore'
import {
  MdTextField,
  MdSelect,
  MdSelectOption,
  MdPagination,
  MdCard,
  MdChip,
  ListSkeleton,
} from '../../components/m3'
import { CustomButton } from '../../components/ui'
import { useQueryParams } from '../../hooks/useQueryParams'
import './SchoolsList.css'

export default function SchoolsList() {
  const navigate = useNavigate()
  const { params, updateParams } = useQueryParams()
  const {
    schools,
    pagination,
    filters,
    sortBy,
    sortOrder,
    isLoading,
    error,
    regions,
    fetchSchools,
    setFilters,
    setSort,
    setPage,
    setPageSize,
    fetchOptions,
  } = useSchoolStore()

  // 옵션 조회
  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  // URL 파라미터에서 초기값으로 스토어 동기화
  useEffect(() => {
    const urlPage = params.page || 1
    const urlPageSize = params.pageSize || 10
    const urlSearch = params.search || undefined
    const urlRegion = params.region || undefined
    const urlSortBy = (params.sortBy as 'name' | 'region' | 'createdAt') || 'createdAt'
    const urlSortOrder = params.sortOrder || 'desc'

    if (pagination.page !== urlPage) setPage(urlPage)
    if (pagination.pageSize !== urlPageSize) setPageSize(urlPageSize)
    if (filters.search !== urlSearch || filters.region !== urlRegion) {
      setFilters({ search: urlSearch, region: urlRegion })
    }
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
        region: filters.region || undefined,
        sortBy: sortBy !== 'createdAt' ? sortBy : undefined,
        sortOrder: sortOrder !== 'desc' ? sortOrder : undefined,
      },
      true
    )
  }, [
    pagination.page,
    pagination.pageSize,
    filters.search,
    filters.region,
    sortBy,
    sortOrder,
    updateParams,
  ])

  // 필터/정렬/페이지 변경 시 데이터 재조회
  useEffect(() => {
    fetchSchools()
  }, [filters, sortBy, sortOrder, pagination.page, pagination.pageSize, fetchSchools])

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: { search?: string; region?: string }) => {
    setFilters(newFilters)
    setPage(1)
  }

  // 정렬 변경 핸들러
  const handleSortChange = (newSortBy: 'name' | 'region' | 'createdAt') => {
    if (sortBy === newSortBy) {
      setSort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(newSortBy, 'asc')
    }
  }

  // 지역별 색상 매핑 (색감 variation)
  const getRegionColorClass = (region: string): string => {
    const regionIndex = regions.indexOf(region)
    const colorIndex = regionIndex % 6 // 6가지 색상 variation
    return `region-color-${colorIndex}`
  }

  return (
    <div className="schools-list-page">
      <div className="page-header">
        <div>
          <h1>학교 관리</h1>
          <p className="page-subtitle">학교 정보를 확인하고 관리할 수 있습니다</p>
        </div>
        <CustomButton variant="primary" onClick={() => navigate('/schools/new')}>
          학교 등록
        </CustomButton>
      </div>

      {/* 필터 및 정렬 */}
      <div className="filters-section">
        <div className="filters">
          <div className="filter-group filter-group--search">
            <MdTextField
              label="검색"
              placeholder="학교명, 담당자, 주소 검색"
              value={filters.search ?? ''}
              onChange={value => handleFilterChange({ ...filters, search: value || undefined })}
            />
          </div>
          <div className="filter-group">
            <MdSelect
              label="지역"
              value={filters.region || ''}
              onChange={value => handleFilterChange({ ...filters, region: value || undefined })}
            >
              <MdSelectOption value="">
                <div slot="headline">전체</div>
              </MdSelectOption>
              {regions.map(region => (
                <MdSelectOption key={region} value={region}>
                  <div slot="headline">{region}</div>
                </MdSelectOption>
              ))}
            </MdSelect>
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
            variant={sortBy === 'region' ? 'primary' : 'tertiary'}
            onClick={() => handleSortChange('region')}
          >
            지역 {sortBy === 'region' && (sortOrder === 'asc' ? '↑' : '↓')}
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

      {/* 학교 리스트 */}
      <div className="schools-container">
        {isLoading ? (
          <ListSkeleton items={pagination.pageSize} />
        ) : schools.length === 0 ? (
          <div className="empty-state">
            <p>학교가 없습니다.</p>
            <CustomButton variant="primary" onClick={() => navigate('/schools/new')}>
              첫 학교 등록하기
            </CustomButton>
          </div>
        ) : (
          <div className="schools-list">
            {schools.map(school => (
              <div
                key={school.id}
                className="school-card-wrapper"
                onClick={() => navigate(`/schools/${school.id}`)}
              >
                <MdCard
                  variant="outlined"
                  className={`school-card ${getRegionColorClass(school.region)}`}
                >
                  <div className="card-content">
                    <div className="card-header">
                      <div className="school-name-section">
                        <h3 className="school-name">{school.name}</h3>
                        <MdChip label={school.region} selected={false} disabled />
                      </div>
                    </div>
                    <div className="school-info">
                      <div className="info-row">
                        <span className="info-label">담당자</span>
                        <span className="info-value">{school.contactPerson}</span>
                        {school.contactPhone && (
                          <>
                            <span className="info-separator">|</span>
                            <span className="info-label">전화</span>
                            <span className="info-value">{school.contactPhone}</span>
                          </>
                        )}
                      </div>
                      {school.address && (
                        <div className="info-row">
                          <span className="info-label">주소</span>
                          <span className="info-value">{school.address}</span>
                        </div>
                      )}
                      {school.contactEmail && (
                        <div className="info-row">
                          <span className="info-label">이메일</span>
                          <span className="info-value">{school.contactEmail}</span>
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <span className="created-date">
                        등록일: {new Date(school.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                      <CustomButton
                        variant="tertiary"
                        onClick={() => {
                          navigate(`/schools/${school.id}`)
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
      {schools.length > 0 && (
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
