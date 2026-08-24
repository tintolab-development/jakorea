/**
 * 게시글 관리 - 문의내역 (관리자용)
 * 공지사항 관리(admin-notice-list-page)와 동일: FilterTableLayout + useTablePage + CmsButton
 */

import { useCallback, useEffect, useMemo, useState, type Key, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { shouldUseInquiriesRemoteApi } from '@/features/posts/api/inquiries/admin-inquiries-service'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { useAdminInquiryCategories } from '@/features/posts/hooks/use-admin-inquiry-categories'
import { useInquiryListQuery } from '@/features/posts/hooks/use-inquiry-list-query'
import { useInquiryMutations } from '@/features/posts/hooks/use-inquiry-mutations'
import { buildAdminInquiryFilterRows } from '@/features/posts/model/admin-inquiry-management-filter-fields'
import { adminInquiryManagementTablePageConfig } from '@/features/posts/model/admin-inquiry-management-table.config'
import type {
  AdminInquiryRow,
  AdminInquiryTableContext,
} from '@/features/posts/model/admin-inquiry-management.types'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { ActionResultModal, CmsButton } from '@/shared/ui'
import { AdminInquiryDetailModal } from '@/features/posts/ui/admin-inquiry-detail-modal'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { InquiryCategoryManagementModal } from '@/features/posts/ui/inquiry-category-management/inquiry-category-management-modal'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'
import './admin-inquiry-page.css'

const INQUIRY_LIST_COL_WIDTH = {
  no: TABLE_COLUMN_WIDTHS.index,
  status: 108,
  category: 108,
  programName: 140,
  title: 360,
  memberName: 112,
  createdAt: 176,
  assignee: 100,
  answeredAt: 176,
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
  INQUIRY_LIST_COL_WIDTH.assignee +
  INQUIRY_LIST_COL_WIDTH.answeredAt

export function AdminInquiryPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const inquiriesRemote = shouldUseInquiriesRemoteApi()
  const [searchParams, setSearchParams] = useSearchParams()

  const listQuery = useInquiryListQuery(searchParams, true)
  const { deleteMutation, bulkDeleteMutation } = useInquiryMutations()
  const rows = listQuery.data ?? []
  const contentLoading = listQuery.isLoading
  const contentError = listQuery.isError
    ? getPostsApiErrorMessage(listQuery.error, '문의 목록을 불러오지 못했습니다.')
    : null

  const { categoryRows, allowedCategoryLabels, allowedCategorySet } =
    useAdminInquiryCategories(rows)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  const tablePageContext: AdminInquiryTableContext = useMemo(
    () => ({
      allowedCategoryLabels,
    }),
    [allowedCategoryLabels]
  )

  const filterRowsConfig = useMemo(
    () => buildAdminInquiryFilterRows(tablePageContext.allowedCategoryLabels),
    [tablePageContext.allowedCategoryLabels]
  )

  const {
    pendingFilters,
    setPendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
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
    if (!canWrite || selectedRowKeys.length === 0) return
    setBulkDeleteConfirmOpen(true)
  }, [canWrite, selectedRowKeys.length])

  const handleConfirmBulkDelete = useCallback(async () => {
    const ids = selectedRowKeys.map(k => String(k))
    if (ids.length === 0) {
      setBulkDeleteConfirmOpen(false)
      return
    }
    try {
      await bulkDeleteMutation.mutateAsync(ids)
      setSelectedRowKeys([])
      setBulkDeleteConfirmOpen(false)
    } catch (error) {
      setActionResultTitle('문의 삭제 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [bulkDeleteMutation, selectedRowKeys])

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
          tableData.length === 0 ? '-' : tableData.length - index,
      },
      {
        title: '답변 현황',
        key: 'status',
        width: INQUIRY_LIST_COL_WIDTH.status,
        align: 'center',
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
        render: (v: string) => (v == null || v === '' ? '-' : v),
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        width: INQUIRY_LIST_COL_WIDTH.programName,
        align: 'center',
        ellipsis: true,
        render: (v: string | null) => (v == null || v === '' ? '-' : v),
      },
      {
        title: '제목',
        dataIndex: 'title',
        key: 'title',
        width: INQUIRY_LIST_COL_WIDTH.title,
        align: 'center',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: 'admin-inquiry-page__cell--title' }),
        onCell: () => ({ className: 'admin-inquiry-page__cell--title' }),
        render: (text: string) => (text == null || text === '' ? '-' : text),
      },
      {
        title: '문의 회원명',
        dataIndex: 'memberName',
        key: 'memberName',
        width: INQUIRY_LIST_COL_WIDTH.memberName,
        align: 'center',
        ellipsis: true,
        render: (v: string) => (v == null || v === '' ? '-' : v),
      },
      {
        title: '문의 일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: INQUIRY_LIST_COL_WIDTH.createdAt,
        align: 'center',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-datetime' }),
        onCell: () => ({ className: 'admin-inquiry-page__cell--datetime' }),
        render: (iso: string) => (
          <span className="admin-inquiry-page__datetime-text">
            {dayjs(iso).format('YYYY.MM.DD HH:mm')}
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
        render: (v: string | null) => (v == null || v === '' ? '-' : v),
      },
      {
        title: '답변 일시',
        dataIndex: 'answeredAt',
        key: 'answeredAt',
        width: INQUIRY_LIST_COL_WIDTH.answeredAt,
        align: 'center',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-datetime' }),
        onCell: () => ({ className: 'admin-inquiry-page__cell--datetime' }),
        render: (iso: string | null) => (
          <span className="admin-inquiry-page__datetime-text">
            {iso == null || iso === '' ? '-' : dayjs(iso).format('YYYY.MM.DD HH:mm')}
          </span>
        ),
      },
    ],
    [tableData.length]
  )

  const bulkDeleteLine1 =
    selectedRowKeys.length > 0
      ? `선택한 ${selectedRowKeys.length}건의 문의를 삭제하시겠습니까?`
      : '선택한 문의를 삭제하시겠습니까?'

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
        title="문의삭제"
        confirmLabel="문의삭제"
        line1="해당 문의를 삭제하시겠습니까?"
        line2="삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?"
        zIndex={1200}
      />
      <NoticeDeleteConfirmModal
        open={bulkDeleteConfirmOpen}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        preset="inquiry"
        title="문의삭제"
        confirmLabel="문의삭제"
        line1={bulkDeleteLine1}
        line2="삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?"
      />
      <InquiryCategoryManagementModal
        open={categoryModalOpen}
        onCancel={() => setCategoryModalOpen(false)}
        categories={categoryRows}
        onCategoriesChange={() => {}}
        inquiries={rows}
      />
      <ActionResultModal
        open={actionResultOpen}
        title={actionResultTitle}
        body={actionResultMessage}
        onClose={() => setActionResultOpen(false)}
      />
      <FilterTableLayout
        bordered={false}
        className="admin-inquiry-page__filter-layout"
        rows={filterRowsConfig}
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
        title="문의목록"
        description={`총 ${displayedCount.toLocaleString()}건`}
        contentLoading={contentLoading}
        actions={
          <>
            <CmsButton
              variant="delete"
              onClick={handleBulkDelete}
              disabled={!canWrite || selectedRowKeys.length === 0}
            >
              문의삭제
            </CmsButton>
            <CmsButton
              variant="secondary"
              onClick={() => setCategoryModalOpen(true)}
              disabled={inquiriesRemote}
              title={inquiriesRemote ? '문의 카테고리 API가 제공되지 않습니다.' : undefined}
            >
              카테고리 관리
            </CmsButton>
          </>
        }
        excelExport={{
          columns,
          data: tableData,
        }}
      >
        {contentError ? (
          <div className="page-content-error" role="alert">
            {contentError}
          </div>
        ) : (
          <Table<AdminInquiryRow>
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
                  }
                : undefined
            }
          />
        )}
      </FilterTableLayout>
    </div>
  )
}

export default AdminInquiryPage
