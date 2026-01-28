/**
 * 관리자 정산 검토 목록 페이지
 * Phase 0.4.2: 관리자 정산 검토
 * - /admin/settlements: 정산 검토 목록
 */

import { useEffect, useState, useMemo } from 'react'
import { Card, Space, Table, Button, Tag, message, Select } from 'antd'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import { EyeOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { SettlementDetailReviewDrawer } from '@/features/settlement/ui/settlement-detail-review-drawer'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { settlementStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { MESSAGES } from '@/shared/constants'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { domainColorsHex } from '@/shared/constants/colors'
import { useSettlementReviewList } from '@/features/settlement/hooks/use-settlement-review-list'
import { withErrorHandling } from '@/shared/utils/error-handler'
import type { Settlement } from '@/types/domain'
import type { ColumnsType } from 'antd/es/table'

export function AdminSettlementReviewPage() {
  const location = useLocation()
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '정산 관리'
  const { getByIdSync: getProgramByIdSync } = useProgramService()

  const { settlements, loading, fetchSettlements, selectedSettlement, setSelectedSettlement } =
    useSettlementStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const {
    reviewSettlements,
    handleApprove: approveSettlement,
    handleReject: rejectSettlement,
    handleView,
  } = useSettlementReviewList({
    settlements,
    onView: settlement => {
      setSelectedSettlement(settlement)
      setDrawerOpen(true)
    },
    onApprove: async settlement => {
      await withErrorHandling(() => approveSettlement(settlement), {
        successMessage: MESSAGES.success.settlementApproved,
        errorMessage: MESSAGES.error.approvalProcessFailed,
        context: 'AdminSettlementReviewPage.onApprove',
        onSuccess: async () => {
          await fetchSettlements()
          setDrawerOpen(false)
        },
      })
    },
    onReject: async settlement => {
      await withErrorHandling(() => rejectSettlement(settlement), {
        successMessage: MESSAGES.success.settlementRejected,
        errorMessage: MESSAGES.error.rejectionProcessFailed,
        context: 'AdminSettlementReviewPage.onReject',
        onSuccess: async () => {
          await fetchSettlements()
          setDrawerOpen(false)
        },
      })
    },
  })

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  // 필터링된 정산 목록
  const filteredSettlements = useMemo(() => {
    let filtered = reviewSettlements

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    // 검색 필터
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(s => {
        const program = getProgramByIdSync(s.programId)
        const instructorName = instructorService.getNameById(s.instructorId)
        return (
          program?.title.toLowerCase().includes(searchLower) ||
          instructorName.toLowerCase().includes(searchLower) ||
          s.period.includes(searchText)
        )
      })
    }

    return filtered
  }, [reviewSettlements, statusFilter, searchText])

  const columns: ColumnsType<Settlement> = [
    {
      title: '기간',
      dataIndex: 'period',
      key: 'period',
      width: 120,
      render: (period: string) => <Tag color="geekblue">{period}</Tag>,
    },
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      width: 200,
      render: (programId: string) => {
        const program = getProgramByIdSync(programId)
        return program ? (
          <Tag color={domainColorsHex.program.primary}>{program.title}</Tag>
        ) : (
          <Tag color="error">프로그램 정보 오류</Tag>
        )
      },
    },
    {
      title: '강사',
      dataIndex: 'instructorId',
      key: 'instructorId',
      width: 120,
      render: (instructorId: string) => {
        return instructorService.getNameById(instructorId)
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Settlement['status']) => (
        <StatusBadge status={status} statusConfig={settlementStatusStatusConfig} variant="badge" />
      ),
    },
    {
      title: '총액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
    },
    {
      title: '증빙자료',
      key: 'attachments',
      width: 100,
      render: (_: unknown, record: Settlement) => {
        const hasAttachments = record.attachments && record.attachments.length > 0
        return hasAttachments ? (
          <Tag color="green">{record.attachments!.length}개</Tag>
        ) : (
          <Tag color="default">없음</Tag>
        )
      },
    },
    {
      title: '작업',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: Settlement) => (
        <Space>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={e => {
              e.stopPropagation()
              handleView(record)
            }}
          >
            상세
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
      </Space>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
            <Space>
              <LabeledSearchInput
                label="프로그램명/강사명/기간"
                placeholder="프로그램명, 강사명, 기간을 입력하세요"
                value={searchText}
                onChange={setSearchText}
                width={350}
              />
              <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
                <Select.Option value="all">전체 상태</Select.Option>
                <Select.Option value="pending">대기</Select.Option>
                <Select.Option value="calculated">산출 완료</Select.Option>
                <Select.Option value="review">검토</Select.Option>
                <Select.Option value="approved">승인</Select.Option>
              </Select>
            </Space>
            <div>
              <Tag color="blue">총 {filteredSettlements.length}건</Tag>
            </div>
          </Space>

          <Table
            dataSource={filteredSettlements}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: total => `총 ${total}개`,
            }}
            onRow={record => ({
              onClick: () => handleView(record),
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: 1000 }}
          />
        </Space>
      </Card>

      <SettlementDetailReviewDrawer
        open={drawerOpen}
        settlement={selectedSettlement}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedSettlement(null)
        }}
        onApprove={async settlement => {
          await withErrorHandling(() => approveSettlement(settlement), {
            successMessage: MESSAGES.success.settlementApproved,
            errorMessage: MESSAGES.error.approvalProcessFailed,
            context: 'AdminSettlementReviewPage.drawer.onApprove',
            onSuccess: async () => {
              await fetchSettlements()
              setDrawerOpen(false)
            },
          })
        }}
        onReject={async settlement => {
          await withErrorHandling(() => rejectSettlement(settlement), {
            successMessage: MESSAGES.success.settlementRejected,
            errorMessage: MESSAGES.error.rejectionProcessFailed,
            context: 'AdminSettlementReviewPage.drawer.onReject',
            onSuccess: async () => {
              await fetchSettlements()
              setDrawerOpen(false)
            },
          })
        }}
        onUpdate={async updatedSettlement => {
          // Phase 0.4.2: 금액 조정 후 목록 새로고침
          await fetchSettlements()
          // 선택된 정산도 업데이트
          setSelectedSettlement(updatedSettlement)
        }}
        loading={loading}
      />
    </div>
  )
}
