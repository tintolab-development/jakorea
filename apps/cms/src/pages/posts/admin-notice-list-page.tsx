/**
 * 게시글 관리 - 공지사항 관리 페이지 (관리자용)
 * 데이터 관리 > 후원사 관리(sponsor-page)와 동일: FilterTableLayout + useTablePage + CmsButton + 목록용 CSS 체인
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Key,
  type MouseEvent,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { Notice } from '@/data/mock/notices'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { useAdminNoticeCategories } from '@/features/posts/hooks/use-admin-notice-categories'
import { useNoticeListQuery } from '@/features/posts/hooks/use-notice-list-query'
import { useNoticeMutations } from '@/features/posts/hooks/use-notice-mutations'
import { buildAdminNoticeManagementFilterFields } from '@/features/posts/model/admin-notice-management-filter-fields'
import { adminNoticeManagementTablePageConfig } from '@/features/posts/model/admin-notice-management-table.config'
import type { AdminNoticeTableContext } from '@/features/posts/model/admin-notice-management.types'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  ActionResultModal,
  CmsButton,
} from '@/shared/ui'
import { NoticePinnedIcon } from '@/features/posts/ui/notice-pinned-icon'
import { NoticeCategoryManagementModal } from '@/features/posts/ui/notice-category-management-modal'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import { NoticeFormModal } from '@/features/posts/ui/notice-form-modal'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/general/ui/program-list.css'
import './admin-notice-list-page.css'

/** 고정열 합 + 제목 최소 + 체크박스 여유 (시안: 공개100·카테고리160·작성자140·일시200×2·조회140) */
const NOTICE_LIST_TABLE_SCROLL_X = 1280

const NOTICE_LIST_COL_WIDTH = {
  no: 80,
  visibility: 100,
  category: 160,
  /** 제목은 flex:1 — Ant width는 최소치만, 실제는 CSS로 잔여폭 */
  title: 280,
  author: 140,
  datetime: 200,
  views: 140,
} as const

export function AdminNoticeListPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const listQuery = useNoticeListQuery(searchParams, true)
  const { bulkDeleteMutation } = useNoticeMutations()
  const rows = listQuery.data ?? []
  const contentLoading = listQuery.isLoading
  const contentError = listQuery.isError
    ? getPostsApiErrorMessage(listQuery.error, '공지사항 목록을 불러오지 못했습니다.')
    : null

  const {
    categoryRows,
    allowedCategoryLabels,
    allowedCategorySet,
    remoteActions: noticeCategoryRemoteActions,
  } = useAdminNoticeCategories()
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [actionResultOpen, setActionResultOpen] = useState(false)
  const [actionResultTitle, setActionResultTitle] = useState('')
  const [actionResultMessage, setActionResultMessage] = useState('')

  const tablePageContext: AdminNoticeTableContext = useMemo(
    () => ({
      allowedCategoryLabels,
    }),
    [allowedCategoryLabels]
  )

  const filterFields = useMemo(
    () => buildAdminNoticeManagementFilterFields(tablePageContext.allowedCategoryLabels),
    [tablePageContext.allowedCategoryLabels]
  )

  const {
    pendingFilters,
    setPendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
  } = useTablePage(adminNoticeManagementTablePageConfig, {
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
      setActionResultTitle('공지 삭제 실패')
      setActionResultMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
      setActionResultOpen(true)
    }
  }, [bulkDeleteMutation, selectedRowKeys])

  const handleRegister = useCallback(() => {
    if (!canWrite) return
    setRegisterModalOpen(true)
  }, [canWrite])

  const columns: ColumnsType<Notice> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: NOTICE_LIST_COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, __: Notice, index: number) =>
          tableData.length === 0 ? '—' : tableData.length - index,
      },
      {
        title: '공개 여부',
        key: 'visibility',
        width: NOTICE_LIST_COL_WIDTH.visibility,
        align: 'center',
        className: 'admin-notice-list-page__col-visibility',
        onHeaderCell: () => ({ className: 'admin-notice-list-page__col-visibility' }),
        render: (_: unknown, row) =>
          row.status === 'published' ? (
            '공개'
          ) : (
            <span className="admin-notice-list-page__status-private">비공개</span>
          ),
      },
      {
        title: '카테고리',
        dataIndex: 'category',
        key: 'category',
        width: NOTICE_LIST_COL_WIDTH.category,
        align: 'center',
        ellipsis: true,
        className: 'admin-notice-list-page__col-category',
        onHeaderCell: () => ({ className: 'admin-notice-list-page__col-category' }),
      },
      {
        title: '제목',
        dataIndex: 'title',
        key: 'title',
        width: NOTICE_LIST_COL_WIDTH.title,
        align: 'center',
        ellipsis: { showTitle: true },
        className: 'admin-notice-list-page__col-title',
        onHeaderCell: () => ({ className: 'admin-notice-list-page__col-title' }),
        render: (text: string, row) => (
          <span className="admin-notice-list-page__title-cell">
            {row.isImportant ? (
              <NoticePinnedIcon className="admin-notice-list-page__pin" size={20} />
            ) : null}
            <span className="admin-notice-list-page__title-text">{text}</span>
          </span>
        ),
      },
      {
        title: '작성자명',
        dataIndex: 'author',
        key: 'author',
        width: NOTICE_LIST_COL_WIDTH.author,
        align: 'center',
        ellipsis: true,
        className: 'admin-notice-list-page__col-author',
        onHeaderCell: () => ({ className: 'admin-notice-list-page__col-author' }),
      },
      {
        title: '작성일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: NOTICE_LIST_COL_WIDTH.datetime,
        align: 'center',
        className: 'admin-notice-list-page__col-datetime',
        onHeaderCell: () => ({ className: 'admin-notice-list-page__col-datetime' }),
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
      },
      {
        title: '수정일시',
        key: 'updatedAt',
        width: NOTICE_LIST_COL_WIDTH.datetime,
        align: 'center',
        className: 'admin-notice-list-page__col-datetime',
        onHeaderCell: () => ({ className: 'admin-notice-list-page__col-datetime' }),
        render: (_: unknown, row: Notice) =>
          dayjs(row.updatedAt ?? row.createdAt).format('YYYY.MM.DD HH:mm:ss'),
      },
      {
        title: '조회수',
        dataIndex: 'viewCount',
        key: 'viewCount',
        width: NOTICE_LIST_COL_WIDTH.views,
        align: 'center',
        className: 'admin-notice-list-page__col-views',
        onHeaderCell: () => ({ className: 'admin-notice-list-page__col-views' }),
        render: (n: number) => n.toLocaleString('ko-KR'),
      },
    ],
    [tableData.length]
  )

  const bulkDeleteLine1 =
    selectedRowKeys.length > 0
      ? `선택한 ${selectedRowKeys.length}건의 공지사항을 삭제하시겠습니까?`
      : '선택한 공지사항을 삭제하시겠습니까?'

  return (
    <div className="admin-notice-list-page">
      <NoticeDeleteConfirmModal
        open={bulkDeleteConfirmOpen}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        preset="notice"
        line1={bulkDeleteLine1}
      />
      <NoticeCategoryManagementModal
        open={categoryModalOpen}
        onCancel={() => setCategoryModalOpen(false)}
        categories={categoryRows}
        onCategoriesChange={() => {}}
        notices={rows}
        remoteActions={noticeCategoryRemoteActions}
      />
      <NoticeFormModal
        open={registerModalOpen}
        mode="create"
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
        title="공지사항 목록"
        description={`총 ${displayedCount.toLocaleString()}건`}
        contentLoading={contentLoading}
        actions={
          <>
            <CmsButton
              variant="delete"
              onClick={handleBulkDelete}
              disabled={selectedRowKeys.length === 0}
            >
              공지사항 삭제
            </CmsButton>
            <CmsButton variant="secondary" onClick={() => setCategoryModalOpen(true)}>
              카테고리 관리
            </CmsButton>
            <CmsButton variant="primary" onClick={handleRegister}>
              공지사항 등록
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
          <Table<Notice>
            rowKey="id"
            className="cms-data-table admin-notice-list-page__table"
            tableLayout="fixed"
            scroll={{ x: NOTICE_LIST_TABLE_SCROLL_X }}
            columns={columns}
            dataSource={tableData}
            pagination={false}
            onRow={record => ({
              className: 'admin-notice-list-page__row--clickable',
              onClick: (e: MouseEvent) => {
                const el = e.target as HTMLElement
                if (
                  el.closest('.ant-checkbox-wrapper') ||
                  el.closest('.ant-table-selection-column')
                ) {
                  return
                }
                navigate(`/admin/posts/notices/${record.id}`)
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
