/**
 * 권한 요청 목록 페이지 (마스터용)
 * Phase 0.5.2: 권한 요청 UX
 */

import { useState } from 'react'
import { Table, Button, Space, Tag, Select, Card } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { usePermissionRequests } from '@/features/permission-request/hooks/use-permission-requests'
import { PermissionRequestReviewModal } from '@/features/permission-request/ui/permission-request-review-modal'
import type { PermissionRequest, ReviewPermissionRequestInput } from '@/types/permission-request'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select

const statusLabels: Record<PermissionRequest['status'], string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거부',
}

const statusColors: Record<PermissionRequest['status'], string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
}

const actionLabels: Record<PermissionRequest['requestedAction'], string> = {
  VIEW: '조회',
  DOWNLOAD: '다운로드',
  EDIT: '수정',
}

const roleLabels: Record<PermissionRequest['requestedRole'], string> = {
  OWNER: '소유자',
  PARTNER: '파트너',
  ASSISTANT: '어시스턴트',
}

export function PermissionRequestListPage() {
  const [statusFilter, setStatusFilter] = useState<PermissionRequest['status'] | 'ALL'>('ALL')
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  const { requests, loading, approveRequest, rejectRequest, pendingCount } = usePermissionRequests({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  const handleApprove = async (input: ReviewPermissionRequestInput) => {
    await approveRequest(input)
    setReviewModalOpen(false)
    setSelectedRequest(null)
  }

  const handleReject = async (input: ReviewPermissionRequestInput) => {
    await rejectRequest(input)
    setReviewModalOpen(false)
    setSelectedRequest(null)
  }

  const handleReview = (request: PermissionRequest) => {
    setSelectedRequest(request)
    setReviewModalOpen(true)
  }

  const columns: ColumnsType<PermissionRequest> = [
    {
      title: '요청자',
      dataIndex: 'requesterName',
      key: 'requesterName',
      width: 120,
    },
    {
      title: '프로그램',
      dataIndex: 'programName',
      key: 'programName',
      ellipsis: true,
    },
    {
      title: '요청 역할',
      dataIndex: 'requestedRole',
      key: 'requestedRole',
      width: 100,
      render: (role: PermissionRequest['requestedRole']) => roleLabels[role],
    },
    {
      title: '요청 권한',
      dataIndex: 'requestedAction',
      key: 'requestedAction',
      width: 100,
      render: (action: PermissionRequest['requestedAction']) => actionLabels[action],
    },
    {
      title: '요청 사유',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PermissionRequest['status']) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '요청일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '액션',
      key: 'action',
      width: 150,
      render: (_: unknown, record: PermissionRequest) => {
        if (record.status !== 'PENDING') {
          return (
            <span style={{ color: '#999' }}>
              {record.reviewedByName} ({new Date(record.reviewedAt || '').toLocaleDateString('ko-KR')})
            </span>
          )
        }

        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleReview(record)}
            >
              검토
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>
            권한 요청 관리
            {pendingCount > 0 && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                대기: {pendingCount}건
              </Tag>
            )}
          </h2>

          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            style={{ width: 150 }}
          >
            <Option value="ALL">전체</Option>
            <Option value="PENDING">대기</Option>
            <Option value="APPROVED">승인</Option>
            <Option value="REJECTED">거부</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={requests}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
          }}
        />
      </Card>

      {selectedRequest && (
        <PermissionRequestReviewModal
          open={reviewModalOpen}
          request={selectedRequest}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={() => {
            setReviewModalOpen(false)
            setSelectedRequest(null)
          }}
        />
      )}
    </div>
  )
}
