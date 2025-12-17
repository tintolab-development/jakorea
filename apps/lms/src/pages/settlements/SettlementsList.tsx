/**
 * 정산 목록 페이지
 * Phase 4: 정산 목록 조회, 필터링, 정렬, 페이지네이션
 */

import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettlementStore } from '../../store/settlementStore'
import { useProgramStore } from '../../store/programStore'
import { useInstructorStore } from '../../store/instructorStore'
import { useQueryParams } from '../../hooks/useQueryParams'
import { formatDate } from '../../utils/date'
import type { Settlement } from '../../types/domain'
import {
  MdSelect,
  MdSelectOption,
  TableSkeleton,
  MdPagination,
} from '../../components/m3'
import { CustomButton, StatusChip } from '../../components/ui'
import '../../components/m3/MdSelect.css'
import './SettlementsList.css'

export default function SettlementsList() {
  const navigate = useNavigate()
  const {
    settlements,
    pagination,
    isLoading,
    error,
    filters,
    sortBy,
    sortOrder,
    fetchSettlements,
    setFilters,
    setSort,
    setPage,
  } = useSettlementStore()
  const programStore = useProgramStore()
  const instructorStore = useInstructorStore()
  const { programs, fetchPrograms: fetchProgramsForFilter, isLoading: isProgramsLoading } = programStore
  const { instructors, fetchInstructors: fetchInstructorsForFilter, isLoading: isInstructorsLoading } = instructorStore

  const { params, updateParams } = useQueryParams()

  // URL 쿼리 파라미터에서 초기값으로 스토어 동기화
  useEffect(() => {
    const urlPage = params.page || 1
    const urlProgramId = params.programId || undefined
    const urlInstructorId = params.instructorId || undefined
    const urlStatus = (params.status as Settlement['status'] | undefined) || undefined
    const urlSortBy = (params.sortBy as 'createdAt' | 'totalAmount' | 'status') || 'createdAt'
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
        ...(filters.programId && { programId: filters.programId }),
        ...(filters.instructorId && { instructorId: filters.instructorId }),
        ...(filters.status && { status: filters.status }),
        sortBy: sortBy !== 'createdAt' ? sortBy : undefined,
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

  // 정산 목록 로드 (프로그램/강사 목록 로드 완료 후)
  useEffect(() => {
    // 필터 옵션(프로그램/강사 목록)이 로드되지 않았으면 대기
    if (isProgramsLoading || isInstructorsLoading) {
      return
    }
    
    fetchSettlements({
      page: pagination.page,
      pageSize: pagination.pageSize,
      programId: filters.programId,
      instructorId: filters.instructorId,
      status: filters.status,
      period: filters.period,
      sortBy,
      sortOrder,
    })
  }, [
    pagination.page,
    pagination.pageSize,
    filters.programId,
    filters.instructorId,
    filters.status,
    filters.period,
    sortBy,
    sortOrder,
    fetchSettlements,
    isProgramsLoading,
    isInstructorsLoading,
  ])

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof typeof filters, value: string | undefined) => {
    setFilters({ [key]: value || undefined })
    setPage(1)
  }

  // 정렬 변경 핸들러
  const handleSortChange = (newSortBy: 'createdAt' | 'totalAmount' | 'status') => {
    const newSortOrder = newSortBy === 'createdAt' ? 'desc' : 'asc'
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
  const getProgramName = (programId: string): string => {
    return programMap.get(programId) || programId
  }

  // 강사 이름 조회
  const getInstructorName = (instructorId: string): string => {
    // 강사 목록이 아직 로드 중이면 로딩 표시
    if (isInstructorsLoading || instructors.length === 0) {
      return '로딩 중...'
    }
    return instructorMap.get(instructorId) || '알 수 없음'
  }

  // 상태 한글 변환
  const getStatusLabel = (status: Settlement['status']) => {
    switch (status) {
      case 'pending':
        return '대기중'
      case 'calculated':
        return '산출완료'
      case 'approved':
        return '승인됨'
      case 'paid':
        return '지급완료'
      case 'cancelled':
        return '취소'
      default:
        return status
    }
  }

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="settlements-list-page">
      {/* 페이지 헤더 */}
      <div className="page-header">
        <h1>정산 관리</h1>
        <CustomButton variant="primary" onClick={() => navigate('/settlements/submit')}>
          정산 제출
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
            onChange={value => handleFilterChange('status', value as Settlement['status'] | undefined)}
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            <MdSelectOption value="pending">
              <div slot="headline">대기중</div>
            </MdSelectOption>
            <MdSelectOption value="calculated">
              <div slot="headline">산출완료</div>
            </MdSelectOption>
            <MdSelectOption value="approved">
              <div slot="headline">승인됨</div>
            </MdSelectOption>
            <MdSelectOption value="paid">
              <div slot="headline">지급완료</div>
            </MdSelectOption>
            <MdSelectOption value="cancelled">
              <div slot="headline">취소</div>
            </MdSelectOption>
          </MdSelect>
        </div>
      </div>

      {/* 정산 목록 테이블 */}
      {isLoading ? (
        <TableSkeleton columns={6} rows={8} />
      ) : settlements.length === 0 ? (
        <div className="empty-state">정산 데이터가 없습니다.</div>
      ) : (
        <>
          <div className="table-container">
            <table className="settlements-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSortChange('createdAt')}>
                    생성일
                  </th>
                  <th>프로그램</th>
                  <th>강사</th>
                  <th>기간</th>
                  <th className="sortable" onClick={() => handleSortChange('totalAmount')}>
                    총액
                  </th>
                  <th className="sortable" onClick={() => handleSortChange('status')}>
                    상태
                  </th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map(settlement => (
                  <tr key={settlement.id}>
                    <td>{formatDate(settlement.createdAt)}</td>
                    <td>{getProgramName(settlement.programId)}</td>
                    <td>{getInstructorName(settlement.instructorId)}</td>
                    <td>{settlement.period}</td>
                    <td className="amount-cell">{formatAmount(settlement.totalAmount)}원</td>
                    <td>
                      <StatusChip status={settlement.status} label={getStatusLabel(settlement.status)} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <CustomButton
                          variant="tertiary"
                          onClick={() => navigate(`/settlements/${settlement.id}`)}
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
