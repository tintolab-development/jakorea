/**
 * 사용자 상세 Drawer
 * Phase 5.1.2: 사용자 관리 페이지
 */

import { useState, useEffect } from 'react'
import { Descriptions, Tag, Tabs, Table, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { User } from '@/types/user'
import type { Application, UserHistory } from '@/types/domain'
import { RoleBadge, getProgramRoleLabel, getRoleLabel } from '@/shared/ui'
import { InterviewStatusBadge } from '@/shared/components'
import { formatDate } from '@/shared/utils'
import { useUserStore, selectSelectedUser } from '@/features/user/model/user-store'
import { BaseDetailDrawer } from '@/shared/ui/base-detail-drawer'
import { applicationService } from '@/entities/application/api/application-service'
import { programService } from '@/entities/program/api/program-service'
import { getApplicationStatusLabel, getApplicationStatusColor } from '@/shared/constants/status'
import { mockUserHistories } from '@/data/mock/mypage'
import dayjs from 'dayjs'

interface UserDetailDrawerProps {
  open: boolean
  user?: Omit<User, 'password'> | null // optional로 변경하여 store의 selectedUser 우선 사용
  onClose: () => void
  onEdit?: (user: Omit<User, 'password'>) => void
}

export function UserDetailDrawer({ open, user, onClose, onEdit }: UserDetailDrawerProps) {
  // 스토어에서 선택된 사용자 가져오기 (selector 사용)
  const storeSelectedUser = useUserStore(state => selectSelectedUser(state))

  // prop의 user를 우선 사용 (즉시 표시), 없으면 store의 selectedUser 사용
  const displayUser = user || storeSelectedUser || null

  const [applications, setApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [volunteerHistories, setVolunteerHistories] = useState<UserHistory[]>([])
  const [volunteerHistoriesLoading, setVolunteerHistoriesLoading] = useState(false)

  // 사용자별 신청 이력 조회
  useEffect(() => {
    if (open && displayUser) {
      const loadApplications = async () => {
        setApplicationsLoading(true)
        try {
          // 사용자 역할에 따라 subjectType 결정
          let subjectType: Application['subjectType'] | undefined
          if (displayUser.role === 'INSTRUCTOR') {
            subjectType = 'instructor'
          } else if (displayUser.role === 'SCHOOL') {
            subjectType = 'school'
          } else if (displayUser.role === 'INDIVIDUAL') {
            subjectType = 'student'
          }

          const userApplications = await applicationService.getByUserId(displayUser.id, subjectType)
          setApplications(userApplications)
        } catch (error) {
          console.error('Failed to load applications:', error)
          setApplications([])
        } finally {
          setApplicationsLoading(false)
        }
      }

      loadApplications()
    } else {
      setApplications([])
    }
  }, [open, displayUser])

  // 참여 이력 조회 (사용자 ID로 필터링)
  useEffect(() => {
    if (open && displayUser) {
      const loadUserHistories = () => {
        setVolunteerHistoriesLoading(true)
        try {
          // 사용자 ID로 참여이력 필터링
          const histories = mockUserHistories.filter(
            h => h.userId === displayUser.id && h.finalStatus !== 'CANCELLED'
          )
          // 완료 일시 기준 내림차순 정렬
          histories.sort((a, b) => dayjs(b.completedAt).diff(dayjs(a.completedAt)))
          setVolunteerHistories(histories)
        } catch (error) {
          console.error('Failed to load user histories:', error)
          setVolunteerHistories([])
        } finally {
          setVolunteerHistoriesLoading(false)
        }
      }

      loadUserHistories()
    } else {
      setVolunteerHistories([])
    }
  }, [open, displayUser])

  if (!displayUser) {
    return null
  }

  // 액션 버튼 구성
  const actions = onEdit
    ? [
        {
          key: 'edit',
          label: '권한 변경',
          onClick: () => onEdit(displayUser),
        },
      ]
    : []

  // 프로그램 이력 테이블 컬럼
  const programHistoryColumns: ColumnsType<Application> = [
    {
      title: '프로그램명',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? program.title : programId
      },
    },
    {
      title: '신청 유형',
      dataIndex: 'subjectType',
      key: 'subjectType',
      render: (type: Application['subjectType']) => {
        const typeLabels: Record<Application['subjectType'], string> = {
          school: '학교',
          student: '학생',
          instructor: '강사',
          volunteer: '봉사자',
        }
        return typeLabels[type] || type
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: Application['status']) => (
        <Tag color={getApplicationStatusColor(status)}>{getApplicationStatusLabel(status)}</Tag>
      ),
    },
    {
      title: '신청일',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => formatDate(new Date(date)),
    },
  ]

  // 봉사단 참여 이력 테이블 컬럼
  const volunteerHistoryColumns: ColumnsType<UserHistory> = [
    {
      title: '프로그램명',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? program.title : programId
      },
    },
    {
      title: '참여 역할',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserHistory['role']) => {
        const roleLabels: Record<string, string> = {
          INSTRUCTOR: '강사',
          VOLUNTEER: '봉사자',
          PARTICIPANT: '참여자',
        }
        return <Tag color="blue">{roleLabels[role] || role}</Tag>
      },
    },
    {
      title: '완료 상태',
      dataIndex: 'finalStatus',
      key: 'finalStatus',
      render: (status: UserHistory['finalStatus']) => {
        const statusLabels: Record<string, string> = {
          COMPLETED: '완료',
          CONFIRMED: '확정',
          CANCELLED: '취소',
        }
        const statusColors: Record<string, string> = {
          COMPLETED: 'success',
          CONFIRMED: 'success',
          CANCELLED: 'error',
        }
        return <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
      },
    },
    {
      title: '봉사 시간',
      dataIndex: 'volunteerHours',
      key: 'volunteerHours',
      render: (hours?: number) => (hours ? `${hours}시간` : '-'),
    },
    {
      title: '완료일',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => formatDate(new Date(date)),
    },
  ]

  const tabItems = [
    {
      key: 'basic',
      label: '기본 정보',
      children: (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="이름">{displayUser.name}</Descriptions.Item>
          <Descriptions.Item label="이메일">{displayUser.email}</Descriptions.Item>
          <Descriptions.Item label="권한">
            <RoleBadge
              role={displayUser.role}
              adminLevel={displayUser.adminLevel}
              size="small"
              variant="tag"
            />
          </Descriptions.Item>
          {displayUser.role === 'ADMIN' && displayUser.adminLevel && (
            <Descriptions.Item label="관리자 구분">
              {getRoleLabel('ADMIN', displayUser.adminLevel)}
            </Descriptions.Item>
          )}
          {displayUser.role === 'ADMIN' && displayUser.programRoles && (
            <Descriptions.Item label="프로그램 범위">
              {Object.values(displayUser.programRoles)[0]
                ? getProgramRoleLabel(Object.values(displayUser.programRoles)[0])
                : '-'}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="상태">
            <Tag color={displayUser.isActive ? 'green' : 'default'}>
              {displayUser.isActive ? '활성' : '비활성'}
            </Tag>
          </Descriptions.Item>
          {(displayUser.role === 'INSTRUCTOR' ||
            displayUser.role === 'INDIVIDUAL' ||
            displayUser.role === 'SCHOOL') && (
            <>
              <Descriptions.Item label="면접 상태">
                {displayUser.interviewStatus ? (
                  <InterviewStatusBadge status={displayUser.interviewStatus} />
                ) : (
                  <Tag>-</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="참여이력">
                {displayUser.participationHistory ?? 0}건
              </Descriptions.Item>
              {displayUser.interviewScheduledAt && (
                <Descriptions.Item label="면접 일정">
                  {formatDate(new Date(displayUser.interviewScheduledAt))}
                </Descriptions.Item>
              )}
              {displayUser.interviewCompletedAt && (
                <Descriptions.Item label="면접 완료일">
                  {formatDate(new Date(displayUser.interviewCompletedAt))}
                </Descriptions.Item>
              )}
            </>
          )}
          {displayUser.lastLoginAt && (
            <Descriptions.Item label="마지막 로그인">
              {formatDate(new Date(displayUser.lastLoginAt))}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="생성일">
            {formatDate(new Date(displayUser.createdAt))}
          </Descriptions.Item>
          <Descriptions.Item label="수정일">
            {formatDate(new Date(displayUser.updatedAt))}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'programs',
      label: `프로그램 이력 (${applications.length})`,
      children: (
        <div>
          {applicationsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>로딩 중...</div>
          ) : applications.length > 0 ? (
            <Table
              columns={programHistoryColumns}
              dataSource={applications}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          ) : (
            <Empty description="프로그램 신청 이력이 없습니다." />
          )}
        </div>
      ),
    },
    {
      key: 'volunteer',
      label: `참여 이력 (${volunteerHistories.length})`,
      children: (
        <div>
          {volunteerHistoriesLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>로딩 중...</div>
          ) : volunteerHistories.length > 0 ? (
            <Table
              columns={volunteerHistoryColumns}
              dataSource={volunteerHistories}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          ) : (
            <Empty description="참여 이력이 없습니다." />
          )}
        </div>
      ),
    },
  ]

  return (
    <BaseDetailDrawer
      open={open}
      onClose={onClose}
      title="사용자 상세 정보"
      width={800}
      actions={actions}
      hideActions={!onEdit}
    >
      <Tabs defaultActiveKey="basic" items={tabItems} />
    </BaseDetailDrawer>
  )
}
