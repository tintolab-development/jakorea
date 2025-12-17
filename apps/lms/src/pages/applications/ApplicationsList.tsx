/**
 * 신청 목록 페이지
 * Phase 2.2: 테이블 레이아웃, 필터, 정렬, 페이지네이션
 * 디자인 가이드라인 준수, M3 컴포넌트 최대한 활용
 */

import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import { useApplicationStore } from '../../store/applicationStore'
import { useProgramStore } from '../../store/programStore'
import type { Application } from '../../types/domain'
import {
  MdTextField,
  MdSelect,
  MdSelectOption,
  MdPagination,
  TableSkeleton,
} from '../../components/m3'
import { CustomButton, StatusChip, SubjectTypeChip } from '../../components/ui'
import { useQueryParams } from '../../hooks/useQueryParams'
import { formatDate } from '../../utils/date'
import '../../components/m3/MdSelect.css'
import './ApplicationsList.css'

const columnHelper = createColumnHelper<Application>()

export default function ApplicationsList() {
  const navigate = useNavigate()
  const { params, updateParams } = useQueryParams()
  const {
    applications,
    pagination,
    filters,
    sortBy,
    sortOrder,
    isLoading,
    error,
    fetchApplications,
    setFilters,
    setSort,
    setPage,
    setPageSize,
  } = useApplicationStore()

  const programStore = useProgramStore()
  const programs = programStore.programs
  const { fetchPrograms: fetchProgramsForFilter } = programStore

  // 프로그램 목록 로드 (필터 옵션용)
  useEffect(() => {
    if (programs.length === 0) {
      fetchProgramsForFilter({ page: 1, pageSize: 100 }) // 모든 프로그램 가져오기
    }
  }, [programs.length, fetchProgramsForFilter])

  // 프로그램 ID → 제목 매핑
  const programMap = useMemo(() => {
    const map = new Map<string, string>()
    programs.forEach(program => {
      map.set(program.id, program.title)
    })
    return map
  }, [programs])

  // URL 파라미터에서 초기값으로 스토어 동기화
  useEffect(() => {
    const urlPage = params.page || 1
    const urlPageSize = params.pageSize || 10
    const urlSearch = params.search || undefined
    const urlProgramId = params.programId || undefined
    const urlSubjectType =
      (params.subjectType as 'school' | 'student' | 'instructor' | undefined) || undefined
    const urlStatus = (params.status as Application['status'] | undefined) || undefined
    const urlSortBy = (params.sortBy as 'submittedAt' | 'status' | 'createdAt') || 'submittedAt'
    const urlSortOrder = params.sortOrder || 'desc'

    if (pagination.page !== urlPage) setPage(urlPage)
    if (pagination.pageSize !== urlPageSize) setPageSize(urlPageSize)
    if (filters.search !== urlSearch) setFilters({ search: urlSearch })
    if (filters.programId !== urlProgramId) setFilters({ programId: urlProgramId })
    if (filters.subjectType !== urlSubjectType) setFilters({ subjectType: urlSubjectType })
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
          pageSize: 10,
          sortBy: 'submittedAt',
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
        ...(filters.programId && { programId: filters.programId }),
        ...(filters.subjectType && { subjectType: filters.subjectType }),
        ...(filters.status && { status: filters.status }),
        sortBy: sortBy !== 'submittedAt' ? sortBy : undefined,
        sortOrder: sortOrder !== 'desc' ? sortOrder : undefined,
      } as Record<string, string | number | undefined>,
      true
    )
  }, [
    pagination.page,
    pagination.pageSize,
    filters.search,
    filters.programId,
    filters.subjectType,
    filters.status,
    sortBy,
    sortOrder,
    updateParams,
  ])

  // 필터/정렬/페이지 변경 시 데이터 재조회
  useEffect(() => {
    fetchApplications()
  }, [filters, sortBy, sortOrder, pagination.page, pagination.pageSize, fetchApplications])

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: {
    search?: string
    programId?: string
    subjectType?: 'school' | 'student' | 'instructor'
    status?: Application['status']
  }) => {
    setFilters(newFilters)
    setPage(1)
  }

  // 정렬 변경 핸들러
  const handleSortChange = (columnId: string) => {
    if (sortBy === columnId) {
      setSort(
        sortBy as 'submittedAt' | 'status' | 'createdAt',
        sortOrder === 'asc' ? 'desc' : 'asc'
      )
    } else {
      setSort(columnId as 'submittedAt' | 'status' | 'createdAt', 'desc')
    }
  }

  // 상태 레이블 변환
  const getStatusLabel = (status: Application['status']) => {
    switch (status) {
      case 'submitted':
        return '접수'
      case 'reviewing':
        return '검토중'
      case 'approved':
        return '확정'
      case 'rejected':
        return '거절'
      case 'cancelled':
        return '취소'
      default:
        return status
    }
  }


  // 테이블 컬럼 정의
  const columns = useMemo(
    () => [
      columnHelper.accessor('programId', {
        header: () => (
          <th className="sortable" onClick={() => handleSortChange('programId')}>
            프로그램
          </th>
        ),
        cell: info => (
          <td>
            <div className="program-name">{programMap.get(info.getValue()) || '-'}</div>
          </td>
        ),
      }),
      columnHelper.accessor('subjectType', {
        header: '주체',
        cell: info => (
          <td>
            <SubjectTypeChip subjectType={info.getValue()} />
          </td>
        ),
      }),
      columnHelper.accessor('status', {
        header: () => (
          <th className="sortable" onClick={() => handleSortChange('status')}>
            상태
          </th>
        ),
        cell: info => (
          <td>
            <StatusChip status={info.getValue()} label={getStatusLabel(info.getValue())} />
          </td>
        ),
      }),
      columnHelper.accessor('submittedAt', {
        header: () => (
          <th className="sortable" onClick={() => handleSortChange('submittedAt')}>
            접수일
          </th>
        ),
        cell: info => <td>{formatDate(info.getValue())}</td>,
      }),
      columnHelper.accessor('reviewedAt', {
        header: '검토일',
        cell: info => <td>{info.getValue() ? formatDate(info.getValue()!) : '-'}</td>,
      }),
      columnHelper.display({
        id: 'actions',
        header: '작업',
        cell: info => (
          <td>
            <CustomButton
              variant="tertiary"
              onClick={() => navigate(`/applications/${info.row.original.id}`)}
            >
              상세보기
            </CustomButton>
          </td>
        ),
      }),
    ],
    [programMap, navigate]
  )

  const table = useReactTable({
    data: applications,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    state: {
      sorting: [
        {
          id: sortBy,
          desc: sortOrder === 'desc',
        },
      ] as SortingState,
    },
  })

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="applications-list-page">
      <div className="page-header">
        <h1>신청 관리</h1>
        <CustomButton variant="primary" onClick={() => navigate('/applications/new')}>
          신청 등록
        </CustomButton>
      </div>

      {/* 필터 영역 */}
      <div className="filters">
        <div className="filter-group">
          <MdTextField
            label="검색"
            placeholder="신청 ID, 메모 검색"
            value={filters.search || ''}
            onChange={value => handleFilterChange({ search: value || undefined })}
          />
        </div>
        <div className="filter-group">
          <MdSelect
            label="프로그램"
            value={filters.programId || ''}
            onChange={value => handleFilterChange({ programId: value || undefined })}
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
            label="주체 유형"
            value={filters.subjectType || ''}
            onChange={value =>
              handleFilterChange({
                subjectType: (value || undefined) as
                  | 'school'
                  | 'student'
                  | 'instructor'
                  | undefined,
              })
            }
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            <MdSelectOption value="school">
              <div slot="headline">학교</div>
            </MdSelectOption>
            <MdSelectOption value="student">
              <div slot="headline">학생</div>
            </MdSelectOption>
            <MdSelectOption value="instructor">
              <div slot="headline">강사</div>
            </MdSelectOption>
          </MdSelect>
        </div>
        <div className="filter-group">
          <MdSelect
            label="상태"
            value={filters.status || ''}
            onChange={value =>
              handleFilterChange({
                status: (value || undefined) as Application['status'] | undefined,
              })
            }
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            <MdSelectOption value="submitted">
              <div slot="headline">접수</div>
            </MdSelectOption>
            <MdSelectOption value="reviewing">
              <div slot="headline">검토중</div>
            </MdSelectOption>
            <MdSelectOption value="approved">
              <div slot="headline">확정</div>
            </MdSelectOption>
            <MdSelectOption value="rejected">
              <div slot="headline">거절</div>
            </MdSelectOption>
            <MdSelectOption value="cancelled">
              <div slot="headline">취소</div>
            </MdSelectOption>
          </MdSelect>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="table-container">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="empty-state">
                    신청 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} onClick={() => navigate(`/applications/${row.original.id}`)}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {!isLoading && pagination.totalPages > 0 && (
        <div className="pagination-wrapper">
          <MdPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
