/**
 * 매칭 관리 페이지
 * Phase 3.2: 프로그램별 매칭 현황, 필터링, 정렬, 페이지네이션
 */

import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatchingStore } from '../../store/matchingStore'
import { useProgramStore } from '../../store/programStore'
import { useInstructorStore } from '../../store/instructorStore'
import { useQueryParams } from '../../hooks/useQueryParams'
import { formatDate } from '../../utils/date'
import type { Matching } from '../../types/domain'
import {
  MdSelect,
  MdSelectOption,
  TableSkeleton,
  MdPagination,
} from '../../components/m3'
import { CustomButton, StatusChip } from '../../components/ui'
import '../../components/m3/MdSelect.css'
import './MatchingsList.css'

export default function MatchingsList() {
  const navigate = useNavigate()
  const {
    sortBy,
    sortOrder,
    matchings,
    pagination,
    isLoading,
    error,
    filters,
    fetchMatchings,
    setFilters,
    setSort,
    setPage,
  } = useMatchingStore()
  const programStore = useProgramStore()
  const instructorStore = useInstructorStore()
  const { programs, isLoading: isProgramsLoading } = programStore
  const { instructors, fetchInstructors: fetchInstructorsForFilter, isLoading: isInstructorsLoading } = instructorStore
  const { fetchPrograms: fetchProgramsForFilter } = programStore

  const { params, updateParams } = useQueryParams()

  // URL 쿼리 파라미터에서 초기값으로 스토어 동기화
  useEffect(() => {
    const urlPage = params.page || 1
    const urlProgramId = params.programId || undefined
    const urlInstructorId = params.instructorId || undefined
    const urlStatus = (params.status as Matching['status'] | undefined) || undefined
    const urlSortBy = (params.sortBy as 'matchedAt' | 'status' | 'createdAt') || 'matchedAt'
    const urlSortOrder = (params.sortOrder as 'asc' | 'desc') || 'desc'

    if (pagination.page !== urlPage) setPage(urlPage)
    if (filters.programId !== urlProgramId) setFilters({ programId: urlProgramId })
    if (filters.instructorId !== urlInstructorId) setFilters({ instructorId: urlInstructorId })
    if (filters.status !== urlStatus) setFilters({ status: urlStatus })
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
          sortBy: 'matchedAt',
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
        ...(filters.programId && { programId: filters.programId }),
        ...(filters.instructorId && { instructorId: filters.instructorId }),
        ...(filters.status && { status: filters.status }),
        sortBy: sortBy !== 'matchedAt' ? sortBy : undefined,
        sortOrder: sortOrder !== 'desc' ? sortOrder : undefined,
      } as Record<string, string | number | undefined>,
      true
    )
  }, [
    pagination.page,
    filters.programId,
    filters.instructorId,
    filters.status,
    sortBy,
    sortOrder,
    updateParams,
  ])

  // 프로그램 목록 로드
  useEffect(() => {
    if (programs.length === 0) {
      fetchProgramsForFilter({ page: 1, pageSize: 100 })
    }
  }, [programs.length, fetchProgramsForFilter])

  // 강사 목록 로드
  useEffect(() => {
    if (instructors.length === 0) {
      fetchInstructorsForFilter({ page: 1, pageSize: 100 })
    }
  }, [instructors.length, fetchInstructorsForFilter])

  // 매칭 목록 로드 (프로그램/강사 목록 로드 완료 후)
  useEffect(() => {
    // 필터 옵션(프로그램/강사 목록)이 로드되지 않았으면 대기
    if (isProgramsLoading || isInstructorsLoading) {
      return
    }
    
    fetchMatchings({
      page: pagination.page,
      pageSize: pagination.pageSize,
      programId: filters.programId,
      instructorId: filters.instructorId,
      status: filters.status,
      sortBy,
      sortOrder,
    })
  }, [
    pagination.page,
    pagination.pageSize,
    filters.programId,
    filters.instructorId,
    filters.status,
    sortBy,
    sortOrder,
    fetchMatchings,
    isProgramsLoading,
    isInstructorsLoading,
  ])

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof typeof filters, value: string | undefined) => {
    setFilters({ [key]: value || undefined })
    setPage(1)
  }

  // 정렬 변경 핸들러
  const handleSortChange = (newSortBy: 'matchedAt' | 'status' | 'createdAt') => {
    const newSortOrder = newSortBy === 'matchedAt' && filters.status === undefined ? 'desc' : 'asc'
    setSort(newSortBy, newSortOrder)
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setPage(page)
  }

  // 프로그램 이름 맵 (useMemo로 최적화)
  const programMap = useMemo(() => {
    const map = new Map<string, string>()
    programs.forEach(program => {
      map.set(program.id, program.title)
    })
    return map
  }, [programs])

  // 강사 이름 맵 (useMemo로 최적화)
  const instructorMap = useMemo(() => {
    const map = new Map<string, string>()
    instructors.forEach(instructor => {
      map.set(instructor.id, instructor.name)
    })
    return map
  }, [instructors])

  // 프로그램 이름 조회
  const getProgramName = (programId: string) => {
    return programMap.get(programId) || programId
  }

  // 강사 이름 조회
  const getInstructorName = (instructorId: string) => {
    // 강사 목록이 아직 로드 중이면 로딩 표시
    if (isInstructorsLoading || instructors.length === 0) {
      return '로딩 중...'
    }
    return instructorMap.get(instructorId) || '알 수 없음'
  }

  // 상태 한글 변환
  const getStatusLabel = (status: Matching['status']) => {
    switch (status) {
      case 'active':
        return '활성'
      case 'inactive':
        return '비활성'
      case 'pending':
        return '대기중'
      case 'completed':
        return '완료'
      case 'cancelled':
        return '취소'
      default:
        return status
    }
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="matchings-list-page">
      {/* 페이지 헤더 */}
      <div className="page-header">
        <h1>매칭 관리</h1>
        <CustomButton variant="primary" onClick={() => navigate('/matchings/new')}>
          매칭 등록
        </CustomButton>
      </div>

      {/* 필터 영역 */}
      <div className="filters">
        <div className="filter-group">
          <MdSelect
            label="프로그램"
            value={filters.programId || ''}
            onChange={value => handleFilterChange('programId', value || undefined)}
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            {programs.map(program => (
              <MdSelectOption key={program.id} value={program.id}>
                <div slot="headline">{program.title}</div>
              </MdSelectOption>
            ))}
          </MdSelect>
        </div>
        <div className="filter-group">
          <MdSelect
            label="강사"
            value={filters.instructorId || ''}
            onChange={value => handleFilterChange('instructorId', value || undefined)}
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            {instructors.map(instructor => (
              <MdSelectOption key={instructor.id} value={instructor.id}>
                <div slot="headline">{instructor.name}</div>
              </MdSelectOption>
            ))}
          </MdSelect>
        </div>
        <div className="filter-group">
          <MdSelect
            label="상태"
            value={filters.status || ''}
            onChange={value =>
              handleFilterChange('status', value as Matching['status'] | undefined)
            }
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            <MdSelectOption value="active">
              <div slot="headline">활성</div>
            </MdSelectOption>
            <MdSelectOption value="pending">
              <div slot="headline">대기중</div>
            </MdSelectOption>
            <MdSelectOption value="completed">
              <div slot="headline">완료</div>
            </MdSelectOption>
            <MdSelectOption value="cancelled">
              <div slot="headline">취소</div>
            </MdSelectOption>
            <MdSelectOption value="inactive">
              <div slot="headline">비활성</div>
            </MdSelectOption>
          </MdSelect>
        </div>
      </div>

      {/* 매칭 목록 테이블 */}
      {isLoading ? (
        <TableSkeleton columns={6} rows={8} />
      ) : matchings.length === 0 ? (
        <div className="empty-state">매칭 데이터가 없습니다.</div>
      ) : (
        <>
          <div className="table-container">
            <table className="matchings-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSortChange('matchedAt')}>
                    매칭일
                  </th>
                  <th>프로그램</th>
                  <th>강사</th>
                  <th className="sortable" onClick={() => handleSortChange('status')}>
                    상태
                  </th>
                  <th>취소 사유</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {matchings.map(matching => (
                  <tr key={matching.id}>
                    <td>{formatDate(matching.matchedAt)}</td>
                    <td>{getProgramName(matching.programId)}</td>
                    <td>{getInstructorName(matching.instructorId)}</td>
                    <td>
                      <StatusChip status={matching.status} label={getStatusLabel(matching.status)} />
                    </td>
                    <td className="cancellation-reason">{matching.cancellationReason || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <CustomButton
                          variant="tertiary"
                          onClick={() => navigate(`/matchings/${matching.id}`)}
                        >
                          상세보기
                        </CustomButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="pagination-wrapper">
              <MdPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                total={pagination.total}
                pageSize={pagination.pageSize}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
