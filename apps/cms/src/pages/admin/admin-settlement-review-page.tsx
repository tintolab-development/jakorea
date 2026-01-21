/**
 * 관리자 정산 검토 목록 페이지
 * Phase 0.4.2: 관리자 정산 검토
 * - /admin/settlements: 정산 검토 목록
 */

import { useEffect, useState, useMemo } from 'react'
import { Card, Space, Table, Button, Badge, Tag, message, Input, Select } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { SettlementDetailReviewDrawer } from '@/features/settlement/ui/settlement-detail-review-drawer'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { getSettlementStatusLabel, getSettlementStatusColor } from '@/shared/constants/status'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { domainColorsHex } from '@/shared/constants/colors'
import { useSettlementReviewList } from '@/features/settlement/hooks/use-settlement-review-list'
import type { Settlement } from '@/types/domain'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input

export function AdminSettlementReviewPage() {
  const location = useLocation()
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '정산 관리'
  
  const { settlements, loading, fetchSettlements, selectedSettlement, setSelectedSettlement } = useSettlementStore()
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
    onView: (settlement) => {
      setSelectedSettlement(settlement)
      setDrawerOpen(true)
    },
    onApprove: async (settlement) => {
      try {
        await approveSettlement(settlement)
        message.success('정산이 승인되었습니다')
        await fetchSettlements()
        setDrawerOpen(false)
      } catch (e) {
        console.error('Failed to approve settlement:', e)
        message.error('승인 처리 중 오류가 발생했습니다')
      }
    },
    onReject: async (settlement) => {
      try {
        await rejectSettlement(settlement)
        message.success('정산이 반려되었습니다')
        await fetchSettlements()
        setDrawerOpen(false)
      } catch (e) {
        console.error('Failed to reject settlement:', e)
        message.error('반려 처리 중 오류가 발생했습니다')
      }
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
        const program = programService.getByIdSync(s.programId)
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
        const program = programService.getByIdSync(programId)
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
        <Badge status={getSettlementStatusColor(status) as any} text={getSettlementStatusLabel(status)} />
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
            onClick={(e) => {
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
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Search
                placeholder="프로그램명, 강사명, 기간 검색"
                allowClear
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={(value) => setSearchText(value)}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
              >
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
            onRow={(record) => ({
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
        onApprove={async (settlement) => {
          try {
            await approveSettlement(settlement)
            message.success('정산이 승인되었습니다')
            await fetchSettlements()
            setDrawerOpen(false)
          } catch (e) {
            console.error('Failed to approve settlement:', e)
            message.error('승인 처리 중 오류가 발생했습니다')
          }
        }}
        onReject={async (settlement) => {
          try {
            await rejectSettlement(settlement)
            message.success('정산이 반려되었습니다')
            await fetchSettlements()
            setDrawerOpen(false)
          } catch (e) {
            console.error('Failed to reject settlement:', e)
            message.error('반려 처리 중 오류가 발생했습니다')
          }
        }}
        loading={loading}
      />
    </div>
  )
}
