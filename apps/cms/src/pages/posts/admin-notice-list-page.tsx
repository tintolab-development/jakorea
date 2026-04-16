/**
 * 게시글 관리 - 공지사항 관리 페이지 (관리자용)
 * 데이터 관리 > 후원사 관리(sponsor-page)와 동일: FilterTableLayout + useTablePage + CmsButton + 목록용 CSS 체인
 */

import { useCallback, useMemo, useState, type Key, type MouseEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  ADMIN_NOTICE_MOCK_LIST_COUNT,
  buildAdminNoticeMockList,
  type Notice,
} from '@/data/mock/notices'
import { adminNoticeManagementFilterFields } from '@/features/posts/model/admin-notice-management-filter-fields'
import { adminNoticeManagementTablePageConfig } from '@/features/posts/model/admin-notice-management-table.config'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  useTablePage,
  EMPTY_TABLE_PAGE_CONTEXT,
} from '@/shared/components/table-system/model/use-table-page'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton } from '@/shared/ui'
import { NoticePinnedIcon } from '@/features/posts/ui/notice-pinned-icon'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import '@/features/program/ui/program-list.css'
import './admin-notice-list-page.css'

/** 고정 레이아웃 기준 최소 가로 스크롤 (체크박스 열 제외 본문 컬럼 합 + 여유) */
const NOTICE_LIST_TABLE_SCROLL_X = 1180

const NOTICE_LIST_COL_WIDTH = {
  no: 68,
  category: 108,
  title: 360,
  visibility: 100,
  author: 112,
  datetime: 176,
  views: 108,
} as const

export function AdminNoticeListPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [rows] = useState<Notice[]>(() =>
    buildAdminNoticeMockList(ADMIN_NOTICE_MOCK_LIST_COUNT).map(r => ({ ...r }))
  )

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
  } = useTablePage(adminNoticeManagementTablePageConfig, {
    data: rows,
    searchParams,
    setSearchParams,
    context: EMPTY_TABLE_PAGE_CONTEXT,
  })

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const handleBulkDelete = useCallback(() => {
    if (!canWrite) return
    message.info('공지사항 삭제는 추후 연결됩니다.')
  }, [canWrite])

  const handleRegister = useCallback(() => {
    if (!canWrite) return
    message.info('공지사항 등록은 추후 연결됩니다.')
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
        title: '카테고리',
        dataIndex: 'category',
        key: 'category',
        width: NOTICE_LIST_COL_WIDTH.category,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '제목',
        dataIndex: 'title',
        key: 'title',
        width: NOTICE_LIST_COL_WIDTH.title,
        align: 'center',
        ellipsis: { showTitle: true },
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
        title: '공개 여부',
        key: 'visibility',
        width: NOTICE_LIST_COL_WIDTH.visibility,
        align: 'center',
        render: (_: unknown, row) =>
          row.status === 'published' ? (
            '공개'
          ) : (
            <span className="admin-notice-list-page__status-private">비공개</span>
          ),
      },
      {
        title: '작성자',
        dataIndex: 'author',
        key: 'author',
        width: NOTICE_LIST_COL_WIDTH.author,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '작성일시',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: NOTICE_LIST_COL_WIDTH.datetime,
        align: 'center',
        render: (iso: string) => dayjs(iso).format('YYYY.MM.DD HH:mm:ss'),
      },
      {
        title: '조회수',
        dataIndex: 'viewCount',
        key: 'viewCount',
        width: NOTICE_LIST_COL_WIDTH.views,
        align: 'center',
        render: (n: number) => n.toLocaleString('ko-KR'),
      },
    ],
    [tableData.length]
  )

  return (
    <div className="admin-notice-list-page">
      <FilterTableLayout
        bordered={false}
        fields={adminNoticeManagementFilterFields}
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
        actions={
          <>
            <CmsButton
              variant="delete"
              onClick={handleBulkDelete}
              disabled={!canWrite || selectedRowKeys.length === 0}
            >
              공지사항 삭제
            </CmsButton>
            <CmsButton variant="secondary" onClick={() => navigate('/admin/posts/categories')}>
              카테고리 관리
            </CmsButton>
            <CmsButton variant="primary" onClick={handleRegister} disabled={!canWrite}>
              공지사항 등록
            </CmsButton>
          </>
        }
      >
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
      </FilterTableLayout>
    </div>
  )
}
