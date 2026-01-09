/**
 * 정산 신청 대기 페이지
 * 강사단 관리 > 정산 > 정산 신청 대기
 * 해당 단계에서 지급조서 작성 가능
 */

import { useEffect, useState, useMemo } from 'react'
import { Card, Space, Table, Button, Badge, Tag, message } from 'antd'
import { DownloadOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { SettlementDetailDrawer } from '@/features/settlement/ui/settlement-detail-drawer'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { getSettlementStatusLabel, getSettlementStatusColor } from '@/shared/constants/status'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { generatePaymentStatement } from '@/shared/utils/settlement-document'
import { domainColorsHex } from '@/shared/constants/colors'
import type { Settlement } from '@/types/domain'
import type { ColumnsType } from 'antd/es/table'

export function SettlementPendingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강사단 관리'
  
  const { settlements, loading, fetchSettlements, selectedSettlement, setSelectedSettlement, updateStatus } = useSettlementStore()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  // pending 상태의 정산만 필터링
  const pendingSettlements = useMemo(() => {
    return settlements.filter(s => s.status === 'pending')
  }, [settlements])

  const handleView = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setDrawerOpen(true)
  }

  const handleEdit = (settlement: Settlement) => {
    navigate(`/settlements/${settlement.id}/edit`)
  }

  const handleCreatePaymentStatement = async (settlement: Settlement) => {
    const program = programService.getByIdSync(settlement.programId)
    const instructor = instructorService.getByIdSync(settlement.instructorId)

    if (!program || !instructor) {
      message.error('프로그램 또는 강사 정보를 찾을 수 없습니다')
      return
    }

    try {
      await generatePaymentStatement(settlement, instructor, program.title)
      message.success('지급조서가 생성되었습니다')
      // 지급조서 작성 후 산출 완료 상태로 변경
      await updateStatus(settlement.id, 'calculated')
      message.success('상태가 산출 완료로 변경되었습니다')
      fetchSettlements()
    } catch (error) {
      console.error('Failed to generate payment statement:', error)
      message.error('지급조서 생성 중 오류가 발생했습니다')
    }
  }

  const handleStatusChange = async (status: Settlement['status']) => {
    if (!selectedSettlement) return
    try {
      await updateStatus(selectedSettlement.id, status)
      message.success(`상태가 "${getSettlementStatusLabel(status)}"로 변경되었습니다`)
      fetchSettlements()
      setDrawerOpen(false)
    } catch (e) {
      console.error('Failed to change status:', e)
      message.error('상태 변경 중 오류가 발생했습니다')
    }
  }

  const columns: ColumnsType<Settlement> = [
    {
      title: '기간',
      dataIndex: 'period',
      key: 'period',
      render: (period: string) => <Tag color="geekblue">{period}</Tag>,
    },
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
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
      render: (instructorId: string) => {
        return instructorService.getNameById(instructorId)
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: Settlement['status']) => (
        <Badge status={getSettlementStatusColor(status) as any} text={getSettlementStatusLabel(status)} />
      ),
    },
    {
      title: '총액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
    },
    {
      title: '작업',
      key: 'action',
      render: (_: unknown, record: Settlement) => (
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleCreatePaymentStatement(record)
            }}
          >
            지급조서 작성
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(record)
            }}
          >
            수정
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

      <Card title={`정산 신청 대기 (${pendingSettlements.length}건)`}>
        <Table
          dataSource={pendingSettlements}
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
        />
      </Card>

      <SettlementDetailDrawer
        open={drawerOpen}
        settlement={selectedSettlement}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedSettlement(null)
        }}
        onEdit={() => {
          if (selectedSettlement) {
            handleEdit(selectedSettlement)
          }
        }}
        onDelete={() => {
          // 삭제 기능은 상위 페이지에서 처리
        }}
        onStatusChange={handleStatusChange}
        loading={loading}
      />
    </div>
  )
}
