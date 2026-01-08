/**
 * 강사 상세 컴포넌트
 * Phase 1.2: 상세 정보 표시
 * 강사단 관리: 강의 진행 및 정산 현황 추가
 */

import { useEffect, useState, useMemo } from 'react'
import { Card, Descriptions, Tag, Space, Button, Table, Tabs, Badge } from 'antd'
import type { Instructor } from '@/types/domain'
import type { Settlement, Matching, Program } from '@/types/domain'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { SettlementDetailDrawer } from '@/features/settlement/ui/settlement-detail-drawer'
import { programService } from '@/entities/program/api/program-service'
import { mockMatchings } from '@/data/mock'
import { getSettlementStatusLabel, getSettlementStatusColor } from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import type { ColumnsType } from 'antd/es/table'

interface InstructorDetailProps {
  instructor: Instructor
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

export function InstructorDetail({ instructor, onEdit, onDelete, loading }: InstructorDetailProps) {
  const { settlements, fetchSettlements, selectedSettlement, setSelectedSettlement } = useSettlementStore()
  const [activeTab, setActiveTab] = useState('info')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  // 강사별 정산 목록
  const instructorSettlements = useMemo(() => {
    return settlements.filter(s => s.instructorId === instructor.id)
  }, [settlements, instructor.id])

  // 강사별 매칭 목록 (프로그램 정보 포함)
  const instructorMatchings = useMemo(() => {
    const allMatchings = mockMatchings
    return allMatchings
      .filter((m: Matching) => m.instructorId === instructor.id)
      .map((m: Matching) => {
        const program = programService.getByIdSync(m.programId)
        return { ...m, program }
      })
      .filter((m): m is Matching & { program: Program } => m.program !== null)
  }, [instructor.id])

  const handleViewSettlement = (settlement: Settlement) => {
    // 정산 상세 Drawer 열기 (정산 > 강사 상세와 동일한 화면)
    setSelectedSettlement(settlement)
    setDrawerOpen(true)
  }

  const settlementColumns: ColumnsType<Settlement> = [
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
        <Button type="link" onClick={() => handleViewSettlement(record)}>
          상세 보기
        </Button>
      ),
    },
  ]

  const matchingColumns: ColumnsType<Matching & { program: Program }> = [
    {
      title: '프로그램',
      dataIndex: ['program', 'title'],
      key: 'program',
      render: (_: unknown, record: Matching & { program: Program }) => (
        <Tag color={domainColorsHex.program.primary}>{record.program.title}</Tag>
      ),
    },
    {
      title: '매칭일',
      dataIndex: 'matchedAt',
      key: 'matchedAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag>{status}</Tag>,
    },
  ]

  const tabItems = [
    {
      key: 'info',
      label: '기본 정보',
      children: (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="연락처">{instructor.contactPhone}</Descriptions.Item>
          <Descriptions.Item label="이메일">{instructor.contactEmail || '-'}</Descriptions.Item>
          <Descriptions.Item label="지역">{instructor.region}</Descriptions.Item>
          <Descriptions.Item label="전문분야">
            <Space wrap>
              {instructor.specialty.map(s => (
                <Tag key={s}>{s}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
          {instructor.availableTime && (
            <Descriptions.Item label="가능 시간">{instructor.availableTime}</Descriptions.Item>
          )}
          {instructor.experience && <Descriptions.Item label="이력">{instructor.experience}</Descriptions.Item>}
          {instructor.rating && (
            <Descriptions.Item label="평점">{instructor.rating.toFixed(1)}/5.0</Descriptions.Item>
          )}
          {instructor.bankAccount && (
            <Descriptions.Item label="계좌번호">
              {instructor.bankAccount.replace(/(\d{4})(\d{4})(\d+)/, '$1-****-****')}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="등록일">
            {new Date(instructor.createdAt).toLocaleDateString('ko-KR')}
          </Descriptions.Item>
          <Descriptions.Item label="수정일">
            {new Date(instructor.updatedAt).toLocaleDateString('ko-KR')}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'programs',
      label: `강의 진행 (${instructorMatchings.length})`,
      children: (
        <Table
          dataSource={instructorMatchings}
          columns={matchingColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'settlements',
      label: `정산 현황 (${instructorSettlements.length})`,
      children: (
        <Table
          dataSource={instructorSettlements}
          columns={settlementColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => handleViewSettlement(record),
            style: { cursor: 'pointer' },
          })}
        />
      ),
    },
  ]

  return (
    <Card
      title={instructor.name}
      extra={
        <Space>
          <Button onClick={onEdit}>수정</Button>
          <Button danger onClick={onDelete} loading={loading}>
            삭제
          </Button>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      
      <SettlementDetailDrawer
        open={drawerOpen}
        settlement={selectedSettlement}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedSettlement(null)
        }}
        onEdit={() => {
          if (selectedSettlement) {
            // 정산 수정 페이지로 이동
            window.location.href = `/settlements/${selectedSettlement.id}/edit`
          }
        }}
        onDelete={() => {}}
        onStatusChange={async (status) => {
          if (selectedSettlement) {
            const { updateStatus } = useSettlementStore.getState()
            await updateStatus(selectedSettlement.id, status)
            fetchSettlements()
          }
        }}
        loading={loading}
      />
    </Card>
  )
}








