/**
 * 게시글 관리 - 문의내역 (관리자용)
 * 공지사항 관리(admin-notice-list-page)와 동일: FilterTableLayout + useTablePage + CmsButton
 */

import { useCallback, useEffect, useMemo, useState, type Key, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { useAdminInquiryCategories } from '@/features/posts/hooks/use-admin-inquiry-categories'
import { useInquiryListQuery } from '@/features/posts/hooks/use-inquiry-list-query'
import { useInquiryMutations } from '@/features/posts/hooks/use-inquiry-mutations'
import { buildAdminInquiryManagementFilterFields } from '@/features/posts/model/admin-inquiry-management-filter-fields'
import { adminInquiryManagementTablePageConfig } from '@/features/posts/model/admin-inquiry-management-table.config'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type {
  AdminInquiryRow,
  AdminInquiryTableContext,
} from '@/features/posts/model/admin-inquiry-management.types'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  ActionResultModal,
  showDeleteCompletedAlert,
  useCmsAlert,
  FilterTableToolbarButton,
} from '@/shared/ui'
import { AdminInquiryDetailModal } from '@/features/posts/ui/admin-inquiry-detail-modal'
import { selectedPostRowKeysToBulkIds } from '@/features/posts/lib/posts-bulk-delete-ids'
import { resolvePostsDeleteConfirmCopy } from '@/features/posts/lib/posts-delete-confirm-copy'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { CategoryManagementModal } from '@/features/posts/ui/category-management-modal'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'
import './admin-inquiry-page.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

/**
 * 시안: 답변현황 120 · 카테고리 140 · 프로그램명·제목 flex:1 · 회원명·담당자 120 · 일시 200
 * (td display:flex 금지 — 고정폭 + auto 분배 + center로 동일 시각)
 */
const INQUIRY_LIST_COL_WIDTH = {
  no: TABLE_COLUMN_WIDTHS.index,
  status: 120,
  category: 140,
  programName: 160,
  title: 160,
  memberName: 120,
  createdAt: 200,
  answeredAt: 200,
  assignee: 120,
} as const

const INQUIRY_LIST_TABLE_SCROLL_X =
  TABLE_COLUMN_WIDTHS.checkbox +
  INQUIRY_LIST_COL_WIDTH.no +
  INQUIRY_LIST_COL_WIDTH.status +
  INQUIRY_LIST_COL_WIDTH.category +
  INQUIRY_LIST_COL_WIDTH.programName +
  INQUIRY_LIST_COL_WIDTH.title +
  INQUIRY_LIST_COL_WIDTH.memberName +
  INQUIRY_LIST_COL_WIDTH.createdAt +
  INQUIRY_LIST_COL_WIDTH.answeredAt +
  INQUIRY_LIST_COL_WIDTH.assignee

export function AdminInquiryPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()

  const searchParamsKey = searchParams.toString()
  const {
    rows,
    totalElements,
    isLoading: contentLoading,
    isError: listIsError,
    error: listError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInquiryListQuery(searchParams, true)
  const { deleteMutation, bulkDeleteMutation } = useInquiryMutations()
  const contentError = listIsError
    ? getPostsApiErrorMessage(listError, '문의 목록을 불러오지 못했습니다.')
    : null

  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: searchParamsKey,
  })

  const {
    categoryRows,
    allowedCategoryLabels,
    allowedCategorySet,
    remoteActions: inquiryCategoryRemoteActions,
  } = useAdminInquiryCategories()
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  const tablePageContext: AdminInquiryTableContext = useMemo(
    () => ({
      allowedCategoryLabels,
    }),
    [allowedCategoryLabels]
  )

  const filterFields = useMemo(
    () => buildAdminInquiryManagementFilterFields(tablePageContext.allowedCategoryLabels),
    [tablePageContext.allowedCategoryLabels]
  )

  const {
    pendingFilters,
    setPendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    tableData,
    hasActiveFilters,
  } = useTablePage(adminInquiryManagementTablePageConfig, {
    data: rows,
    searchParams,
    setSearchParams,
    context: tablePageContext,
  })

  useEffect(() => {
    setPendingFilters(prev => {
      if (prev.category !== 'ALL' && !allowedCategorySet.has(String(prev.category))) {
        return { ...prev, category: 'ALL' }
      }
      return prev
    })
  }, [allowedCategorySet, setPendingFilters])

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailInquiryId, setDetailInquiryId] = useState<string | null>(null)
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false)
  const [singleDeleteInquiryId, setSingleDeleteInquiryId] = useState<string | null>(null)
  const [actionResultOpen, setActionResultOpen] = useState(false)
  const [actionResultTitle, setActionResultTitle] = useState('')
  const [actionResultMessage, setActionResultMessage] = useState('')

  const closeDetailModal = useCallback(() => {
    setDetailOpen(false)
    setDetailInquiryId(null)
  }, [])

  const openDetailModal = useCallback((id: string) => {
    setDetailInquiryId(id)
    setDetailOpen(true)
  }, [])

  const handleBulkDelete = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setBulkDeleteConfirmOpen(true)
  }, [canWrite, selectedRowKeys.length, showAlert])

  const handleConfirmBulkDelete = useCallback(async () => {
    const ids = selectedPostRowKeysToBulkIds(selectedRowKeys, tableData)
    if (ids.length === 0) {
      setBulkDeleteConfirmOpen(false)
      return
    }
    try {
      await bulkDeleteMutation.mutateAsync(ids)
      setSelectedRowKeys([])
      setBulkDeleteConfirmOpen(false)
      showDeleteCompletedAlert()
    } catch (error) {
      setActionResultTitle('문의 삭제 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [bulkDeleteMutation, selectedRowKeys, tableData])

  const handleDetailDeleteRequest = useCallback((id: string) => {
    setSingleDeleteInquiryId(id)
    setSingleDeleteConfirmOpen(true)
  }, [])

  const handleConfirmSingleDelete = useCallback(async () => {
    if (!singleDeleteInquiryId) {
      setSingleDeleteConfirmOpen(false)
      return
    }
    try {
      await deleteMutation.mutateAsync(singleDeleteInquiryId)
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== singleDeleteInquiryId))
      setSingleDeleteConfirmOpen(false)
      setSingleDeleteInquiryId(null)
      closeDetailModal()
      showDeleteCompletedAlert()
    } catch (error) {
      setActionResultTitle('문의 삭제 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [closeDetailModal, deleteMutation, singleDeleteInquiryId])

  const columns: ColumnsType<AdminInquiryRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: INQUIRY_LIST_COL_WIDTH.no,
        align: 'center',
        className: 'admin-inquiry-page__col-no',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-no' }),
        render: (_: unknown, __: AdminInquiryRow, index: number) =>
          totalElements === 0 ? '-' : totalElements - index,
      },
      {
        title: '답변 현황',
        key: 'status',
        width: INQUIRY_LIST_COL_WIDTH.status,
        align: 'center',
        className: 'admin-inquiry-page__col-status',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-status' }),
        render: (_: unknown, row: AdminInquiryRow) =>
          row.status === 'PENDING' ? (
            <span className="admin-inquiry-page__status admin-inquiry-page__status--pending">
              답변 대기
            </span>
          ) : (
            <span className="admin-inquiry-page__status admin-inquiry-page__status--answered">
              답변 완료
            </span>
          ),
      },
      {
        title: '카테고리',
        dataIndex: 'category',
        key: 'category',
        width: INQUIRY_LIST_COL_WIDTH.category,
        align: 'center',
        ellipsis: true,
        className: 'admin-inquiry-page__col-category',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-category' }),
        render: (v: string) => (v == null || v === '' ? '-' : v),
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        // 유연 열: 넓은 화면에서 남는 폭 흡수 (CmsDataTable 정확 폭 모드)
        minWidth: INQUIRY_LIST_COL_WIDTH.programName,
        align: 'center',
        ellipsis: true,
        className: 'admin-inquiry-page__col-flex',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-flex' }),
        onCell: () => ({ className: 'admin-inquiry-page__col-flex' }),
        render: (v: string | null) =>
          v == null || v === '' ? '-' : <span className="admin-inquiry-page__flex-text">{v}</span>,
      },
      {
        title: '제목',
        dataIndex: 'title',
        key: 'title',
        // 유연 열: 넓은 화면에서 남는 폭 흡수 (CmsDataTable 정확 폭 모드)
        minWidth: INQUIRY_LIST_COL_WIDTH.title,
        align: 'center',
        ellipsis: { showTitle: true },
        className: 'admin-inquiry-page__col-flex',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-flex' }),
        onCell: () => ({ className: 'admin-inquiry-page__col-flex' }),
        render: (text: string) =>
          text == null || text === '' ? (
            '-'
          ) : (
            <span className="admin-inquiry-page__flex-text">{text}</span>
          ),
      },
      {
        title: '문의 회원명',
        dataIndex: 'memberName',
        key: 'memberName',
        width: INQUIRY_LIST_COL_WIDTH.memberName,
        align: 'center',
        ellipsis: true,
        className: 'admin-inquiry-page__col-member',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-member' }),
        render: (v: string) => (v == null || v === '' ? '-' : v),
      },
      {
        title: '문의일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: INQUIRY_LIST_COL_WIDTH.createdAt,
        align: 'center',
        ellipsis: { showTitle: true },
        className: 'admin-inquiry-page__col-datetime',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-datetime' }),
        onCell: () => ({ className: 'admin-inquiry-page__col-datetime' }),
        render: (iso: string) => (
          <span className="admin-inquiry-page__datetime-text">
            {dayjs(iso).format('YYYY.MM.DD HH:mm:ss')}
          </span>
        ),
      },
      {
        title: '답변일시',
        dataIndex: 'answeredAt',
        key: 'answeredAt',
        width: INQUIRY_LIST_COL_WIDTH.answeredAt,
        align: 'center',
        ellipsis: { showTitle: true },
        className: 'admin-inquiry-page__col-datetime',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-datetime' }),
        onCell: () => ({ className: 'admin-inquiry-page__col-datetime' }),
        render: (iso: string | null) => (
          <span className="admin-inquiry-page__datetime-text">
            {iso == null || iso === '' ? '-' : dayjs(iso).format('YYYY.MM.DD HH:mm:ss')}
          </span>
        ),
      },
      {
        title: '담당자명',
        dataIndex: 'assignee',
        key: 'assignee',
        width: INQUIRY_LIST_COL_WIDTH.assignee,
        align: 'center',
        ellipsis: true,
        className: 'admin-inquiry-page__col-assignee',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-assignee' }),
        render: (v: string | null) => (v == null || v === '' ? '-' : v),
      },
    ],
    [totalElements]
  )

  const singleDeleteCopy = useMemo(() => resolvePostsDeleteConfirmCopy('inquiry', 'single'), [])
  const bulkDeleteCopy = useMemo(
    () => resolvePostsDeleteConfirmCopy('inquiry', 'bulk', selectedRowKeys.length),
    [selectedRowKeys.length]
  )

  return (
    <div className="admin-inquiry-page">
      <AdminInquiryDetailModal
        open={detailOpen}
        inquiryId={detailInquiryId}
        onCancel={closeDetailModal}
        onSuccess={() => {}}
        onDeleteClick={handleDetailDeleteRequest}
        canWrite={canWrite}
      />
      <NoticeDeleteConfirmModal
        open={singleDeleteConfirmOpen}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false)
          setSingleDeleteInquiryId(null)
        }}
        onConfirm={handleConfirmSingleDelete}
        preset="inquiry"
        zIndex={1200}
        {...singleDeleteCopy}
      />
      <NoticeDeleteConfirmModal
        open={bulkDeleteConfirmOpen}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        preset="inquiry"
        {...bulkDeleteCopy}
      />
      <CategoryManagementModal
        kind="inquiry"
        open={categoryModalOpen}
        onCancel={() => setCategoryModalOpen(false)}
        categories={categoryRows}
        onCategoriesChange={() => {}}
        posts={rows}
        remoteActions={inquiryCategoryRemoteActions}
      />
      <ActionResultModal
        open={actionResultOpen}
        title={actionResultTitle}
        body={actionResultMessage}
        onClose={() => setActionResultOpen(false)}
      />
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        bordered={false}
        fields={filterFields}
        filters={{
          status: pendingFilters.status,
          category: pendingFilters.category,
          programName: pendingFilters.programName,
          title: pendingFilters.title,
          memberName: pendingFilters.memberName,
          assigneeName: pendingFilters.assigneeName,
          dateRange: pendingFilters.dateRange,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="문의내역 목록"
        description={`총 ${totalElements.toLocaleString()}건`}
        contentLoading={contentLoading}
        actions={
          <>
            <FilterTableToolbarButton variant="delete" onClick={handleBulkDelete}>
              문의 삭제
            </FilterTableToolbarButton>
            <FilterTableToolbarButton variant="secondary" onClick={() => setCategoryModalOpen(true)}>
              카테고리 관리
            </FilterTableToolbarButton>
          </>
        }
        excelExport={{
          columns,
          data: tableData,
          selectedRowKeys,
        }}
      >
        {contentError ? (
          <div className="page-content-error" role="alert">
            {contentError}
          </div>
        ) : (
          <>
            <CmsDataTable<AdminInquiryRow>
              rowKey="id"
              className="cms-data-table admin-inquiry-page__table"
              tableLayout="fixed"
              scroll={{ x: INQUIRY_LIST_TABLE_SCROLL_X }}
              columns={columns}
              dataSource={tableData}
              pagination={false}
              onRow={record => ({
                className: 'admin-inquiry-page__row--clickable',
                onClick: (e: MouseEvent) => {
                  const el = e.target as HTMLElement
                  if (
                    el.closest('.ant-checkbox-wrapper') ||
                    el.closest('.ant-table-selection-column')
                  ) {
                    return
                  }
                  openDetailModal(record.id)
                },
              })}
              rowSelection={
                canWrite
                  ? {
                      columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                      selectedRowKeys,
                      onChange: keys => setSelectedRowKeys(keys.map(k => String(k))),
                      preserveSelectedRowKeys: false,
                      getCheckboxProps: (record: AdminInquiryRow) => ({
                        disabled: record.status === 'ANSWERED',
                      }),
                    }
                  : undefined
              }
            />
            <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
          </>
        )}
      </FilterTableLayout>
    </div>
  )
}

export default AdminInquiryPage
