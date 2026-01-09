/**
 * 신청 상세 Drawer 컴포넌트
 * Phase 2.2: 사이드 패널로 상세 정보 표시 (Ant Design 컴포넌트 다양하게 활용)
 */

import {
  Drawer,
  Descriptions,
  Tag,
  Tabs,
  Space,
  Button,
  Badge,
  Timeline,
  Alert,
  Typography,
  Divider,
} from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Application } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
import {
  applicationSubjectTypeConfig,
  getApplicationStatusLabel,
  getApplicationStatusColor,
} from '@/shared/constants/status'
import { isApplicationFinalStatus, canTransitionApplicationStatus } from '@/shared/lib/status-transition'
import { domainColorsHex } from '@/shared/constants/colors'
import { ApplicationWorkflow } from './application-workflow'
import { useApplicationStore } from '@/features/application/model/application-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { User } from '@/types/user'
import { Popconfirm, message } from 'antd'
import { StopOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

interface ApplicationDetailDrawerProps {
  open: boolean
  application: Application | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Application['status'], rejectionReason?: string) => void
  loading?: boolean
  isAdmin?: boolean // 관리자 여부
  currentUser?: Pick<User, 'id' | 'role' | 'instructorId'> | null // 현재 사용자 정보
}

export function ApplicationDetailDrawer({
  open,
  application,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  loading,
  isAdmin = false,
  currentUser,
}: ApplicationDetailDrawerProps) {
  const { selectedApplication: storeSelectedApplication, updateStatus } = useApplicationStore()
  const { user: authUser } = useAuthStore()
  
  // 실제 사용자 정보 (currentUser가 있으면 사용, 없으면 authUser 사용)
  const user = currentUser || authUser
  // 관리자 여부 결정 (isAdmin prop이 있으면 사용, 없으면 user.role로 판단)
  const isAdminUser = isAdmin || user?.role === 'ADMIN'

  // store의 selectedApplication을 우선 사용, 없으면 prop의 application 사용
  const displayApplication = storeSelectedApplication || application

  if (!displayApplication) return null

  const isFinalStatus = isApplicationFinalStatus(displayApplication.status)

  const program = programService.getByIdSync(displayApplication.programId)
  const subjectName =
    displayApplication.subjectType === 'school'
      ? schoolService.getNameById(displayApplication.subjectId)
      : displayApplication.subjectType === 'instructor'
        ? instructorService.getNameById(displayApplication.subjectId)
        : '-'

  // 신청 경로 정보 (V3 Phase 7)
  const applicationPath = displayApplication.applicationPathId
    ? applicationPathService.getByIdSync(displayApplication.applicationPathId)
    : applicationPathService.getByProgramIdSync(displayApplication.programId)

  const pathTypeLabels: Record<string, string> = {
    google_form: '구글폼',
    internal: '자동화 프로그램',
  }

  const timelineItems = [
    {
      color: 'blue',
      children: (
        <div>
          <Text strong>접수</Text>
          <br />
          <Text type="secondary">
            {new Date(displayApplication.submittedAt).toLocaleString('ko-KR')}
          </Text>
        </div>
      ),
    },
    ...(displayApplication.reviewedAt
      ? [
          {
            color:
              displayApplication.status === 'approved'
                ? 'green'
                : displayApplication.status === 'rejected'
                  ? 'red'
                  : 'orange',
            children: (
              <div>
                <Text strong>{getApplicationStatusLabel(displayApplication.status)}</Text>
                <br />
                <Text type="secondary">
                  {new Date(displayApplication.reviewedAt).toLocaleString('ko-KR')}
                </Text>
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
          <Badge status={getApplicationStatusColor(displayApplication.status) as any} />
          <Title level={4} style={{ margin: 0 }}>
            신청 상세
          </Title>
        </Space>
      }
      width={792}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          {/* 관리자만 수정/삭제 가능 */}
          {isAdminUser && (
            <>
              {!isFinalStatus && (
                <Button icon={<EditOutlined />} onClick={onEdit}>
                  수정
                </Button>
              )}
              <Button danger icon={<DeleteOutlined />} onClick={onDelete} loading={loading}>
                삭제
              </Button>
            </>
          )}
          {/* 강사/수강자는 취소만 가능 (취소 가능한 상태일 때만) */}
          {!isAdminUser && canTransitionApplicationStatus(displayApplication.status, 'cancelled') && (
            <Popconfirm
              title="신청 취소"
              description="이 신청을 취소하시겠습니까? 취소된 신청은 복구할 수 없습니다."
              onConfirm={async () => {
                try {
                  await updateStatus(displayApplication.id, 'cancelled')
                  message.success('신청이 취소되었습니다.')
                  onStatusChange('cancelled')
                } catch (e) {
                  console.error('신청 취소 중 오류가 발생했습니다.', e)
                  message.error('신청 취소 중 오류가 발생했습니다.')
                }
              }}
              okText="취소하기"
              cancelText="아니오"
              okButtonProps={{ danger: true }}
            >
              <Button icon={<StopOutlined />} loading={loading}>
                취소
              </Button>
            </Popconfirm>
          )}
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
                  message={`현재 상태: ${getApplicationStatusLabel(displayApplication.status)}`}
                  description={
                    displayApplication.status === 'waiting'
                      ? '이 신청은 대기 목록에 있습니다. 프로그램 정원에 여유가 생기면 자동으로 확정됩니다.'
                      : displayApplication.status === 'reviewing'
                        ? '현재 검토 중인 신청입니다. 검토를 완료하고 확정 또는 거절 처리를 진행해주세요.'
                        : displayApplication.status === 'submitted'
                          ? '접수된 신청입니다. 검토를 시작해주세요.'
                          : isFinalStatus
                            ? '최종 처리된 신청입니다.'
                            : undefined
                  }
                  type={
                    displayApplication.status === 'approved'
                      ? 'success'
                      : displayApplication.status === 'rejected'
                        ? 'error'
                        : displayApplication.status === 'cancelled'
                          ? 'warning'
                          : 'info'
                  }
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="프로그램">
                    <Tag color={domainColorsHex.program.primary}>{program?.title || '-'}</Tag>
                  </Descriptions.Item>
                  {applicationPath && (
                    <Descriptions.Item label="신청 경로">
                      <Space direction="vertical" size={4}>
                        <Tag color={applicationPath.pathType === 'google_form' ? 'orange' : 'blue'}>
                          {pathTypeLabels[applicationPath.pathType] || applicationPath.pathType}
                        </Tag>
                        {applicationPath.pathType === 'google_form' &&
                          applicationPath.googleFormUrl && (
                            <Text>
                              <a
                                href={applicationPath.googleFormUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                구글폼 열기
                              </a>
                            </Text>
                          )}
                        {applicationPath.guideMessage && (
                          <Text type="secondary">{applicationPath.guideMessage}</Text>
                        )}
                      </Space>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="신청 주체 유형">
                    <Tag
                      color={applicationSubjectTypeConfig.colors[displayApplication.subjectType]}
                    >
                      {applicationSubjectTypeConfig.labels[displayApplication.subjectType]}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="신청 주체">
                    <Text strong>{subjectName || '-'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="상태">
                    <Badge
                      status={getApplicationStatusColor(displayApplication.status) as any}
                      text={getApplicationStatusLabel(displayApplication.status)}
                    />
                  </Descriptions.Item>
                  {displayApplication.notes && (
                    <Descriptions.Item label="비고">
                      <Text>{displayApplication.notes}</Text>
                    </Descriptions.Item>
                  )}
                  {displayApplication.rejectionReason && (
                    <Descriptions.Item label="거절 사유">
                      <Alert
                        type="error"
                        message={displayApplication.rejectionReason}
                        showIcon
                        style={{ margin: 0 }}
                      />
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="접수일">
                    {new Date(displayApplication.submittedAt).toLocaleString('ko-KR')}
                  </Descriptions.Item>
                  {displayApplication.reviewedAt && (
                    <Descriptions.Item label="검토일">
                      {new Date(displayApplication.reviewedAt).toLocaleString('ko-KR')}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="등록일">
                    {new Date(displayApplication.createdAt).toLocaleDateString('ko-KR')}
                  </Descriptions.Item>
                  <Descriptions.Item label="수정일">
                    {new Date(displayApplication.updatedAt).toLocaleDateString('ko-KR')}
                  </Descriptions.Item>
                </Descriptions>
              </>
            ),
          },
          {
            key: 'timeline',
            label: isAdminUser ? '상태 이력 / 워크플로우' : '처리 이력',
            children: (
              <>
                {/* 관리자만 워크플로우 표시 */}
                {isAdminUser && (
                  <>
                    <ApplicationWorkflow
                      application={displayApplication}
                      onStatusChange={onStatusChange}
                      loading={loading}
                    />
                    <Divider orientation="left" style={{ marginTop: 24 }}>
                      처리 이력
                    </Divider>
                  </>
                )}
                {/* 강사/수강자는 처리 이력만 표시 */}
                {!isAdminUser && (
                  <>
                    <Title level={5}>처리 이력</Title>
                    <Timeline items={timelineItems} />
                    <div style={{ marginTop: 24 }}>
                      <Alert
                        message="신청 취소"
                        description="신청을 취소하려면 상단의 '취소' 버튼을 클릭하세요."
                        type="info"
                        showIcon
                      />
                    </div>
                  </>
                )}
              </>
            ),
          },
        ]}
      />
    </Drawer>
  )
}
