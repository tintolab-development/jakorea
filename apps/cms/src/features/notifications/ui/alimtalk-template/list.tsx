/**
 * 알림 메시지 관리 > 카카오 알림톡 관리 > 알림톡 양식 탭
 */

import { useCallback, useMemo } from 'react'
import dayjs from 'dayjs'
import { Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import { shouldUseAlimtalkTemplatesRemoteApi } from '@/features/notifications/api/alimtalk-template-service'
import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import { useAlimtalkTemplateListQuery } from '@/features/notifications/hooks/use-alimtalk-template-list-query'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { ALIMTALK_TEMPLATE_FILTER_FIELDS } from '@/features/notifications/model/alimtalk-template/filter-fields'
import { ALIMTALK_TEMPLATE_MOCK_ROWS } from '@/features/notifications/model/alimtalk-template/mock'
import { alimtalkTemplateTablePageConfig } from '@/features/notifications/model/alimtalk-template/table.config'
import type {
  AlimtalkTemplateRow,
  AlimtalkTemplateTableContext,
  KakaoApprovalStatus,
  TemplateUsageStatus,
} from '@/features/notifications/model/alimtalk-template/types'
import '@/pages/programs/program-list-page.css'
import '@/pages/users/user-list-page.css'
import './list.css'

const APPROVAL_STATUS_LABEL: Record<KakaoApprovalStatus, string> = {
  REGISTERED: '등록',
  REQUESTED: '요청',
  APPROVED: '승인',
  REJECTED: '반려',
}

const USAGE_STATUS_LABEL: Record<TemplateUsageStatus, string> = {
  WAITING: '대기',
  NORMAL: '정상',
  SUSPENDED: '중단',
  DORMANT: '휴면',
  BLOCKED: '차단',
}

const TEMPLATE_TYPE_LABEL = {
  BASIC: '기본형',
} as const

const COL_WIDTH = {
  no: TABLE_COLUMN_WIDTHS.index,
  approvalStatus: 120,
  usageStatus: 120,
  channelName: 120,
  templateType: 88,
  templateName: 160,
  templateContent: 280,
  characterCount: 88,
  registeredAt: 176,
  manage: 120,
} as const

const TABLE_SCROLL_X =
  COL_WIDTH.no +
  COL_WIDTH.approvalStatus +
  COL_WIDTH.usageStatus +
  COL_WIDTH.channelName +
  COL_WIDTH.templateType +
  COL_WIDTH.templateName +
  COL_WIDTH.templateContent +
  COL_WIDTH.characterCount +
  COL_WIDTH.registeredAt +
  COL_WIDTH.manage

function approvalStatusCell(status: KakaoApprovalStatus) {
  const base = 'alimtalk-template-list__status'
  const modifier =
    status === 'REGISTERED'
      ? `${base}--approval-registered`
      : status === 'REQUESTED'
        ? `${base}--approval-requested`
        : status === 'APPROVED'
          ? `${base}--approval-approved`
          : `${base}--approval-rejected`
  return <span className={`${base} ${modifier}`}>{APPROVAL_STATUS_LABEL[status]}</span>
}

function usageStatusCell(status: TemplateUsageStatus) {
  const base = 'alimtalk-template-list__status'
  const modifier =
    status === 'WAITING'
      ? `${base}--usage-waiting`
      : status === 'NORMAL'
        ? `${base}--usage-normal`
        : status === 'SUSPENDED'
          ? `${base}--usage-suspended`
          : status === 'DORMANT'
            ? `${base}--usage-dormant`
            : `${base}--usage-blocked`
  return <span className={`${base} ${modifier}`}>{USAGE_STATUS_LABEL[status]}</span>
}

export function AlimtalkTemplateList() {
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const tableContext = useMemo<AlimtalkTemplateTableContext>(() => ({}), [])
  const remoteEnabled = shouldUseAlimtalkTemplatesRemoteApi()
  const listQuery = useAlimtalkTemplateListQuery(searchParams, true)
  const rows = remoteEnabled ? (listQuery.data ?? []) : ALIMTALK_TEMPLATE_MOCK_ROWS

  const {
    pendingFilters,
    applySearch: handleSearch,
    handleFilterChange,
    displayedCount,
    tableData,
  } = useTablePage(alimtalkTemplateTablePageConfig, {
    data: rows,
    searchParams,
    setSearchParams,
    context: tableContext,
  })

  const handleViewDetail = useCallback(() => {
    showAlert({
      title: '준비 중',
      content: '양식 상세보기 기능은 현재 준비 중입니다.',
    })
  }, [showAlert])

  const columns = useMemo<ColumnsType<AlimtalkTemplateRow>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        className: CMS_TABLE_NO_COL_CLASS,
        width: COL_WIDTH.no,
        align: 'center',
        render: (_: unknown, row: AlimtalkTemplateRow) => row.displayNo,
      },
      {
        title: '카카오 승인 현황',
        key: 'kakaoApprovalStatus',
        width: COL_WIDTH.approvalStatus,
        align: 'center',
        render: (_: unknown, row: AlimtalkTemplateRow) =>
          approvalStatusCell(row.kakaoApprovalStatus),
      },
      {
        title: '템플릿 사용 현황',
        key: 'templateUsageStatus',
        width: COL_WIDTH.usageStatus,
        align: 'center',
        render: (_: unknown, row: AlimtalkTemplateRow) => usageStatusCell(row.templateUsageStatus),
      },
      {
        title: '카카오 채널명',
        dataIndex: 'channelName',
        key: 'channelName',
        width: COL_WIDTH.channelName,
        align: 'center',
      },
      {
        title: '유형',
        key: 'templateType',
        width: COL_WIDTH.templateType,
        align: 'center',
        render: (_: unknown, row: AlimtalkTemplateRow) => TEMPLATE_TYPE_LABEL[row.templateType],
      },
      {
        title: '템플릿명',
        dataIndex: 'templateName',
        key: 'templateName',
        width: COL_WIDTH.templateName,
        ellipsis: { showTitle: true },
      },
      {
        title: '템플릿 내용',
        dataIndex: 'templateContent',
        key: 'templateContent',
        width: COL_WIDTH.templateContent,
        render: (value: string) => (
          <span className="alimtalk-template-list__content" title={value}>
            {value}
          </span>
        ),
      },
      {
        title: '글자 수',
        dataIndex: 'characterCount',
        key: 'characterCount',
        width: COL_WIDTH.characterCount,
        align: 'center',
      },
      {
        title: '최종 등록일',
        key: 'registeredAt',
        width: COL_WIDTH.registeredAt,
        align: 'center',
        render: (_: unknown, row: AlimtalkTemplateRow) =>
          dayjs(row.registeredAt).format('YYYY.MM.DD HH:mm'),
      },
      {
        title: '양식 관리',
        key: 'manage',
        width: COL_WIDTH.manage,
        align: 'center',
        render: () => (
          <CmsButton variant="secondary" type="button" onClick={handleViewDetail}>
            양식 상세보기
          </CmsButton>
        ),
      },
    ],
    [handleViewDetail]
  )

  const listErrorMessage =
    remoteEnabled && listQuery.isError
      ? getNotificationsApiErrorMessage(
          listQuery.error,
          '알림톡 양식 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
        )
      : null

  return (
    <div className="program-list-page">
      <FilterTableLayout
        bordered={false}
        fields={ALIMTALK_TEMPLATE_FILTER_FIELDS}
        filters={{
          kakaoApprovalStatus: pendingFilters.kakaoApprovalStatus,
          templateUsageStatus: pendingFilters.templateUsageStatus,
          channelName: pendingFilters.channelName,
          templateName: pendingFilters.templateName,
          dateRange: pendingFilters.dateRange ?? undefined,
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="카카오 알림톡 양식"
        description={`총 ${displayedCount.toLocaleString()}건`}
      >
        {remoteEnabled && listQuery.isLoading ? (
          <div className="alimtalk-template-list__loading">
            <Spin />
          </div>
        ) : listErrorMessage ? (
          <div className="alimtalk-template-list__error">{listErrorMessage}</div>
        ) : (
          <Table<AlimtalkTemplateRow>
            rowKey="id"
            className="cms-data-table alimtalk-template-list__table"
            tableLayout="fixed"
            scroll={{ x: TABLE_SCROLL_X }}
            columns={columns}
            dataSource={tableData}
            pagination={false}
          />
        )}
      </FilterTableLayout>
    </div>
  )
}
