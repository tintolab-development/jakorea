/**
 * 내가 신청한 프로그램 목록 페이지 (강사용)
 * Phase: 강사 신청 프로그램 확인
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, Table, Space, Empty, Tabs, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useApplicationStore } from '@/features/application/model/application-store'
import { ApplicationDetailDrawer } from '@/features/application/ui/application-detail-drawer'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { applicationStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { applicationService } from '@/entities/application/api/application-service'
import dayjs from 'dayjs'
import type { Application, ApplicationStatus } from '@/types/domain'

const statusTabs: Array<{ key: ApplicationStatus | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'submitted', label: '접수' },
  { key: 'reviewing', label: '검토 중' },
  { key: 'approved', label: '확정' },
  { key: 'rejected', label: '반려' },
  { key: 'cancelled', label: '취소' },
]

export function MyProgramApplicationsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { getByIdSync: getProgramByIdSync } = useProgramService()
  const { selectedApplication, setSelectedApplication, updateStatus } = useApplicationStore()
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all')

  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '내가 신청한 프로그램'

  useEffect(() => {
    const loadMyApplications = async () => {
      if (!user) return

      // 신청 주체 권한일 때만 신청 목록 조회
      if (user.role !== 'INSTRUCTOR' && user.role !== 'INDIVIDUAL' && user.role !== 'SCHOOL') {
        return
      }

      setLoading(true)
      try {
        // 사용자 역할에 따라 subjectType 결정
        let subjectType: Application['subjectType'] | undefined
        let userId = user.id

        if (user.role === 'INSTRUCTOR' && user.instructorId) {
          subjectType = 'instructor'
          userId = user.instructorId
        } else if (user.role === 'SCHOOL') {
          subjectType = 'school'
        } else if (user.role === 'INDIVIDUAL') {
          // INDIVIDUAL은 student, volunteer 모두 가능하므로 subjectType 지정하지 않음
          subjectType = undefined
        }

        const applications = await applicationService.getByUserId(userId, subjectType)
        setMyApplications(applications)
      } catch (error) {
        console.error('신청 목록 조회 실패:', error)
        setMyApplications([])
      } finally {
        setLoading(false)
      }
    }

    loadMyApplications()
  }, [user])

  // 탭별 필터링
  const filteredApplications = useMemo(() => {
    if (activeTab === 'all') {
      return myApplications
    }
    return myApplications.filter(app => app.status === activeTab)
  }, [myApplications, activeTab])

  // 탭별 카운트
  const tabCounts = useMemo(() => {
    return {
      all: myApplications.length,
      submitted: myApplications.filter(app => app.status === 'submitted').length,
      reviewing: myApplications.filter(app => app.status === 'reviewing').length,
      approved: myApplications.filter(app => app.status === 'approved').length,
      rejected: myApplications.filter(app => app.status === 'rejected').length,
      cancelled: myApplications.filter(app => app.status === 'cancelled').length,
      waiting: myApplications.filter(app => app.status === 'waiting').length,
    }
  }, [myApplications])

  const handleView = (application: Application) => {
    // Phase 0.2.4: 진행상황 조회 페이지로 이동
    if (application.status === 'approved') {
      navigate(
        `/${user?.role === 'SCHOOL' ? 'school' : user?.role === 'INSTRUCTOR' ? 'instructor' : 'my'}/applications/${application.id}`
      )
    } else {
      // 승인되지 않은 경우 기존 drawer 사용
      setSelectedApplication(application)
      setDrawerOpen(true)
    }
  }

  const handleViewProgram = (programId: string) => {
    navigate(`/programs/${programId}`)
  }

  const columns = [
    {
      title: '프로그램명',
      dataIndex: 'programId',
      key: 'programId',
      width: 300,
      render: (programId: string) => {
        const program = getProgramByIdSync(programId)
        return program ? (
          <Button
            type="link"
            onClick={() => handleViewProgram(programId)}
            style={{ padding: 0, fontWeight: 500 }}
          >
            {program.title}
          </Button>
        ) : (
          '-'
        )
      },
    },
    {
      title: '신청일',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ApplicationStatus) => (
        <StatusBadge status={status} statusConfig={applicationStatusStatusConfig} />
      ),
    },
    {
      title: '검토일',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      width: 150,
      render: (date: string | undefined) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Application) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          상세
        </Button>
      ),
    },
  ]

  // Phase 0.1.1: INDIVIDUAL, SCHOOL 추가
  if (
    !user ||
    (user.role !== 'INSTRUCTOR' && user.role !== 'INDIVIDUAL' && user.role !== 'SCHOOL')
  ) {
    return (
      <div>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        <Card>
          <Empty description="신청 내역을 조회할 수 없습니다." />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
      </Space>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as ApplicationStatus | 'all')}
          items={statusTabs.map(tab => ({
            key: tab.key,
            label: (
              <span>
                {tab.label}
                {tab.key !== 'all' && (
                  <span style={{ marginLeft: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
                    ({tabCounts[tab.key as keyof typeof tabCounts] || 0})
                  </span>
                )}
              </span>
            ),
            children:
              filteredApplications.length === 0 ? (
                <Empty description="신청한 프로그램이 없습니다." />
              ) : (
                <Table
                  columns={columns}
                  dataSource={filteredApplications}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    showTotal: total => `총 ${total}개`,
                  }}
                />
              ),
          }))}
        />
      </Card>

      <ApplicationDetailDrawer
        open={drawerOpen}
        application={selectedApplication}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedApplication(null)
        }}
        onEdit={() => {}}
        onDelete={() => {}}
        onStatusChange={async status => {
          if (selectedApplication) {
            try {
              await updateStatus(selectedApplication.id, status)
              // 목록 새로고침
              if (user) {
                let subjectType: Application['subjectType'] | undefined
                let userId = user.id
                if (user.role === 'INSTRUCTOR' && user.instructorId) {
                  subjectType = 'instructor'
                  userId = user.instructorId
                } else if (user.role === 'SCHOOL') {
                  subjectType = 'school'
                }
                const applications = await applicationService.getByUserId(userId, subjectType)
                setMyApplications(applications)
              }
            } catch (error) {
              console.error('신청 상태 변경 실패:', error)
            }
          }
        }}
        loading={loading}
        isAdmin={false}
        currentUser={user}
      />
    </div>
  )
}
