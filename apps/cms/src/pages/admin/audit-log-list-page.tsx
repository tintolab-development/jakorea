/**
 * 감사 로그 목록 페이지
 * Phase 0.5.4: 감사 로그 UI
 */

import { useState } from 'react'
import { Table, Form, Select, Input, DatePicker, Button, Space, Tag, Card } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAuditLogs } from '@/features/audit-log/hooks/use-audit-logs'
import { AUDIT_EVENT_OPTIONS, AUDIT_EVENT_COLORS } from '@/shared/constants/audit-events'
import type { AuditLog, AuditLogFilters } from '@/types/audit-log'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export function AuditLogListPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    pageSize: 20,
  })

  const { logs, total, page, pageSize, loading, fetchLogs } = useAuditLogs({
    filters,
    autoFetch: true,
  })

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // 필터 변경 시 첫 페이지로
    }))
  }

  const handleSearch = () => {
    fetchLogs(filters)
  }

  const handleReset = () => {
    setFilters({
      page: 1,
      pageSize: 20,
    })
  }

  const handleTableChange = (newPage: number, newPageSize: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
      pageSize: newPageSize,
    }))
  }

  const columns: ColumnsType<AuditLog> = [
    {
      title: '이벤트 유형',
      dataIndex: 'eventType',
      key: 'eventType',
      width: 150,
      render: (eventType: AuditLog['eventType']) => {
        const option = AUDIT_EVENT_OPTIONS.find(opt => opt.value === eventType)
        return (
          <Tag color={AUDIT_EVENT_COLORS[eventType]}>
            {option?.label || eventType}
          </Tag>
        )
      },
    },
    {
      title: '사용자',
      dataIndex: 'userName',
      key: 'userName',
      width: 180,
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
                프로그램 역할: {Object.entries(programRoles).map(([progId, role]) => `${role}`).join(', ')}
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: '대상',
      key: 'target',
      width: 200,
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
      width: 250,
      render: (_: unknown, record: AuditLog) => {
        const detailKeys = Object.keys(record.details)
        if (detailKeys.length === 0) return '-'
        
        // adminLevel과 programRoles는 이미 사용자 컬럼에 표시되므로 제외
        const otherDetails = Object.entries(record.details).filter(
          ([key]) => key !== 'adminLevel' && key !== 'programRoles'
        )
        
        if (otherDetails.length === 0) return '-'
        
        const preview = otherDetails.slice(0, 2).map(([key, value]) => {
          return `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
        }).join(', ')
        
        return (
          <div title={JSON.stringify(record.details, null, 2)}>
            {preview}{otherDetails.length > 2 ? '...' : ''}
          </div>
        )
      },
    },
    {
      title: 'IP 주소',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
    },
    {
      title: '발생 시간',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
      sorter: (a: AuditLog, b: AuditLog) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <h2 style={{ marginBottom: 24 }}>감사 로그</h2>

        <Form layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="이벤트 유형">
            <Select
              value={filters.eventType}
              onChange={(value) => handleFilterChange('eventType', value)}
              placeholder="전체"
              allowClear
              style={{ width: 150 }}
              options={AUDIT_EVENT_OPTIONS}
            />
          </Form.Item>

          <Form.Item label="사용자">
            <Input
              value={filters.userName}
              onChange={(e) => handleFilterChange('userName', e.target.value)}
              placeholder="사용자 이름"
              style={{ width: 150 }}
              allowClear
            />
          </Form.Item>

          <Form.Item label="기간">
            <RangePicker
              value={
                filters.startDate && filters.endDate
                  ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                  : null
              }
              onChange={(dates) => {
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
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                검색
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
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
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}
