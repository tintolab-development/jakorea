/**
 * 게시글 관리 - FAQ 관리 페이지 (관리자용)
 * 공지사항 관리(admin-notice-list-page)와 동일: FilterTableLayout + useTablePage + CmsButton
 */

import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Key,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { AdminFaq } from '@/features/posts/model/admin-faq'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { useAdminFaqCategories } from '@/features/posts/hooks/use-admin-faq-categories'
import { useFaqListQuery } from '@/features/posts/hooks/use-faq-list-query'
import { useFaqMutations } from '@/features/posts/hooks/use-faq-mutations'
import { buildAdminFaqManagementFilterFields } from '@/features/posts/model/admin-faq-management-filter-fields'
import { adminFaqManagementTablePageConfig } from '@/features/posts/model/admin-faq-management-table.config'
import type { AdminFaqTableContext } from '@/features/posts/model/admin-faq-management.types'
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
import { resolvePostsDeleteConfirmCopy } from '@/features/posts/lib/posts-delete-confirm-copy'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { CategoryManagementModal } from '@/features/posts/ui/category-management-modal'
import { FaqFormModal } from '@/features/posts/ui/faq-form-modal'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'
import './admin-faq-delete-btn.css'
import './admin-faq-list-page.css'

/** 고정열 합 + 제목 최소 + 체크박스 여유 (시안: 공개100·카테고리160·작성자140·일시200×2) */
const FAQ_LIST_TABLE_SCROLL_X = 1140

const FAQ_LIST_COL_WIDTH = {
  no: 80,
  visibility: 100,
  category: 160,
  title: 280,
  author: 140,
  datetime: 200,
} as const

function AdminFAQPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const { showAlert } = useCmsAlert()
  const navigate = useNavigate()
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
  } = useFaqListQuery(searchParams, true)
  const { bulkDeleteMutation } = useFaqMutations()
  const contentError = listIsError
    ? getPostsApiErrorMessage(listError, 'FAQ 목록을 불러오지 못했습니다.')
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
    remoteActions: faqCategoryRemoteActions,
  } = useAdminFaqCategories()
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [actionResultOpen, setActionResultOpen] = useState(false)
  const [actionResultTitle, setActionResultTitle] = useState('')
  const [actionResultMessage, setActionResultMessage] = useState('')

  const tablePageContext: AdminFaqTableContext = useMemo(
    () => ({
      allowedCategoryLabels,
    }),
    [allowedCategoryLabels]
  )

  const filterFields = useMemo(
    () => buildAdminFaqManagementFilterFields(tablePageContext.allowedCategoryLabels),
    [tablePageContext.allowedCategoryLabels]
  )

  const {
    pendingFilters,
    setPendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    tableData,
    hasActiveFilters,
  } = useTablePage(adminFaqManagementTablePageConfig, {
    data: rows,
    searchParams,
    setSearchParams,
    context: tablePageContext,
  })

  useEffect(() => {
    setPendingFilters(prev => {
      if (prev.category !== 'ALL' && !allowedCategorySet.has(prev.category)) {
        return { ...prev, category: 'ALL' }
      }
      return prev
    })
  }, [allowedCategorySet, setPendingFilters])

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  const handleBulkDelete = useCallback(() => {
    if (!canWrite) return
    if (selectedRowKeys.length === 0) {
      showAlert({
        title: '항목 선택 안내',
        content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
      })
      return
    }
    setBulkDeleteConfirmOpen(true)
  }, [canWrite, selectedRowKeys.length, showAlert])

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
      showDeleteCompletedAlert()
    } catch (error) {
      setActionResultTitle('FAQ 삭제 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [bulkDeleteMutation, selectedRowKeys])

  const handleRegister = useCallback(() => {
    if (!canWrite) return
    setRegisterModalOpen(true)
  }, [canWrite])

  const columns: ColumnsType<AdminFaq> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: FAQ_LIST_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: AdminFaq, index: number) =>
          totalElements === 0 ? '—' : totalElements - index,
      },
      {
        title: '공개 여부',
        key: 'visibility',
        width: FAQ_LIST_COL_WIDTH.visibility,
        align: 'center',
        className: 'admin-faq-list-page__col-visibility',
        onHeaderCell: () => ({ className: 'admin-faq-list-page__col-visibility' }),
        render: (_: unknown, row) =>
          row.status === 'published' ? (
            '공개'
          ) : (
            <span className="admin-faq-list-page__status-private">비공개</span>
          ),
      },
      {
        title: '카테고리',
        dataIndex: 'category',
        key: 'category',
        width: FAQ_LIST_COL_WIDTH.category,
        align: 'center',
        ellipsis: true,
        className: 'admin-faq-list-page__col-category',
        onHeaderCell: () => ({ className: 'admin-faq-list-page__col-category' }),
      },
      {
        title: '제목',
        dataIndex: 'question',
        key: 'question',
        width: FAQ_LIST_COL_WIDTH.title,
        align: 'center',
        ellipsis: { showTitle: true },
        className: 'admin-faq-list-page__col-title',
        onHeaderCell: () => ({ className: 'admin-faq-list-page__col-title' }),
        render: (text: string) => (
          <span className="admin-faq-list-page__title-cell">
            <span className="admin-faq-list-page__title-text">{text}</span>
          </span>
        ),
      },
      {
        title: '작성자명',
        dataIndex: 'author',
        key: 'author',
        width: FAQ_LIST_COL_WIDTH.author,
        align: 'center',
        ellipsis: true,
        className: 'admin-faq-list-page__col-author',
        onHeaderCell: () => ({ className: 'admin-faq-list-page__col-author' }),
      },
      {
        title: '작성일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: FAQ_LIST_COL_WIDTH.datetime,
        align: 'center',
        className: 'admin-faq-list-page__col-datetime',
        onHeaderCell: () => ({ className: 'admin-faq-list-page__col-datetime' }),
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
      },
      {
        title: '수정일시',
        key: 'updatedAt',
        width: FAQ_LIST_COL_WIDTH.datetime,
        align: 'center',
        className: 'admin-faq-list-page__col-datetime',
        onHeaderCell: () => ({ className: 'admin-faq-list-page__col-datetime' }),
        render: (_: unknown, row: AdminFaq) =>
          dayjs(row.updatedAt ?? row.createdAt).format('YYYY.MM.DD HH:mm:ss'),
      },
    ],
    [totalElements]
  )

  const bulkDeleteCopy = useMemo(
    () => resolvePostsDeleteConfirmCopy('faq', 'bulk', selectedRowKeys.length),
    [selectedRowKeys.length]
  )

  return (
    <div className="admin-faq-list-page">
      <NoticeDeleteConfirmModal
        open={bulkDeleteConfirmOpen}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        preset="faq"
        {...bulkDeleteCopy}
      />
      <CategoryManagementModal
        kind="faq"
        open={categoryModalOpen}
        onCancel={() => setCategoryModalOpen(false)}
        categories={categoryRows}
        onCategoriesChange={() => {}}
        posts={rows}
        remoteActions={faqCategoryRemoteActions}
      />
      <FaqFormModal
        open={registerModalOpen}
        onCancel={() => setRegisterModalOpen(false)}
        onSuccess={() => {
          setRegisterModalOpen(false)
        }}
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
          title: pendingFilters.title,
          author: pendingFilters.author,
          visibility: pendingFilters.visibility,
          category: pendingFilters.category,
          dateRange: pendingFilters.dateRange,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="FAQ 목록"
        description={`총 ${totalElements.toLocaleString()}건`}
        contentLoading={contentLoading}
        actions={
          <>
            <FilterTableToolbarButton variant="delete" className="admin-faq-delete-btn" onClick={handleBulkDelete}>
              FAQ 삭제
            </FilterTableToolbarButton>
            <FilterTableToolbarButton variant="secondary" onClick={() => setCategoryModalOpen(true)}>
              카테고리 관리
            </FilterTableToolbarButton>
            <FilterTableToolbarButton variant="primary" onClick={handleRegister}>
              FAQ 등록
            </FilterTableToolbarButton>
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
          <>
            <CmsDataTable<AdminFaq>
              rowKey="id"
              className="cms-data-table admin-faq-list-page__table"
              tableLayout="fixed"
              scroll={{ x: FAQ_LIST_TABLE_SCROLL_X }}
              columns={columns}
              dataSource={tableData}
              pagination={false}
              onRow={record => ({
                className: 'admin-faq-list-page__row--clickable',
                onClick: (e: ReactMouseEvent) => {
                  const el = e.target as HTMLElement
                  if (
                    el.closest('.ant-checkbox-wrapper') ||
                    el.closest('.ant-table-selection-column')
                  ) {
                    return
                  }
                  navigate(`/admin/posts/faq/${record.id}`)
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
            <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
          </>
        )}
      </FilterTableLayout>
    </div>
  )
}

export default AdminFAQPage
