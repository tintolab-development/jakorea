/**
 * 프로그램 목록 페이지
 * Phase 2.1: 테이블 레이아웃, 필터, 정렬, 페이지네이션
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
import { useProgramStore } from '../../store/programStore'
import { useSponsorStore } from '../../store/sponsorStore'
import type { Program } from '../../types/domain'
import {
  MdTextField,
  MdSelect,
  MdSelectOption,
  MdPagination,
  MdChip,
  TableSkeleton,
} from '../../components/m3'
import { CustomButton, StatusChip } from '../../components/ui'
import { useQueryParams } from '../../hooks/useQueryParams'
import { formatDate } from '../../utils/date'
// MdSelect CSS import (높이 통일)
import '../../components/m3/MdSelect.css'
import './ProgramsList.css'

const columnHelper = createColumnHelper<Program>()

export default function ProgramsList() {
  const navigate = useNavigate()
  const { params, updateParams } = useQueryParams()
  const {
    programs,
    pagination,
    filters,
    sortBy,
    sortOrder,
    isLoading,
    error,
    fetchPrograms,
    setFilters,
    setSort,
    setPage,
    setPageSize,
  } = useProgramStore()

  const sponsorStore = useSponsorStore()
  const sponsors = sponsorStore.sponsors
  const { fetchSponsors: fetchSponsorsForFilter } = sponsorStore

  // 스폰서 목록 로드 (필터 옵션용)
  useEffect(() => {
    if (sponsors.length === 0) {
      fetchSponsorsForFilter({ page: 1, pageSize: 100 }) // 모든 스폰서 가져오기
    }
  }, [sponsors.length, fetchSponsorsForFilter])

  // 스폰서 ID → 이름 매핑
  const sponsorMap = useMemo(() => {
    const map = new Map<string, string>()
    sponsors.forEach(sponsor => {
      map.set(sponsor.id, sponsor.name)
    })
    return map
  }, [sponsors])

  // URL 파라미터에서 초기값으로 스토어 동기화
  useEffect(() => {
    const urlPage = params.page || 1
    const urlPageSize = params.pageSize || 10
    const urlSearch = params.search || undefined
    const urlSponsorId = params.sponsorId || undefined
    const urlType = (params.type as 'online' | 'offline' | 'hybrid' | undefined) || undefined
    const urlFormat =
      (params.format as 'workshop' | 'seminar' | 'course' | 'lecture' | 'other' | undefined) ||
      undefined
    const urlStatus = (params.status as 'active' | 'inactive' | 'pending' | undefined) || undefined
    const urlSortBy =
      (params.sortBy as 'title' | 'status' | 'startDate' | 'createdAt') || 'createdAt'
    const urlSortOrder = params.sortOrder || 'desc'

    if (pagination.page !== urlPage) setPage(urlPage)
    if (pagination.pageSize !== urlPageSize) setPageSize(urlPageSize)
    if (filters.search !== urlSearch) setFilters({ search: urlSearch })
    if (filters.sponsorId !== urlSponsorId) setFilters({ sponsorId: urlSponsorId })
    if (filters.type !== urlType) setFilters({ type: urlType })
    if (filters.format !== urlFormat) setFilters({ format: urlFormat })
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
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
        true
      )
    }
  }, []) // 최초 1회만 실행

  // 스토어 상태 변경 시 URL 업데이트
  useEffect(() => {
    updateParams(
      {
        page: pagination.page > 1 ? pagination.page : undefined,
        pageSize: pagination.pageSize !== 10 ? pagination.pageSize : undefined,
        search: filters.search || undefined,
        ...(filters.sponsorId && { sponsorId: filters.sponsorId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.format && { format: filters.format }),
        ...(filters.status && { status: filters.status }),
        sortBy: sortBy !== 'createdAt' ? sortBy : undefined,
        sortOrder: sortOrder !== 'desc' ? sortOrder : undefined,
      } as Record<string, string | number | undefined>,
      true
    )
  }, [
    pagination.page,
    pagination.pageSize,
    filters.search,
    filters.sponsorId,
    filters.type,
    filters.format,
    filters.status,
    sortBy,
    sortOrder,
    updateParams,
  ])

  // 필터/정렬/페이지 변경 시 데이터 재조회
  useEffect(() => {
    fetchPrograms()
  }, [filters, sortBy, sortOrder, pagination.page, pagination.pageSize, fetchPrograms])

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: {
    search?: string
    sponsorId?: string
    type?: 'online' | 'offline' | 'hybrid'
    format?: 'workshop' | 'seminar' | 'course' | 'lecture' | 'other'
    status?: 'active' | 'inactive' | 'pending'
  }) => {
    setFilters(newFilters)
    setPage(1)
  }

  // 정렬 변경 핸들러
  const handleSortChange = (columnId: string) => {
    if (sortBy === columnId) {
      setSort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(columnId as 'title' | 'status' | 'startDate' | 'createdAt', 'asc')
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

  // 상태 한글 변환
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중'
      case 'pending':
        return '대기중'
      case 'inactive':
        return '비활성'
      default:
        return status
    }
  }

  // 유형 한글 변환
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'online':
        return '온라인'
      case 'offline':
        return '오프라인'
      case 'hybrid':
        return '혼합형'
      default:
        return type
    }
  }

  // 형태 한글 변환
  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'workshop':
        return '워크샵'
      case 'seminar':
        return '세미나'
      case 'course':
        return '코스'
      case 'lecture':
        return '강의'
      case 'other':
        return '기타'
      default:
        return format
    }
  }

  // 테이블 컬럼 정의
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: '제목',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('sponsorId', {
        header: '스폰서',
        cell: info => sponsorMap.get(info.getValue()) || '-',
      }),
      columnHelper.accessor('type', {
        header: '유형',
        cell: info => <MdChip label={getTypeLabel(info.getValue())} selected={false} disabled />,
      }),
      columnHelper.accessor('format', {
        header: '형태',
        cell: info => getFormatLabel(info.getValue()),
      }),
      columnHelper.accessor('status', {
        header: '상태',
        cell: info => <StatusChip status={info.getValue()} label={getStatusLabel(info.getValue())} />,
      }),
      columnHelper.accessor('startDate', {
        header: '시작일',
        cell: info => formatDate(new Date(info.getValue()), 'yyyy.MM.dd'),
      }),
      columnHelper.accessor('rounds', {
        header: '회차',
        cell: info => `${info.getValue().length}회`,
      }),
      columnHelper.display({
        id: 'actions',
        header: '작업',
        cell: info => (
          <div className="table-actions">
            <CustomButton
              variant="secondary"
              onClick={() => navigate(`/programs/${info.row.original.id}`)}
            >
              상세
            </CustomButton>
          </div>
        ),
      }),
    ],
    [navigate, sponsorMap]
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
    data: programs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    state: {
      sorting,
    },
  })

  return (
    <div className="programs-list-page">
      {/* 페이지 헤더 */}
      <div className="page-header">
        <h1>프로그램 관리</h1>
        <CustomButton variant="primary" onClick={() => navigate('/programs/new')}>
          프로그램 등록
        </CustomButton>
      </div>

      {/* 필터 영역 */}
      <div className="filters">
        <div className="filter-group">
          <MdTextField
            label="검색"
            placeholder="프로그램 제목, 설명 검색"
            value={filters.search || ''}
            onChange={value => handleFilterChange({ search: value || undefined })}
          />
        </div>
        <div className="filter-group">
          <MdSelect
            label="스폰서"
            value={filters.sponsorId || ''}
            onChange={value => handleFilterChange({ sponsorId: value || undefined })}
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            {sponsors.map(sponsor => (
              <MdSelectOption key={sponsor.id} value={sponsor.id}>
                <div slot="headline">{sponsor.name}</div>
              </MdSelectOption>
            ))}
          </MdSelect>
        </div>
        <div className="filter-group">
          <MdSelect
            label="유형"
            value={filters.type || ''}
            onChange={value =>
              handleFilterChange({
                type: (value || undefined) as 'online' | 'offline' | 'hybrid' | undefined,
              })
            }
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            <MdSelectOption value="online">
              <div slot="headline">온라인</div>
            </MdSelectOption>
            <MdSelectOption value="offline">
              <div slot="headline">오프라인</div>
            </MdSelectOption>
            <MdSelectOption value="hybrid">
              <div slot="headline">혼합형</div>
            </MdSelectOption>
          </MdSelect>
        </div>
        <div className="filter-group">
          <MdSelect
            label="형태"
            value={filters.format || ''}
            onChange={value =>
              handleFilterChange({
                format: (value || undefined) as
                  | 'workshop'
                  | 'seminar'
                  | 'course'
                  | 'lecture'
                  | 'other'
                  | undefined,
              })
            }
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            <MdSelectOption value="workshop">
              <div slot="headline">워크샵</div>
            </MdSelectOption>
            <MdSelectOption value="seminar">
              <div slot="headline">세미나</div>
            </MdSelectOption>
            <MdSelectOption value="course">
              <div slot="headline">코스</div>
            </MdSelectOption>
            <MdSelectOption value="lecture">
              <div slot="headline">강의</div>
            </MdSelectOption>
            <MdSelectOption value="other">
              <div slot="headline">기타</div>
            </MdSelectOption>
          </MdSelect>
        </div>
        <div className="filter-group">
          <MdSelect
            label="상태"
            value={filters.status || ''}
            onChange={value =>
              handleFilterChange({
                status: (value || undefined) as 'active' | 'inactive' | 'pending' | undefined,
              })
            }
          >
            <MdSelectOption value="">
              <div slot="headline">전체</div>
            </MdSelectOption>
            <MdSelectOption value="active">
              <div slot="headline">진행중</div>
            </MdSelectOption>
            <MdSelectOption value="pending">
              <div slot="headline">대기중</div>
            </MdSelectOption>
            <MdSelectOption value="inactive">
              <div slot="headline">비활성</div>
            </MdSelectOption>
          </MdSelect>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* 테이블 영역 */}
      <div className="table-container">
        {isLoading ? (
          <TableSkeleton />
        ) : programs.length === 0 ? (
          <div className="empty-state">
            <p>등록된 프로그램이 없습니다.</p>
            <CustomButton variant="primary" onClick={() => navigate('/programs/new')}>
              프로그램 등록하기
            </CustomButton>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      onClick={() => {
                        if (header.id !== 'actions') {
                          handleSortChange(header.id)
                        }
                      }}
                      className={header.id !== 'actions' ? 'sortable' : ''}
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
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {programs.length > 0 && (
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
      )}
    </div>
  )
}
