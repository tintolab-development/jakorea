/**
 * 연차 / 회계감사 보고서 목록 패널
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import type {
  ReportKind,
  ReportListFilter,
  TransparencyReport,
} from '@/entities/reports-disclosure/model/types'
import {
  useCreateReport,
  useRemoveReports,
  useReportsList,
  useUpdateReport,
} from '@/features/reports-disclosure/api/hooks'
import {
  ReportFormModal,
  type ReportFormValues,
} from '@/features/reports-disclosure/ui/report-form-modal'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
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
  AdminInfiniteTableFooter,
  CmsButton,
  CmsDateRangePicker,
  AdminFilterTextInput,
  ConfirmModal,
  NO_SELECTION_ALERT,
  showDeleteCompletedAlert,
  showRegisterCompletedAlert,
  showUpdateCompletedAlert,
  useCmsAlert,
  FilterTableLayout,
} from '@/shared/ui'

import { downloadFile } from '@/shared/lib/file-download'
import { toRuleDownloadFileName } from '@/shared/lib/sanitize-download-file-name'
import './report-list.css'

type PendingFilters = {
  title: string
  attachmentName: string
  created: PendingDateRange
}

const INITIAL_PENDING: PendingFilters = {
  title: '',
  attachmentName: '',
  created: null,
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function periodAsPickerValue(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

type Props = {
  kind: ReportKind
}

export function ReportListPanel({ kind }: Props) {
  const { showAlert } = useCmsAlert()
  const prefix = kind === 'annual' ? 'rd_a' : 'rd_u'
  const listTitle = kind === 'annual' ? '연차보고서 목록' : '회계감사 보고서 목록'
  const thumbMod = kind === 'annual' ? 'rd-list__thumb-wrap--a4' : 'rd-list__thumb-wrap--wide'

  const createdSyncRef = useMemo<UrlDateRangePendingSyncRef>(
    () => ({ hadCompleteInUrl: false }),
    []
  )

  const parseApplied = useCallback(
    (searchParams: URLSearchParams): ReportListFilter => {
      const filter: ReportListFilter = {}
      const title = (searchParams.get(`${prefix}_title`) ?? '').trim()
      if (title) filter.title = title
      const attachmentName = (searchParams.get(`${prefix}_file`) ?? '').trim()
      if (attachmentName) filter.attachmentName = attachmentName
      const from = ymdFromParam(searchParams.get(`${prefix}_cfrom`))
      const to = ymdFromParam(searchParams.get(`${prefix}_cto`))
      if (from) filter.createdFrom = from
      if (to) filter.createdTo = to
      return filter
    },
    [prefix]
  )

  const searchSyncRules = useMemo<readonly TableSearchParamRule<PendingFilters>[]>(
    () => [
      {
        kind: 'param',
        filterKey: 'title',
        paramKey: `${prefix}_title`,
        condition: f => f.title.trim().length > 0,
        transform: v => String(v).trim(),
      },
      {
        kind: 'param',
        filterKey: 'attachmentName',
        paramKey: `${prefix}_file`,
        condition: f => f.attachmentName.trim().length > 0,
        transform: v => String(v).trim(),
      },
      {
        kind: 'apply',
        apply: (nextParams, f) => {
          applyDateRangeToSearchParams(nextParams, f.created, `${prefix}_cfrom`, `${prefix}_cto`)
        },
      },
    ],
    [prefix]
  )

  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    hasActiveFilters,
  } = useListFilterUrl<PendingFilters, ReportListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const title = searchParams.get(`${prefix}_title`) ?? ''
      const attachmentName = searchParams.get(`${prefix}_file`) ?? ''
      const from = searchParams.get(`${prefix}_cfrom`)
      const to = searchParams.get(`${prefix}_cto`)

      setPending(prev => {
        const created = resolvePendingDateRangeFromUrl({
          ref: createdSyncRef,
          from,
          to,
          prev: prev.created,
        }) as PendingDateRange

        const next: PendingFilters = { title, attachmentName, created }
        if (
          prev.title === next.title &&
          prev.attachmentName === next.attachmentName &&
          pendingDateRangeTupleEqual(prev.created, next.created)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useReportsList(kind, appliedFilter)
  const createMutation = useCreateReport(kind)
  const updateMutation = useUpdateReport(kind)
  const removeMutation = useRemoveReports(kind)

  const { sentinelRef } = useGatedInfiniteScroll({
    hasNextPage: listQuery.hasNextPage,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    resetKey: `${kind}:${JSON.stringify(appliedFilter)}`,
  })

  const rows = listQuery.rows
  const totalCount = listQuery.totalCount

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<TransparencyReport | null>(null)

  const handleBulkDeleteClick = () => {
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setBulkDeleteOpen(true)
  }

  const handleBulkDeleteConfirm = async () => {
    try {
      await removeMutation.mutateAsync(selectedRowKeys.map(String))
      setSelectedRowKeys([])
      setBulkDeleteOpen(false)
      showDeleteCompletedAlert()
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '보고서 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }

  const openCreate = () => {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (row: TransparencyReport) => {
    setModalMode('edit')
    setEditing(row)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleSubmit = async (values: ReportFormValues) => {
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(values)
        closeModal()
        showRegisterCompletedAlert()
      } else if (editing) {
        await updateMutation.mutateAsync({ ...values, id: editing.id })
        closeModal()
        showUpdateCompletedAlert()
      }
    } catch {
      showAlert({
        title: '저장 실패',
        content: '보고서 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }

  const handleDeleteOne = async () => {
    if (!editing) return
    try {
      await removeMutation.mutateAsync([editing.id])
      setSelectedRowKeys(keys => keys.filter(k => k !== editing.id))
      closeModal()
      showDeleteCompletedAlert()
    } catch {
      showAlert({
        title: '삭제 실패',
        content: '보고서 삭제에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }

  const columns = useMemo<ColumnsType<TransparencyReport>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        align: 'center',
        render: (_v, _r, index) => totalCount - index,
      },
      {
        title: '썸네일',
        key: 'thumb',
        width: kind === 'annual' ? 120 : 180,
        align: 'center',
        className: 'rd-list__thumb-col',
        render: (_v, record) => (
          <div
            className={
              kind === 'annual'
                ? 'rd-list__thumb-cell rd-list__thumb-cell--a4'
                : 'rd-list__thumb-cell rd-list__thumb-cell--wide'
            }
          >
            {/* 썸네일은 선택 항목 — 없으면 깨진 이미지 대신 표 빈 값 「-」 */}
            {record.thumbnailUrl ? (
              <div className={`rd-list__thumb-wrap ${thumbMod}`}>
                <img
                  className="rd-list__thumb"
                  src={record.thumbnailUrl}
                  alt={record.thumbnailFileName || '썸네일'}
                />
              </div>
            ) : (
              '-'
            )}
          </div>
        ),
      },
      {
        title: '제목',
        dataIndex: 'title',
        key: 'title',
        // 시안 표 폭 1538에서 연차 399 · 회계감사 369 — 제목·첨부파일명은 폭을 비워 남는 폭을 반씩 나눈다
        // (고정 폭이면 열 합 1538이 표 최소 폭이 돼 좁은 화면에서 가로 스크롤이 생긴다)
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '첨부파일명',
        key: 'attachment',
        ellipsis: true,
        render: (_v, record) =>
          record.attachmentFileName ? (
            <a
              className="rd-list__file-link"
              href={record.attachmentUrl || '#'}
              download={toRuleDownloadFileName(record.attachmentFileName)}
              onClick={e => {
                e.preventDefault()
                if (
                  !record.attachmentUrl ||
                  record.attachmentUrl === 'data:application/pdf;base64,'
                ) {
                  showAlert({
                    title: '미리보기',
                    content: '샘플 첨부파일입니다. 등록·수정 시 PDF를 업로드하면 다운로드됩니다.',
                  })
                  return
                }
                // 다른 출처 URL은 download 속성이 무시되므로 받아서 규칙 이름으로 저장한다(공지 첨부와 동일).
                void downloadFile(record.attachmentFileName!, record.attachmentUrl).catch(() => {
                  showAlert({
                    title: '다운로드 실패',
                    content: '첨부파일 다운로드에 실패했습니다. 다시 시도해 주세요.',
                  })
                })
              }}
            >
              {record.attachmentFileName}
            </a>
          ) : (
            '-'
          ),
      },
      {
        title: '다운로드 수',
        dataIndex: 'downloadCount',
        key: 'downloadCount',
        width: 140,
        align: 'center',
        render: (value: number) => (typeof value === 'number' ? value.toLocaleString() : '-'),
      },
      {
        title: '작성일시',
        key: 'createdAt',
        width: 200,
        align: 'center',
        render: (_v, record) => formatCreatedAt(record.createdAt),
      },
      {
        title: '관리',
        key: 'actions',
        width: 140,
        align: 'center',
        render: (_v, record) => (
          <CmsButton variant="secondary" size="small" type="button" onClick={() => openEdit(record)}>
            수정
          </CmsButton>
        ),
      },
    ],
    [kind, thumbMod, totalCount, showAlert]
  )

  return (
    <div className="rd-list">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        filter={
          <div className="admin-filter-area">
            <div className="admin-filter-area__fields">
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">제목</p>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  value={pendingFilters.title}
                  onChange={value => patchPendingFilters(prev => ({ ...prev, title: value }))}
                  onPressEnter={() => applySearch()}
                  placeholder="제목을 입력해 주세요"
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <p className="admin-filter-area__label">첨부파일명</p>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  value={pendingFilters.attachmentName}
                  onChange={value =>
                    patchPendingFilters(prev => ({ ...prev, attachmentName: value }))
                  }
                  onPressEnter={() => applySearch()}
                  placeholder="첨부파일명을 입력해 주세요"
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--date-range">
                <p className="admin-filter-area__label">작성일</p>
                <CmsDateRangePicker
                  inputSize="medium"
                  width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                  value={periodAsPickerValue(pendingFilters.created)}
                  onChange={dates => {
                    setPendingFilters(prev => ({
                      ...prev,
                      created: dates ? [dates[0] ?? null, dates[1] ?? null] : null,
                    }))
                  }}
                  placeholder={['시작일', '종료일']}
                  allowClear
                />
              </div>
            </div>
            <div className="admin-filter-area__actions">
              <CmsButton
                className="admin-filter-area__search-button"
                variant="primary"
                size="medium"
                type="button"
                onClick={() => applySearch()}
              >
                조회
              </CmsButton>
            </div>
          </div>
        }
        title={listTitle}
        description={`총 ${totalCount.toLocaleString()}건`}
        actions={
          <>
            <CmsButton variant="delete" size="h40" type="button" onClick={handleBulkDeleteClick}>
              선택 삭제
            </CmsButton>
            <CmsButton variant="primary" size="h40" type="button" onClick={openCreate}>
              보고서 등록
            </CmsButton>
          </>
        }
      >
        <div className="rd-list__table-scroll">
          <CmsDataTable<TransparencyReport>
            className={`cms-data-table cms-data-table--hoverable rd-list__table rd-list__table--${kind}`}
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
          />
          <AdminInfiniteTableFooter
            sentinelRef={sentinelRef}
            isFetchingNextPage={listQuery.isFetchingNextPage}
          />
        </div>
      </FilterTableLayout>

      <ReportFormModal
        open={modalOpen}
        mode={modalMode}
        kind={kind}
        initial={editing}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        deleteLoading={removeMutation.isPending}
        onCancel={closeModal}
        onSubmit={values => {
          void handleSubmit(values)
        }}
        onDelete={modalMode === 'edit' ? () => void handleDeleteOne() : undefined}
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        title="보고서 삭제"
        content={`선택한 보고서 ${selectedRowKeys.length}건을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`}
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
