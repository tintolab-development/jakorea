/**
 * 감사 로그 목록 페이지
 * Phase 0.5.4: 감사 로그 UI
 */

import { useMemo } from 'react'
import { Table, Form, Select, DatePicker, Button, Space, Tag, Card } from 'antd'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAuditLogs } from '@/features/audit-log/hooks/use-audit-logs'
import { AUDIT_EVENT_OPTIONS, AUDIT_EVENT_COLORS } from '@/shared/constants/audit-events'
import type { AuditLog, AuditLogFilters } from '@/types/audit-log'
import type { ColumnsType } from 'antd/es/table'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { PAGINATION_CONFIG, LAYOUT_CONSTANTS } from '@/shared/constants'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface AuditLogQueryParams extends Record<string, string | undefined> {
  page?: string
  pageSize?: string
  eventType?: string
  userName?: string
  startDate?: string
  endDate?: string
}

export function AuditLogListPage() {
  const { params, setParams, setParam } = useQueryParams<AuditLogQueryParams>()

  // URL 파라미터에서 필터 값 읽기
  const filters = useMemo<AuditLogFilters>(
    () => ({
      page: params.page ? parseInt(params.page, 10) : 1,
      pageSize: params.pageSize ? parseInt(params.pageSize, 10) : PAGINATION_CONFIG.defaultPageSize,
      eventType: params.eventType ? (params.eventType as AuditLog['eventType']) : undefined,
      userName: params.userName || undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
    }),
    [params]
  )

  const { logs, total, page, pageSize, loading, fetchLogs } = useAuditLogs({
    filters,
    autoFetch: true,
  })

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    if (key === 'page' || key === 'pageSize') {
      setParam(key, value ? String(value) : undefined)
    } else {
      setParam(key, value || undefined)
    }
    // 필터 변경 시 첫 페이지로
    if (key !== 'page' && key !== 'pageSize') {
      setParam('page', '1')
    }
  }

  const handleSearch = () => {
    fetchLogs(filters)
  }

  const handleReset = () => {
    setParams({
      page: '1',
      pageSize: String(PAGINATION_CONFIG.defaultPageSize),
      eventType: undefined,
      userName: undefined,
      startDate: undefined,
      endDate: undefined,
    })
  }

  const handleTableChange = (newPage: number, newPageSize: number) => {
    setParam('page', String(newPage))
    setParam('pageSize', String(newPageSize))
  }

  const columns: ColumnsType<AuditLog> = [
    {
      title: '이벤트 유형',
      dataIndex: 'eventType',
      key: 'eventType',
      width: LAYOUT_CONSTANTS.widths.filter,
      render: (eventType: AuditLog['eventType']) => {
        const option = AUDIT_EVENT_OPTIONS.find(opt => opt.value === eventType)
        return <Tag color={AUDIT_EVENT_COLORS[eventType]}>{option?.label || eventType}</Tag>
      },
    },
    {
      title: '사용자',
      dataIndex: 'userName',
      key: 'userName',
      width: LAYOUT_CONSTANTS.widths.search,
      render: (userName: string, record: AuditLog) => {
        const adminLevel = record.details?.adminLevel as string | undefined
        const programRoles = record.details?.programRoles as Record<string, string> | undefined

        return (
          <div>
            <div>{userName}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.userRole}</div>
            {adminLevel && (
              <div style={{ fontSize: '11px', color: '#1890ff', marginTop: 2 }}>
                관리자 레벨: {adminLevel}
              </div>
            )}
            {programRoles && Object.keys(programRoles).length > 0 && (
              <div style={{ fontSize: '11px', color: '#52c41a', marginTop: 2 }}>
                프로그램 역할:{' '}
                {Object.entries(programRoles)
                  .map(([, role]) => `${role}`)
                  .join(', ')}
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: '대상',
      key: 'target',
      width: LAYOUT_CONSTANTS.widths.search,
      render: (_: unknown, record: AuditLog) => {
        if (!record.targetName) return '-'
        return (
          <div>
            <div>{record.targetName}</div>
            {record.targetType && (
              <div style={{ fontSize: '12px', color: '#999' }}>{record.targetType}</div>
            )}
          </div>
        )
      },
    },
    {
      title: '상세 정보',
      key: 'details',
      ellipsis: true,
      width: LAYOUT_CONSTANTS.widths.search,
      render: (_: unknown, record: AuditLog) => {
        const detailKeys = Object.keys(record.details)
        if (detailKeys.length === 0) return '-'

        // adminLevel과 programRoles는 이미 사용자 컬럼에 표시되므로 제외
        const otherDetails = Object.entries(record.details).filter(
          ([key]) => key !== 'adminLevel' && key !== 'programRoles'
        )

        if (otherDetails.length === 0) return '-'

        const preview = otherDetails
          .slice(0, 2)
          .map(([key, value]) => {
            return `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
          })
          .join(', ')

        return (
          <div title={JSON.stringify(record.details, null, 2)}>
            {preview}
            {otherDetails.length > 2 ? '...' : ''}
          </div>
        )
      },
    },
    {
      title: 'IP 주소',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: LAYOUT_CONSTANTS.widths.status,
    },
    {
      title: '발생 시간',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: LAYOUT_CONSTANTS.widths.search,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
      sorter: (a: AuditLog, b: AuditLog) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ]

  return (
    <div style={{ padding: LAYOUT_CONSTANTS.margins.xl }}>
      <Card>
        <h2 style={{ marginBottom: LAYOUT_CONSTANTS.margins.xl }}>감사 로그</h2>

        <Form layout="inline" style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg }}>
          <Form.Item label="이벤트 유형">
            <Select
              value={filters.eventType}
              onChange={value => handleFilterChange('eventType', value)}
              placeholder="전체"
              allowClear
              style={{ width: LAYOUT_CONSTANTS.widths.filter }}
              options={AUDIT_EVENT_OPTIONS}
            />
          </Form.Item>

          <Form.Item>
            <LabeledSearchInput
              label="사용자"
              placeholder="사용자 이름을 입력하세요"
              value={filters.userName || ''}
              onChange={value => handleFilterChange('userName', value || undefined)}
              width={LAYOUT_CONSTANTS.widths.filter}
            />
          </Form.Item>

          <Form.Item label="기간">
            <RangePicker
              value={
                filters.startDate && filters.endDate
                  ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                  : null
              }
              onChange={dates => {
                if (dates && dates[0] && dates[1]) {
                  handleFilterChange('startDate', dates[0].toISOString())
                  handleFilterChange('endDate', dates[1].toISOString())
                } else {
                  handleFilterChange('startDate', undefined)
                  handleFilterChange('endDate', undefined)
                }
              }}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                검색
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                초기화
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: PAGINATION_CONFIG.showSizeChanger,
            pageSizeOptions: PAGINATION_CONFIG.pageSizeOptions,
            showTotal: PAGINATION_CONFIG.showTotal,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}
