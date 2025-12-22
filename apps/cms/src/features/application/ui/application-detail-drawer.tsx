/**
 * 신청 상세 Drawer 컴포넌트
 * Phase 2.2: 사이드 패널로 상세 정보 표시 (Ant Design 컴포넌트 다양하게 활용)
 */

import { Drawer, Descriptions, Tag, Tabs, Space, Button, Badge, Timeline, Alert, Typography, Divider } from 'antd'
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { Application } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import {
  applicationSubjectTypeConfig,
  getApplicationStatusLabel,
  getApplicationStatusColor,
} from '@/shared/constants/status'
import { canTransitionApplicationStatus } from '@/shared/lib/status-transition'

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

  const program = programService.getByIdSync(application.programId)
  const subjectName =
    application.subjectType === 'school'
      ? schoolService.getNameById(application.subjectId)
      : application.subjectType === 'instructor'
      ? instructorService.getNameById(application.subjectId)
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
                <Text strong>{getApplicationStatusLabel(application.status)}</Text>
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
          <Badge status={getApplicationStatusColor(application.status) as any} />
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
          {canTransitionApplicationStatus(application.status, 'reviewing') && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onStatusChange('reviewing')}
              loading={loading}
            >
              검토 시작
            </Button>
          )}
          {canTransitionApplicationStatus(application.status, 'approved') && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onStatusChange('approved')}
              loading={loading}
            >
              확정
            </Button>
          )}
          {canTransitionApplicationStatus(application.status, 'rejected') && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => onStatusChange('rejected')}
              loading={loading}
            >
              거절
            </Button>
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
      <Tabs
        defaultActiveKey="basic"
        items={[
          {
            key: 'basic',
            label: '기본 정보',
            children: (
              <>
                <Alert
                  message={`현재 상태: ${getApplicationStatusLabel(application.status)}`}
                  type={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'error' : 'info'}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="프로그램">
                    <Tag color="blue">{program?.title || '-'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="신청 주체 유형">
                    <Tag color={applicationSubjectTypeConfig.colors[application.subjectType]}>
                      {applicationSubjectTypeConfig.labels[application.subjectType]}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="신청 주체">
                    <Text strong>{subjectName || '-'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="상태">
                    <Badge status={getApplicationStatusColor(application.status) as any} text={getApplicationStatusLabel(application.status)} />
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
              </>
            ),
          },
          {
            key: 'timeline',
            label: '상태 이력',
            children: (
              <>
                <Divider orientation="left">처리 이력</Divider>
                <Timeline items={timelineItems} />
              </>
            ),
          },
        ]}
      />
    </Drawer>
  )
}




