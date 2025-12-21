/**
 * 매칭 목록 컴포넌트
 * Phase 3.2: 프로그램별 매칭 현황
 */

import { Table, Tag, Space, Button, Select, Tooltip } from 'antd'
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { Matching } from '@/types/domain'
import { mockProgramsMap, mockInstructorsMap, mockSchedulesMap } from '@/data/mock'
import dayjs from 'dayjs'

const { Option } = Select

interface MatchingListProps {
  matchings: Matching[]
  loading?: boolean
  selectedProgramId?: string
  onProgramChange?: (programId: string) => void
  onView: (matching: Matching) => void
  onConfirm: (matching: Matching) => void
  onCancel: (matching: Matching) => void
}

const statusLabels: Record<string, string> = {
  active: '확정',
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

export function MatchingList({
  matchings,
  loading,
  selectedProgramId,
  onProgramChange,
  onView,
  onConfirm,
  onCancel,
}: MatchingListProps) {
  const programs = Array.from(mockProgramsMap.values())

  const columns = [
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = mockProgramsMap.get(programId)
        return program ? (
          <Tooltip title={program.description}>
            <span style={{ fontWeight: 500 }}>{program.title}</span>
          </Tooltip>
        ) : (
          '-'
        )
      },
    },
    {
      title: '강사',
      dataIndex: 'instructorId',
      key: 'instructorId',
      render: (instructorId: string) => {
        const instructor = mockInstructorsMap.get(instructorId)
        return instructor ? (
          <Space>
            <span>{instructor.name}</span>
            <Tag color="blue">{instructor.region}</Tag>
          </Space>
        ) : (
          '-'
        )
      },
    },
    {
      title: '일정',
      dataIndex: 'scheduleId',
      key: 'scheduleId',
      render: (scheduleId: string | undefined) => {
        if (!scheduleId) return '-'
        const schedule = mockSchedulesMap.get(scheduleId)
        return schedule ? (
          <Space direction="vertical" size="small">
            <span>{schedule.title}</span>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
              {typeof schedule.date === 'string' ? schedule.date : dayjs(schedule.date).format('YYYY-MM-DD')} {schedule.startTime} - {schedule.endTime}
            </span>
          </Space>
        ) : (
          '-'
        )
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{statusLabels[status] || status}</Tag>
      ),
    },
    {
      title: '매칭일',
      dataIndex: 'matchedAt',
      key: 'matchedAt',
      render: (matchedAt: string | Date) => {
        return <span>{dayjs(matchedAt).format('YYYY-MM-DD HH:mm')}</span>
      },
    },
    {
      title: '작업',
      key: 'action',
      render: (_: unknown, record: Matching) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={e => {
              e.stopPropagation()
              onView(record)
            }}
          >
            상세
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  onConfirm(record)
                }}
              >
                확정
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  onCancel(record)
                }}
              >
                취소
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const filteredMatchings = selectedProgramId
    ? matchings.filter(m => m.programId === selectedProgramId)
    : matchings

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <span>프로그램 필터:</span>
        <Select
          value={selectedProgramId || undefined}
          onChange={onProgramChange}
          allowClear
          placeholder="전체 프로그램"
          style={{ width: 300 }}
        >
          {programs.map(program => (
            <Option key={program.id} value={program.id}>
              {program.title}
            </Option>
          ))}
        </Select>
      </Space>

      <Table
        dataSource={filteredMatchings}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
        }}
        onRow={record => ({
          onClick: () => onView(record),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}

