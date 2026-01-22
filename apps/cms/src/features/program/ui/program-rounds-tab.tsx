/**
 * 프로그램 회차 정보 탭
 */

import { Table, Tag } from 'antd'
import type { Program } from '@/types/domain'
import {
  getCommonStatusLabel,
  getCommonStatusColor,
} from '@/shared/constants/status'

interface ProgramRoundsTabProps {
  rounds: Program['rounds']
}

export function ProgramRoundsTab({ rounds }: ProgramRoundsTabProps) {
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
        <Tag color={getCommonStatusColor(status)}>{getCommonStatusLabel(status)}</Tag>
      ),
    },
  ]

  return (
    <Table
      dataSource={rounds || []}
      columns={roundColumns}
      rowKey="id"
      pagination={false}
      size="small"
    />
  )
}
