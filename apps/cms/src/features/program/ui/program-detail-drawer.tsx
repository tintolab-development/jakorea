/**
 * 프로그램 상세 Drawer 컴포넌트
 * Phase 2.1: 사이드 패널로 상세 정보 표시 (기획자 요청)
 */

import { Drawer, Descriptions, Tag, Tabs, Table, Space, Button, Badge } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import { mockSponsorsMap } from '@/data/mock'

const { TabPane } = Tabs

interface ProgramDetailDrawerProps {
  open: boolean
  program: Program | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

const programTypeLabels: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '하이브리드',
}

const programFormatLabels: Record<string, string> = {
  workshop: '워크샵',
  seminar: '세미나',
  course: '과정',
  lecture: '강의',
  other: '기타',
}

const statusLabels: Record<string, string> = {
  active: '활성',
  pending: '대기',
  inactive: '비활성',
  completed: '완료',
  cancelled: '취소',
}

const statusColors: Record<string, string> = {
  active: 'green',
  pending: 'orange',
  inactive: 'default',
  completed: 'blue',
  cancelled: 'red',
}

export function ProgramDetailDrawer({
  open,
  program,
  onClose,
  onEdit,
  onDelete,
  loading,
}: ProgramDetailDrawerProps) {
  if (!program) return null

  const sponsor = mockSponsorsMap.get(program.sponsorId)

  const roundColumns = [
    {
      title: '회차',
      dataIndex: 'roundNumber',
      key: 'roundNumber',
    },
    {
      title: '시작일',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '종료일',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '정원',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity?: number) => capacity || '-',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
      ),
    },
  ]

  return (
    <Drawer
      title={
        <Space>
          <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
            {program.title}
          </Tag>
          <Badge status={program.status === 'active' ? 'success' : 'default'} />
        </Space>
      }
      width={720}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={onEdit}>
            수정
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={onDelete} loading={loading}>
            삭제
          </Button>
        </Space>
      }
    >
      <Tabs defaultActiveKey="basic">
        <TabPane tab="기본 정보" key="basic">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="프로그램명">{program.title}</Descriptions.Item>
            <Descriptions.Item label="스폰서">
              <Tag color="orange">{sponsor?.name || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="유형">
              <Tag>{programTypeLabels[program.type] || program.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="형태">
              {programFormatLabels[program.format] || program.format}
            </Descriptions.Item>
            <Descriptions.Item label="상태">
              <Tag color={statusColors[program.status]}>{statusLabels[program.status]}</Tag>
            </Descriptions.Item>
            {program.description && (
              <Descriptions.Item label="설명">{program.description}</Descriptions.Item>
            )}
            <Descriptions.Item label="시작일">
              {new Date(program.startDate).toLocaleDateString('ko-KR')}
            </Descriptions.Item>
            <Descriptions.Item label="종료일">
              {new Date(program.endDate).toLocaleDateString('ko-KR')}
            </Descriptions.Item>
            <Descriptions.Item label="등록일">
              {new Date(program.createdAt).toLocaleDateString('ko-KR')}
            </Descriptions.Item>
            <Descriptions.Item label="수정일">
              {new Date(program.updatedAt).toLocaleDateString('ko-KR')}
            </Descriptions.Item>
          </Descriptions>
        </TabPane>
        <TabPane tab={`회차 정보 (${program.rounds.length})`} key="rounds">
          <Table
            dataSource={program.rounds}
            columns={roundColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </TabPane>
      </Tabs>
    </Drawer>
  )
}

