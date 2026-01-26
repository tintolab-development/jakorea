/**
 * 신청 상세 Drawer 컴포넌트
 * Phase 2.2: 사이드 패널로 상세 정보 표시 (Ant Design 컴포넌트 다양하게 활용)
 */

import { Descriptions, Tag, Tabs, Space, Timeline, Alert, Typography, Divider, Modal } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Application } from '@/types/domain'
import { SchoolApplicationForm } from './school-application-form'
import { IndividualApplicationForm } from './individual-application-form'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { useSchoolService } from '@/features/school/hooks/use-school-service'
import { useInstructorService } from '@/features/instructor/hooks/use-instructor-service'
import { mockUsers } from '@/data/mock/users'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
import {
  applicationSubjectTypeConfig,
  applicationStatusStatusConfig,
  getApplicationStatusLabel,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { MESSAGES } from '@/shared/constants/messages'
import {
  isApplicationFinalStatus,
  canTransitionApplicationStatus,
} from '@/shared/lib/status-transition'
import { domainColorsHex } from '@/shared/constants/colors'
import { ApplicationWorkflow } from './application-workflow'
import { NotificationButton } from './notification-button'
import { useApplicationStore } from '@/features/application/model/application-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { User } from '@/types/user'
import { message } from 'antd'
import { StopOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import {
  getNotificationStatus,
  getNotificationHistory,
  sendApplicationNotification,
  channelLabels,
  type NotificationChannel,
  type NotificationRecord,
} from '@/entities/application/api/application-notification-service'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { StatusChangeDropdown } from '@/features/application-progress/ui/status-change-dropdown'
import { StatusHistoryList } from '@/features/application-progress/ui/status-history-list'
import { useStatusChange } from '@/features/application-progress/hooks/use-status-change'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { BaseDetailDrawer } from '@/shared/ui/base-detail-drawer'

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
  onEdit: _onEdit,
  onDelete,
  onStatusChange,
  loading,
  isAdmin = false,
  currentUser,
}: ApplicationDetailDrawerProps) {
  void _onEdit
  const { selectedApplication: storeSelectedApplication, updateStatus, updateApplication, fetchApplicationById } = useApplicationStore()
  const { user: authUser } = useAuthStore()

  // 실제 사용자 정보 (currentUser가 있으면 사용, 없으면 authUser 사용)
  // currentUser는 Pick<User, ...>이므로 authUser를 우선 사용
  const user = authUser || (currentUser ? ({ ...currentUser } as Omit<User, 'password'>) : null)
  // 관리자 여부 결정 (isAdmin prop이 있으면 사용, 없으면 user.role로 판단)
  const isAdminUser = isAdmin || user?.role === 'ADMIN'
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  // store의 selectedApplication을 우선 사용, 없으면 prop의 application 사용
  const displayApplication = storeSelectedApplication || application

  // Phase 4.2 / 0.2.3: 알림 발송 상태 및 이력
  const [notificationSent, setNotificationSent] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationHistory, setNotificationHistory] = useState<NotificationRecord[]>([])

  // Task 3.2.1: FR-F01 - 신청서 수정 모달
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  // Phase 4.6: 진행 상태 관리
  const { history, fetchHistory, loading: statusHistoryLoading } = useStatusChange()
  const [currentProgressStatus, setCurrentProgressStatus] =
    useState<ApplicationProgressStatus | null>(null)

  // 승인된 신청의 경우 진행 상태 관리
  const isApproved = displayApplication?.status === 'approved'

  useEffect(() => {
    if (isApproved && displayApplication && open) {
      // Phase 0.3.6: 실제 progressStatus 사용 (없으면 RECEIVED)
      const initialStatus = displayApplication.progressStatus || 'RECEIVED'
      setCurrentProgressStatus(initialStatus)
      fetchHistory(displayApplication.id)
    }
  }, [isApproved, displayApplication?.id, displayApplication?.progressStatus, open, fetchHistory])

  useEffect(() => {
    if (displayApplication && open) {
      getNotificationStatus(displayApplication.id).then(status => {
        setNotificationSent(status.notificationSent)
      })
      getNotificationHistory(displayApplication.id).then(setNotificationHistory)
    }
  }, [displayApplication, open])

  const handleSendNotification = async (channel: NotificationChannel) => {
    if (!displayApplication || !user) return

    setNotificationLoading(true)
    try {
      const action = displayApplication.status === 'approved' ? 'APPROVE' : 'REJECT'
      await sendApplicationNotification(displayApplication, action, user.id, channel)
      setNotificationSent(true)
      const history = await getNotificationHistory(displayApplication.id)
      setNotificationHistory(history)
      showSuccessMessage(MESSAGES.success.notificationSent(channelLabels[channel]))
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.notificationSendFailed })
    } finally {
      setNotificationLoading(false)
    }
  }

  // Task 3.2.1: FR-F01 - 신청서 수정 핸들러
  const handleEdit = () => {
    if (!displayApplication || !isAdminUser || !canWrite) return
    if (isApplicationFinalStatus(displayApplication.status)) {
      message.warning('최종 상태인 신청서는 수정할 수 없습니다.')
      return
    }
    setEditModalOpen(true)
  }

  const handleEditSubmit = async (data: unknown) => {
    if (!displayApplication) return
    setEditLoading(true)
    const payload = data as {
      notes?: string
      customFields?: Record<string, unknown>
    }
    try {
      const updateData: Parameters<typeof updateApplication>[1] = {
        notes: payload.notes,
      }
      if (displayApplication.subjectType === 'student' && payload.customFields !== undefined) {
        updateData.customFields = payload.customFields
      }

      // 학교 신청서: 세부 정보는 현재 Application 타입에 직접 필드가 없으므로
      // notes에 텍스트로 저장 (향후 Application 타입 확장 시 별도 필드로 저장 가능)
      // TODO: Application 타입에 schoolName, address 등 필드 추가 시 별도 처리

      await updateApplication(displayApplication.id, updateData)
      await fetchApplicationById(displayApplication.id)
      setEditModalOpen(false)
      showSuccessMessage(MESSAGES.success.updated)
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.update })
    } finally {
      setEditLoading(false)
    }
  }

  const handleEditCancel = () => {
    setEditModalOpen(false)
  }

  const { getByIdSync } = useProgramService()
  const { getNameById: getSchoolNameById } = useSchoolService()
  const { getNameById: getInstructorNameById } = useInstructorService()

  if (!displayApplication) return null

  const isFinalStatus = isApplicationFinalStatus(displayApplication.status)

  const program = getByIdSync(displayApplication.programId)
  const subjectName =
    displayApplication.subjectType === 'school'
      ? getSchoolNameById(displayApplication.subjectId)
      : displayApplication.subjectType === 'instructor'
        ? getInstructorNameById(displayApplication.subjectId)
        : displayApplication.subjectType === 'volunteer'
          ? mockUsers.find(u => u.id === displayApplication.subjectId)?.name || '-'
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

  // 액션 버튼 구성
  const actions = [
    ...(isAdminUser && canWrite
      ? [
          ...(!isFinalStatus
            ? [
                {
                  key: 'edit',
                  label: '오기재 사항 수정',
                  onClick: handleEdit,
                  icon: <EditOutlined />,
                },
              ]
            : []),
          {
            key: 'delete',
            label: '삭제',
            onClick: onDelete,
            danger: true,
            icon: <DeleteOutlined />,
            loading,
          },
        ]
      : []),
    ...(!isAdminUser && canTransitionApplicationStatus(displayApplication.status, 'cancelled')
      ? [
          {
            key: 'cancel',
            label: '취소',
            onClick: async () => {
              try {
                await updateStatus(displayApplication.id, 'cancelled')
                message.success(MESSAGES.success.cancelled)
                onStatusChange('cancelled')
              } catch (e) {
                console.error('신청 취소 중 오류가 발생했습니다.', e)
                message.error(MESSAGES.error.cancel)
              }
            },
            icon: <StopOutlined />,
            loading,
          },
        ]
      : []),
  ]

  return (
    <BaseDetailDrawer
      open={open}
      onClose={onClose}
      title={
        <Space>
          <StatusBadge status={displayApplication.status} statusConfig={applicationStatusStatusConfig} variant="badge" showIcon={false} />
          <Title level={4} style={{ margin: 0 }}>
            신청 상세
          </Title>
        </Space>
      }
      width={LAYOUT_CONSTANTS.widths.modal.large}
      loading={loading}
      actions={actions}
      hideActions={actions.length === 0}
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
                      ? MESSAGES.application.waitingDescription
                      : displayApplication.status === 'reviewing'
                        ? MESSAGES.application.reviewingDescription
                        : displayApplication.status === 'submitted'
                          ? MESSAGES.application.submittedDescription
                          : isFinalStatus
                            ? MESSAGES.application.finalStatusDescription
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
                    <StatusBadge status={displayApplication.status} statusConfig={applicationStatusStatusConfig} variant="badge" />
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
                  {/* Phase 4.2 / 0.2.3: 알림 발송 (관리자만, 승인/반려 상태일 때만) */}
                  {isAdminUser &&
                    (displayApplication.status === 'approved' ||
                      displayApplication.status === 'rejected') && (
                      <>
                        <Descriptions.Item label="알림 발송">
                          <NotificationButton
                            application={displayApplication}
                            notificationSent={notificationSent}
                            onSend={handleSendNotification}
                            loading={notificationLoading}
                          />
                        </Descriptions.Item>
                        <Descriptions.Item label="알림 발송 이력" span={3}>
                          {notificationHistory.length === 0 ? (
                            <Text type="secondary">발송 이력 없음</Text>
                          ) : (
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              {notificationHistory.map(r => (
                                <div key={r.id}>
                                  <Tag color={r.status === 'SENT' ? 'green' : 'red'}>
                                    {channelLabels[r.type]}{' '}
                                    {r.status === 'SENT' ? '발송완료' : '실패'}
                                  </Tag>
                                  <Text type="secondary" style={{ marginLeft: 8 }}>
                                    {new Date(r.sentAt).toLocaleString('ko-KR')}
                                  </Text>
                                  <div>
                                    <Text strong>{r.title}</Text>
                                    {' · '}
                                    <Text type="secondary">{r.content}</Text>
                                  </div>
                                </div>
                              ))}
                            </Space>
                          )}
                        </Descriptions.Item>
                      </>
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

                    {/* Phase 4.6: 승인된 신청의 진행 상태 관리 */}
                    {isApproved && currentProgressStatus && (
                      <>
                        <Divider orientation="left" style={{ marginTop: 24 }}>
                          진행 상태 관리
                        </Divider>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <div>
                            <Text strong style={{ marginRight: 8 }}>
                              현재 진행 상태:
                            </Text>
                            <StatusChangeDropdown
                              applicationId={displayApplication.id}
                              currentStatus={currentProgressStatus || 'RECEIVED'}
                              onStatusChange={async newStatus => {
                                setCurrentProgressStatus(newStatus)
                                await fetchHistory(displayApplication.id)
                                // Phase 0.3.6: store의 selectedApplication도 갱신
                                if (storeSelectedApplication?.id === displayApplication.id) {
                                  await useApplicationStore
                                    .getState()
                                    .fetchApplicationById(displayApplication.id)
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Text strong>상태 변경 이력:</Text>
                            <StatusHistoryList history={history} loading={statusHistoryLoading} />
                          </div>
                        </Space>
                      </>
                    )}
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
      {/* Task 3.2.1: FR-F01 - 역할별 신청서 수정 모달 */}
      {displayApplication && editModalOpen && (
        <Modal
          open={editModalOpen}
          title="오기재 사항 수정"
          onCancel={handleEditCancel}
          footer={null}
          width={LAYOUT_CONSTANTS.widths.modal.large}
          destroyOnClose
        >
          {displayApplication.subjectType === 'school' && program ? (
            <SchoolApplicationForm
              program={program}
              application={displayApplication}
              onSubmit={async data => {
                await handleEditSubmit(data)
              }}
              onCancel={handleEditCancel}
              loading={editLoading}
            />
          ) : displayApplication.subjectType === 'student' && program ? (
            <IndividualApplicationForm
              program={program}
              application={displayApplication}
              onSubmit={async data => {
                await handleEditSubmit(data)
              }}
              onCancel={handleEditCancel}
              loading={editLoading}
            />
          ) : (
            <Alert
              type="warning"
              message="이 신청서 유형은 수정할 수 없습니다."
              description="학교 또는 개인 신청서만 수정 가능합니다."
            />
          )}
        </Modal>
      )}
    </BaseDetailDrawer>
  )
}
