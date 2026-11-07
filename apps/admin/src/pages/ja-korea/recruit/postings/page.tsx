/**
 * 채용공고 관리 목록
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Dayjs } from 'dayjs'
import { Switch } from 'antd'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type {
  RecruitPosting,
  RecruitPostingListFilter,
  RecruitPostingStatus,
  RecruitPostingVisibility,
} from '@/entities/recruit-posting/model/types'
import {
  useCreateRecruitPosting,
  useRecruitPostingsList,
  useRemoveRecruitPostings,
  useSetRecruitPostingPublic,
  useUpdateRecruitPosting,
} from '@/features/recruit-posting/api/hooks'
import { getRecruitPostingService } from '@/features/recruit-posting/api/service'
import { recruitPostingQueryKeys } from '@/features/recruit-posting/api/query-keys'
import { RECRUIT_POSTINGS_CHANGED_EVENT } from '@/features/recruit-posting/api/store'
import {
  RecruitPostingFormModal,
  type RecruitPostingFormValues,
} from '@/features/recruit-posting/ui/posting-form-modal'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import {
  CMS_TABLE_NO_COL_CLASS,
  CMS_TABLE_USAGE_COL_CLASS,
  TABLE_COLUMN_WIDTHS,
} from '@/shared/constants/table'
import {
  formatDateDot,
  formatDateRangeDot,
  formatDateTimeDot,
  formatNumberDisplay,
} from '@/shared/lib/format-display'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { isTableSelectionClick } from '@/shared/lib/is-table-selection-click'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { useListFilterUrl } from '@/shared/lib/use-list-filter-url'
import type { TableSearchParamRule } from '@/shared/lib/use-table-search'
import {
  applyDateRangeToSearchParams,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type PendingDateRange,
  type UrlDateRangePendingSyncRef,
  ymdFromParam,
} from '@/shared/lib/url-date-range-pending-sync'
import {
  AdminFilterTextInput,
  AdminInfiniteTableFooter,
  CmsButton,
  CmsDateRangePicker,
  CmsSelect,
  ConfirmModal,
  NO_SELECTION_ALERT,
  showDeleteCompletedAlert,
  showRegisterCompletedAlert,
  showUpdateCompletedAlert,
  useCmsAlert,
  FilterTableLayout,
} from '@/shared/ui'

import './page.css'

type VisibilityPending = '' | RecruitPostingVisibility
type StatusPending = '' | RecruitPostingStatus

type PostingPendingFilters = {
  visibility: VisibilityPending
  status: StatusPending
  title: string
  authorName: string
  recruitRange: PendingDateRange
  publishedRange: PendingDateRange
}

const INITIAL_PENDING: PostingPendingFilters = {
  visibility: '',
  status: '',
  title: '',
  authorName: '',
  recruitRange: null,
  publishedRange: null,
}

const recruitSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
const publishedSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

const STATUS_OPTIONS: Array<{ value: RecruitPostingStatus; label: string }> = [
  { value: 'recruiting', label: '모집중' },
  { value: 'result', label: '결과발표' },
  { value: 'closed', label: '모집완료' },
]

function statusLabel(status: RecruitPostingStatus): string {
  return STATUS_OPTIONS.find(item => item.value === status)?.label ?? '-'
}

function parseVisibility(raw: string | null): VisibilityPending {
  if (raw === 'public' || raw === 'private') return raw
  return ''
}

function parseStatus(raw: string | null): StatusPending {
  if (raw === 'recruiting' || raw === 'result' || raw === 'closed') return raw
  return ''
}

function parseApplied(searchParams: URLSearchParams): RecruitPostingListFilter {
  const filter: RecruitPostingListFilter = {}
  const visibility = parseVisibility(searchParams.get('rp_visibility'))
  if (visibility) filter.visibility = visibility
  const status = parseStatus(searchParams.get('rp_status'))
  if (status) filter.status = status
  const title = (searchParams.get('rp_title') ?? '').trim()
  if (title) filter.title = title
  const authorName = (searchParams.get('rp_author') ?? '').trim()
  if (authorName) filter.authorName = authorName
  const recruitFrom = ymdFromParam(searchParams.get('rp_recruit_from'))
  const recruitTo = ymdFromParam(searchParams.get('rp_recruit_to'))
  if (recruitFrom) filter.recruitFrom = recruitFrom
  if (recruitTo) filter.recruitTo = recruitTo
  const publishedFrom = ymdFromParam(searchParams.get('rp_published_from'))
  const publishedTo = ymdFromParam(searchParams.get('rp_published_to'))
  if (publishedFrom) filter.publishedFrom = publishedFrom
  if (publishedTo) filter.publishedTo = publishedTo
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<PostingPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'visibility',
    paramKey: 'rp_visibility',
    condition: f => f.visibility === 'public' || f.visibility === 'private',
  },
  {
    kind: 'param',
    filterKey: 'status',
    paramKey: 'rp_status',
    condition: f => f.status === 'recruiting' || f.status === 'result' || f.status === 'closed',
  },
  {
    kind: 'param',
    filterKey: 'title',
    paramKey: 'rp_title',
    condition: f => f.title.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'authorName',
    paramKey: 'rp_author',
    condition: f => f.authorName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.recruitRange, 'rp_recruit_from', 'rp_recruit_to')
      applyDateRangeToSearchParams(
        nextParams,
        f.publishedRange,
        'rp_published_from',
        'rp_published_to'
      )
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

export function RecruitPostingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showAlert } = useCmsAlert()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const postingId = params.get('postingId')?.trim()
    if (!postingId || !/^\d+$/.test(postingId)) return
    params.delete('postingId')
    const search = params.toString()
    navigate(
      {
        pathname: `/ja-korea/recruit/postings/${postingId}`,
        search: search ? `?${search}` : '',
      },
      { replace: true }
    )
  }, [location.search, navigate])
  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    hasActiveFilters,
  } = useListFilterUrl<PostingPendingFilters, RecruitPostingListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      setPending(prev => {
        const recruitRange = resolvePendingDateRangeFromUrl({
          ref: recruitSyncRef,
          from: searchParams.get('rp_recruit_from'),
          to: searchParams.get('rp_recruit_to'),
          prev: prev.recruitRange,
        }) as PendingDateRange
        const publishedRange = resolvePendingDateRangeFromUrl({
          ref: publishedSyncRef,
          from: searchParams.get('rp_published_from'),
          to: searchParams.get('rp_published_to'),
          prev: prev.publishedRange,
        }) as PendingDateRange
        const next: PostingPendingFilters = {
          visibility: parseVisibility(searchParams.get('rp_visibility')),
          status: parseStatus(searchParams.get('rp_status')),
          title: searchParams.get('rp_title') ?? '',
          authorName: searchParams.get('rp_author') ?? '',
          recruitRange,
          publishedRange,
        }
        if (
          prev.visibility === next.visibility &&
          prev.status === next.status &&
          prev.title === next.title &&
          prev.authorName === next.authorName &&
          pendingDateRangeTupleEqual(prev.recruitRange, next.recruitRange) &&
          pendingDateRangeTupleEqual(prev.publishedRange, next.publishedRange)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useRecruitPostingsList(appliedFilter)
  const setPublicMutation = useSetRecruitPostingPublic()
  const createMutation = useCreateRecruitPosting()
  const updateMutation = useUpdateRecruitPosting()
  const removeMutation = useRemoveRecruitPostings()

  const { sentinelRef } = useGatedInfiniteScroll({
    hasNextPage: listQuery.hasNextPage,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    resetKey: JSON.stringify(appliedFilter),
  })

  useInvalidateOnWindowEvent(RECRUIT_POSTINGS_CHANGED_EVENT, recruitPostingQueryKeys.all)

  const rows = listQuery.rows
  const totalCount = listQuery.totalCount
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<RecruitPosting | null>(null)

  const rowNoMap = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((row, index) => {
      map.set(row.id, totalCount - index)
    })
    return map
  }, [rows, totalCount])

  const handleSearch = useCallback(() => {
    applySearch()
    setSelectedRowKeys([])
  }, [applySearch])

  const handleTogglePublic = useCallback(
    (id: string, isPublic: boolean, version: number) => {
      void setPublicMutation.mutateAsync({ id, isPublic, version }).catch(() => {
        showAlert({
          title: '공개 여부 변경 실패',
          content: '공개 여부를 변경하지 못했습니다. 다시 시도해 주세요.',
        })
        void listQuery.refetch()
      })
    },
    [listQuery, setPublicMutation, showAlert]
  )

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setBulkDeleteOpen(true)
  }, [selectedRowKeys.length, showAlert])

  const handleBulkDeleteConfirm = useCallback(async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setBulkDeleteOpen(false)
      showDeleteCompletedAlert()
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '채용공고 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
      void listQuery.refetch()
    }
  }, [listQuery, removeMutation, selectedRowKeys, showAlert])

  const openCreate = useCallback(() => {
    setFormMode('create')
    setEditing(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((row: RecruitPosting) => {
    setFormMode('edit')
    setEditing(row)
    setFormOpen(true)
    void getRecruitPostingService(row.id).then(detail => {
      if (detail) setEditing(detail)
    })
  }, [])

  const goDetail = useCallback(
    (row: RecruitPosting) => {
      navigate(`/ja-korea/recruit/postings/${row.id}${location.search}`)
    },
    [navigate, location.search]
  )

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditing(null)
  }, [])

  const handleFormSubmit = useCallback(
    async (values: RecruitPostingFormValues) => {
      try {
        if (formMode === 'edit' && editing) {
          await updateMutation.mutateAsync({ ...values, id: editing.id })
          showUpdateCompletedAlert()
        } else {
          await createMutation.mutateAsync(values)
          showRegisterCompletedAlert()
        }
        closeForm()
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : '요청을 처리하지 못했습니다. 다시 시도해 주세요.'
        showAlert({
          title: formMode === 'edit' ? '저장 실패' : '등록 실패',
          content: message,
        })
      }
    },
    [closeForm, createMutation, editing, formMode, showAlert, updateMutation]
  )

  const handleFormDelete = useCallback(async () => {
    if (!editing) return
    try {
      await removeMutation.mutateAsync([editing.id])
      closeForm()
      showDeleteCompletedAlert()
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '채용공고 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
      void listQuery.refetch()
    }
  }, [closeForm, editing, listQuery, removeMutation, showAlert])

  const formLoading = createMutation.isPending || updateMutation.isPending

  const columns: ColumnsType<RecruitPosting> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_, row) => rowNoMap.get(row.id) ?? '-',
      },
      {
        title: '공개 여부',
        dataIndex: 'isPublic',
        key: 'isPublic',
        width: TABLE_COLUMN_WIDTHS.usage,
        className: CMS_TABLE_USAGE_COL_CLASS,
        align: 'center',
        render: (value: boolean, row) => (
          <Switch
            checked={value}
            onClick={(_, e) => e.stopPropagation()}
            onChange={checked => {
              handleTogglePublic(row.id, checked, row.version)
            }}
          />
        ),
      },
      {
        title: '게시 유형',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        align: 'center',
        render: (value: RecruitPostingStatus) => (
          <span className={`recruit-postings-page__status recruit-postings-page__status--${value}`}>
            {statusLabel(value)}
          </span>
        ),
      },
      {
        title: '제목',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        align: 'center',
        render: (value: string) => value || '-',
      },
      {
        title: '작성자명',
        dataIndex: 'authorName',
        key: 'authorName',
        width: 120,
        align: 'center',
        render: (value: string) => value || '-',
      },
      {
        title: '모집 기간',
        key: 'recruitPeriod',
        width: 220,
        align: 'center',
        render: (_, row) => formatDateRangeDot(row.recruitStart, row.recruitEnd),
      },
      {
        title: '게시일',
        dataIndex: 'publishedAt',
        key: 'publishedAt',
        width: 140,
        align: 'center',
        render: (value: string) => formatDateDot(value),
      },
      {
        title: '작성일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 160,
        align: 'center',
        render: (value: string) => formatDateTimeDot(value),
      },
      {
        title: '관리',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_, row) => (
          <CmsButton
            variant="secondary"
            size="small"
            type="button"
            onClick={event => {
              event.stopPropagation()
              openEdit(row)
            }}
          >
            수정
          </CmsButton>
        ),
      },
    ],
    [handleTogglePublic, openEdit, rowNoMap]
  )

  return (
    <div className="recruit-postings-page">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        filter={
          <div className="admin-filter-area recruit-postings-page__filter">
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">공개 여부</p>
              <CmsSelect
                inputSize="medium"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                withAllOption
                value={pendingFilters.visibility}
                placeholder="전체"
                options={[
                  { value: 'public', label: '공개' },
                  { value: 'private', label: '비공개' },
                ]}
                onChange={value =>
                  setPendingFilters(prev => ({
                    ...prev,
                    visibility: (value as VisibilityPending) || '',
                  }))
                }
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">게시 유형</p>
              <CmsSelect
                inputSize="medium"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                withAllOption
                value={pendingFilters.status}
                placeholder="전체"
                options={STATUS_OPTIONS}
                onChange={value =>
                  setPendingFilters(prev => ({
                    ...prev,
                    status: (value as StatusPending) || '',
                  }))
                }
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">제목</p>
              <AdminFilterTextInput
                inputSize="medium"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                value={pendingFilters.title}
                placeholder="제목을 입력해 주세요"
                onChange={value => patchPendingFilters(prev => ({ ...prev, title: value }))}
                onPressEnter={handleSearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <p className="admin-filter-area__label">작성자명</p>
              <AdminFilterTextInput
                inputSize="medium"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                value={pendingFilters.authorName}
                placeholder="작성자명을 입력해 주세요"
                onChange={value => patchPendingFilters(prev => ({ ...prev, authorName: value }))}
                onPressEnter={handleSearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--date-range">
              <p className="admin-filter-area__label">모집 기간</p>
              <CmsDateRangePicker
                inputSize="medium"
                width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                value={rangeAsPicker(pendingFilters.recruitRange)}
                placeholder={['시작일', '종료일']}
                allowClear
                onChange={dates => {
                  if (!dates || (!dates[0] && !dates[1])) {
                    setPendingFilters(prev => ({ ...prev, recruitRange: null }))
                    return
                  }
                  setPendingFilters(prev => ({
                    ...prev,
                    recruitRange: [dates[0] ?? null, dates[1] ?? null],
                  }))
                }}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--date-range">
              <p className="admin-filter-area__label">게시일</p>
              <CmsDateRangePicker
                inputSize="medium"
                width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                value={rangeAsPicker(pendingFilters.publishedRange)}
                placeholder={['시작일', '종료일']}
                allowClear
                onChange={dates => {
                  if (!dates || (!dates[0] && !dates[1])) {
                    setPendingFilters(prev => ({ ...prev, publishedRange: null }))
                    return
                  }
                  setPendingFilters(prev => ({
                    ...prev,
                    publishedRange: [dates[0] ?? null, dates[1] ?? null],
                  }))
                }}
              />
            </div>
            <div className="admin-filter-area__actions">
              <CmsButton
                className="admin-filter-area__search-button"
                variant="primary"
                size="medium"
                type="button"
                onClick={handleSearch}
              >
                조회
              </CmsButton>
            </div>
          </div>
        }
        title="채용 공고 목록"
        description={`총 ${formatNumberDisplay(totalCount)}건`}
        actions={
          <>
            <CmsButton
              variant="delete"
              size="h40"
              type="button"
              loading={removeMutation.isPending}
              onClick={handleBulkDeleteClick}
            >
              선택 삭제
            </CmsButton>
            <CmsButton variant="primary" size="h40" type="button" onClick={openCreate}>
              공고 등록
            </CmsButton>
          </>
        }
      >
        <div className="recruit-postings-page__table-scroll">
          <CmsDataTable<RecruitPosting>
            className="cms-data-table recruit-postings-page__table"
            rowKey="id"
            loading={listQuery.isLoading}
            dataSource={rows}
            columns={columns}
            pagination={false}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            }}
            onRow={record => ({
              onClick: event => {
                if (isTableSelectionClick(event)) return
                goDetail(record)
              },
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: true }}
          />
          <AdminInfiniteTableFooter
            sentinelRef={sentinelRef}
            isFetchingNextPage={listQuery.isFetchingNextPage}
          />
        </div>
      </FilterTableLayout>

      <RecruitPostingFormModal
        open={formOpen}
        mode={formMode}
        initial={editing}
        confirmLoading={formLoading}
        deleteLoading={removeMutation.isPending}
        onCancel={closeForm}
        onSubmit={values => {
          void handleFormSubmit(values)
        }}
        onDelete={
          formMode === 'edit'
            ? () => {
                void handleFormDelete()
              }
            : undefined
        }
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        title="채용공고 삭제"
        content={`선택한 채용공고 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={removeMutation.isPending}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          void handleBulkDeleteConfirm()
        }}
      />
    </div>
  )
}
