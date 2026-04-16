/**
 * 게시글 관리 - 문의내역 (관리자용)
 * 공지사항 관리(admin-notice-list-page)와 동일: FilterTableLayout + useTablePage + CmsButton
 */

import { useCallback, useEffect, useMemo, useState, type Key, type MouseEvent } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { deleteAdminInquiries, listAdminInquiries } from '@/features/posts/api/admin-inquiry-mock-store'
import { useAdminInquiryCategories } from '@/features/posts/hooks/use-admin-inquiry-categories'
import { buildAdminInquiryFilterRows } from '@/features/posts/model/admin-inquiry-management-filter-fields'
import { adminInquiryManagementTablePageConfig } from '@/features/posts/model/admin-inquiry-management-table.config'
import type {
  AdminInquiryRow,
  AdminInquiryTableContext,
  InquiryCategoryRow,
} from '@/features/posts/model/admin-inquiry-management.types'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton } from '@/shared/ui'
import { AdminInquiryDetailModal } from '@/features/posts/ui/admin-inquiry-detail-modal'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { InquiryCategoryManagementModal } from '@/features/posts/ui/inquiry-category-management/inquiry-category-management-modal'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/ui/program-list.css'
import './admin-inquiry-page.css'

const ADMIN_INQUIRIES_LIST_PATH = '/admin/posts/inquiries'

/** No. 열 80px, 나머지 데이터 9열 균등 폭 */
const NO_COL_WIDTH = TABLE_COLUMN_WIDTHS.index
const DATA_COL_WIDTH = 112
const INQUIRY_LIST_TABLE_SCROLL_X =
  TABLE_COLUMN_WIDTHS.checkbox + NO_COL_WIDTH + DATA_COL_WIDTH * 9

export function AdminInquiryPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const [rows, setRows] = useState<AdminInquiryRow[]>(() => listAdminInquiries())

  const syncRowsFromStore = useCallback(() => {
    setRows(listAdminInquiries())
  }, [])

  useEffect(() => {
    if (location.pathname === ADMIN_INQUIRIES_LIST_PATH) {
      // mock 저장소와 목록 동기화 — 상세 복귀 등(공지 목록과 동일)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pathname 변경 시 스토어 재로드
      syncRowsFromStore()
    }
  }, [location.pathname, syncRowsFromStore])

  const {
    categoryRows,
    allowedCategoryLabels,
    allowedCategorySet,
    replaceCategories: replaceInquiryCategories,
  } = useAdminInquiryCategories()
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  const handleInquiryCategoriesChange = useCallback(
    (next: InquiryCategoryRow[]) => {
      replaceInquiryCategories(next)
      syncRowsFromStore()
    },
    [replaceInquiryCategories, syncRowsFromStore]
  )

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

  const handleConfirmBulkDelete = useCallback(() => {
    const ids = selectedRowKeys.map(k => String(k))
    if (ids.length === 0) {
      setBulkDeleteConfirmOpen(false)
      return
    }
    deleteAdminInquiries(ids)
    message.success(`선택한 ${ids.length}건의 문의가 삭제되었습니다.`)
    setRows(listAdminInquiries())
    setSelectedRowKeys([])
    setBulkDeleteConfirmOpen(false)
  }, [selectedRowKeys])

  const handleDetailDeleteRequest = useCallback((id: string) => {
    setSingleDeleteInquiryId(id)
    setSingleDeleteConfirmOpen(true)
  }, [])

  const handleConfirmSingleDelete = useCallback(() => {
    if (singleDeleteInquiryId == null) {
      setSingleDeleteConfirmOpen(false)
      return
    }
    deleteAdminInquiries([singleDeleteInquiryId])
    message.success('문의가 삭제되었습니다.')
    setRows(listAdminInquiries())
    setSelectedRowKeys(prev => prev.filter(k => String(k) !== singleDeleteInquiryId))
    setSingleDeleteConfirmOpen(false)
    setSingleDeleteInquiryId(null)
    closeDetailModal()
  }, [closeDetailModal, singleDeleteInquiryId])

  const columns: ColumnsType<AdminInquiryRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: NO_COL_WIDTH,
        align: 'center',
        className: 'admin-inquiry-page__col-no',
        onHeaderCell: () => ({ className: 'admin-inquiry-page__col-no' }),
        render: (_: unknown, __: AdminInquiryRow, index: number) =>
          tableData.length === 0 ? '—' : tableData.length - index,
      },
      {
        title: '답변 현황',
        key: 'status',
        width: DATA_COL_WIDTH,
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
        width: DATA_COL_WIDTH,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        width: DATA_COL_WIDTH,
        align: 'center',
        ellipsis: true,
        render: (v: string | null) => (v == null || v === '' ? '—' : v),
      },
      {
        title: '제목',
        dataIndex: 'title',
        key: 'title',
        width: DATA_COL_WIDTH,
        align: 'left',
        ellipsis: { showTitle: true },
        onHeaderCell: () => ({ className: 'admin-inquiry-page__cell--title' }),
        onCell: () => ({ className: 'admin-inquiry-page__cell--title' }),
      },
      {
        title: '문의 회원',
        dataIndex: 'memberName',
        key: 'memberName',
        width: DATA_COL_WIDTH,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '문의 일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: DATA_COL_WIDTH,
        align: 'center',
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
      },
      {
        title: '담당자',
        dataIndex: 'assignee',
        key: 'assignee',
        width: DATA_COL_WIDTH,
        align: 'center',
        ellipsis: true,
        render: (v: string | null) => (v == null || v === '' ? '—' : v),
      },
      {
        title: '답변 일시',
        dataIndex: 'answeredAt',
        key: 'answeredAt',
        width: DATA_COL_WIDTH,
        align: 'center',
        render: (iso: string | null) =>
          iso == null || iso === '' ? '—' : dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
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
        onSuccess={syncRowsFromStore}
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
        onCategoriesChange={handleInquiryCategoriesChange}
        inquiries={rows}
      />
      <FilterTableLayout
        bordered={false}
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
        actions={
          <>
            <CmsButton
              variant="delete"
              onClick={handleBulkDelete}
              disabled={!canWrite || selectedRowKeys.length === 0}
            >
              문의삭제
            </CmsButton>
            <CmsButton variant="secondary" onClick={() => setCategoryModalOpen(true)}>
              카테고리 관리
            </CmsButton>
          </>
        }
      >
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
      </FilterTableLayout>
    </div>
  )
}

export default AdminInquiryPage
