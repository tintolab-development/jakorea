/**
 * 신청 상세 Drawer 컴포넌트
 * Phase 2.2: 사이드 패널로 상세 정보 표시 (Ant Design 컴포넌트 다양하게 활용)
 */

import { Drawer, Descriptions, Tag, Tabs, Space, Button, Badge, Timeline, Alert, Typography, Divider } from 'antd'
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { Application } from '@/types/domain'
import { mockProgramsMap, mockSchoolsMap, mockInstructorsMap } from '@/data/mock'

const { TabPane } = Tabs
const { Text, Title } = Typography

interface ApplicationDetailDrawerProps {
  open: boolean
  application: Application | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Application['status']) => void
  loading?: boolean
}

const subjectTypeLabels: Record<string, string> = {
  school: '학교',
  student: '학생',
  instructor: '강사',
}

const subjectTypeColors: Record<string, string> = {
  school: 'cyan',
  student: 'blue',
  instructor: 'purple',
}

const statusLabels: Record<string, string> = {
  submitted: '접수',
  reviewing: '검토',
  approved: '확정',
  rejected: '거절',
  cancelled: '취소',
}

const statusColors: Record<string, string> = {
  submitted: 'default',
  reviewing: 'processing',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
}

export function ApplicationDetailDrawer({
  open,
  application,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  loading,
}: ApplicationDetailDrawerProps) {
  if (!application) return null

  const program = mockProgramsMap.get(application.programId)
  const subjectName =
    application.subjectType === 'school'
      ? mockSchoolsMap.get(application.subjectId)?.name
      : application.subjectType === 'instructor'
      ? mockInstructorsMap.get(application.subjectId)?.name
      : '-'

  const timelineItems = [
    {
      color: 'blue',
      children: (
        <div>
          <Text strong>접수</Text>
          <br />
          <Text type="secondary">{new Date(application.submittedAt).toLocaleString('ko-KR')}</Text>
        </div>
      ),
    },
    ...(application.reviewedAt
      ? [
          {
            color: application.status === 'approved' ? 'green' : application.status === 'rejected' ? 'red' : 'orange',
            children: (
              <div>
                <Text strong>{statusLabels[application.status]}</Text>
                <br />
                <Text type="secondary">{new Date(application.reviewedAt).toLocaleString('ko-KR')}</Text>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <Drawer
      title={
        <Space>
          <Badge status={statusColors[application.status] as any} />
          <Title level={4} style={{ margin: 0 }}>
            신청 상세
          </Title>
        </Space>
      }
      width={720}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          {application.status === 'submitted' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onStatusChange('reviewing')}
              loading={loading}
            >
              검토 시작
            </Button>
          )}
          {application.status === 'reviewing' && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => onStatusChange('approved')}
                loading={loading}
              >
                확정
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => onStatusChange('rejected')}
                loading={loading}
              >
                거절
              </Button>
            </>
          )}
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
          <Alert
            message={`현재 상태: ${statusLabels[application.status]}`}
            type={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'error' : 'info'}
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Descriptions column={1} bordered>
            <Descriptions.Item label="프로그램">
              <Tag color="blue">{program?.title || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="신청 주체 유형">
              <Tag color={subjectTypeColors[application.subjectType]}>
                {subjectTypeLabels[application.subjectType]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="신청 주체">
              <Text strong>{subjectName || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="상태">
              <Badge status={statusColors[application.status] as any} text={statusLabels[application.status]} />
            </Descriptions.Item>
            {application.notes && (
              <Descriptions.Item label="비고">
                <Text>{application.notes}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="접수일">
              {new Date(application.submittedAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
            {application.reviewedAt && (
              <Descriptions.Item label="검토일">
                {new Date(application.reviewedAt).toLocaleString('ko-KR')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="등록일">
              {new Date(application.createdAt).toLocaleDateString('ko-KR')}
            </Descriptions.Item>
            <Descriptions.Item label="수정일">
              {new Date(application.updatedAt).toLocaleDateString('ko-KR')}
            </Descriptions.Item>
          </Descriptions>
        </TabPane>
        <TabPane tab="상태 이력" key="timeline">
          <Divider orientation="left">처리 이력</Divider>
          <Timeline items={timelineItems} />
        </TabPane>
      </Tabs>
    </Drawer>
  )
}




