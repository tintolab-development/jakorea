/**
 * 강사 목록 페이지
 * Phase 1.2: 테이블, 필터, 정렬, 페이지네이션
 * URL 쿼리 파라미터와 동기화 (개선된 버전)
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
import { useInstructorStore } from '../../store/instructorStore'
import type { Instructor } from '../../types/domain'
import {
  MdTextField,
  MdSelect,
  MdSelectOption,
  MdPagination,
  TableSkeleton,
} from '../../components/m3'
import { CustomButton } from '../../components/ui'
import { useQueryParams } from '../../hooks/useQueryParams'
import './InstructorsList.css'

const columnHelper = createColumnHelper<Instructor>()

export default function InstructorsList() {
  const navigate = useNavigate()
  const { params, updateParams } = useQueryParams()
  const {
    instructors,
    pagination,
    filters,
    sortBy,
    sortOrder,
    regions,
    specialties,
    isLoading,
    error,
    fetchInstructors,
    setFilters,
    setSort,
    setPage,
    setPageSize,
    fetchOptions,
  } = useInstructorStore()

  // URL 파라미터에서 초기값으로 스토어 동기화 (최초 로드 및 URL 변경 시)
  useEffect(() => {
    const urlPage = params.page || 1
    const urlPageSize = params.pageSize || 10
    const urlSearch = params.search || undefined
    const urlRegion = params.region || undefined
    const urlSpecialty = params.specialty || undefined
    const urlSortBy = (params.sortBy as 'name' | 'region' | 'rating' | 'createdAt') || 'createdAt'
    const urlSortOrder = params.sortOrder || 'desc'

    // 스토어와 다를 때만 업데이트
    if (pagination.page !== urlPage) setPage(urlPage)
    if (pagination.pageSize !== urlPageSize) setPageSize(urlPageSize)
    if (filters.search !== urlSearch) setFilters({ search: urlSearch })
    if (filters.region !== urlRegion) setFilters({ region: urlRegion })
    if (filters.specialty !== urlSpecialty) setFilters({ specialty: urlSpecialty })
    if (sortBy !== urlSortBy) setSort(urlSortBy, urlSortOrder)
    if (sortOrder !== urlSortOrder && sortBy === urlSortBy) setSort(sortBy, urlSortOrder)

    // 옵션 조회 (최초 1회)
    if (regions.length === 0) fetchOptions()
  }, [params]) // URL 파라미터 변경 시에만

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
        specialty: filters.specialty || undefined,
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
    filters.specialty,
    sortBy,
    sortOrder,
    updateParams,
  ])

  // 필터/정렬/페이지 변경 시 데이터 재조회
  useEffect(() => {
    fetchInstructors()
  }, [filters, sortBy, sortOrder, pagination.page, pagination.pageSize, fetchInstructors])

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: {
    search?: string
    region?: string
    specialty?: string
  }) => {
    setFilters(newFilters)
    setPage(1) // 필터 변경 시 첫 페이지로
  }

  // 정렬 변경 핸들러
  const handleSortChange = (columnId: string) => {
    if (sortBy === columnId) {
      setSort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(columnId as 'name' | 'region' | 'rating' | 'createdAt', 'asc')
    }
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setPage(page)
  }

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (pageSize: number) => {
    setPageSize(pageSize)
    setPage(1)
  }

  // 테이블 컬럼 정의
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: '이름',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('region', {
        header: '지역',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('specialty', {
        header: '전문분야',
        cell: info => info.getValue().join(', '),
      }),
      columnHelper.accessor('contactPhone', {
        header: '연락처',
        cell: info => info.getValue() ?? '-',
      }),
      columnHelper.accessor('contactEmail', {
        header: '이메일',
        cell: info => info.getValue() ?? '-',
      }),
      columnHelper.accessor('rating', {
        header: '평가',
        cell: info => (info.getValue() ? `${info.getValue()?.toFixed(1)} / 5.0` : '-'),
      }),
      columnHelper.display({
        id: 'actions',
        header: '작업',
        cell: info => (
          <div className="table-actions">
            <CustomButton
              variant="secondary"
              onClick={() => navigate(`/instructors/${info.row.original.id}`)}
            >
              상세
            </CustomButton>
          </div>
        ),
      }),
    ],
    [navigate]
  )

  // 정렬 상태
  const sorting: SortingState = useMemo(
    () => [
      {
        id: sortBy,
        desc: sortOrder === 'desc',
      },
    ],
    [sortBy, sortOrder]
  )

  // 테이블 인스턴스
  const table = useReactTable({
    data: instructors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    manualSorting: true,
    onSortingChange: updater => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      if (newSorting.length > 0) {
        const sort = newSorting[0]
        handleSortChange(sort.id)
      }
    },
  })

  return (
    <div className="instructors-list-page">
      <div className="page-header">
        <h1>강사 관리</h1>
        <CustomButton variant="primary" onClick={() => navigate('/instructors/new')}>
          강사 등록
        </CustomButton>
      </div>

      {/* 필터 */}
      <div className="filters">
        <div className="filter-group">
          <MdTextField
            label="검색"
            placeholder="이름, 연락처, 이메일 검색"
            value={filters.search ?? ''}
            onChange={value => handleFilterChange({ search: value || undefined })}
          />
        </div>
        <div className="filter-group">
          <MdSelect
            label="지역"
            value={filters.region ?? ''}
            onChange={value => handleFilterChange({ region: value || undefined })}
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
        <div className="filter-group">
          <MdSelect
            label="전문분야"
            value={filters.specialty ?? ''}
            onChange={value => handleFilterChange({ specialty: value || undefined })}
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            {specialties.map(specialty => (
              <MdSelectOption key={specialty} value={specialty}>
                <div slot="headline">{specialty}</div>
              </MdSelectOption>
            ))}
          </MdSelect>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && <div className="error-message">{error}</div>}

      {/* 테이블 */}
      <div className="table-container">
        {isLoading ? (
          <TableSkeleton columns={7} rows={8} />
        ) : (
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      onClick={() => {
                        if (header.column.getCanSort()) {
                          handleSortChange(header.id)
                        }
                      }}
                      className={header.column.getCanSort() ? 'sortable' : ''}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortBy === header.id && (
                        <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: 0, height: 'auto' }}>
                    <div className="empty-state">데이터가 없습니다.</div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
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
      <div className="pagination-wrapper">
        <MdPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}
