/**
 * 강사 마이페이지
 * Phase 0.2.5: 강사 마이페이지 (FR-E01)
 * §E 강사 대시보드 구조
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Space, Typography, Button, Spin } from 'antd'
import { CalendarOutlined, FileTextOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { applicationService } from '@/entities/application/api/application-service'
import {
  getInstructorActivitySummary,
  type InstructorActivitySummary,
} from '@/features/dashboard/api/instructor-activity-service'
import { UpcomingSchedulesList } from '@/features/dashboard/ui/upcoming-schedules-list'
import { PendingTasksList } from '@/features/dashboard/ui/pending-tasks-list'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import type { Application } from '@/types/domain'

const { Title, Paragraph } = Typography

export function InstructorMypagePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [instructorApplications, setInstructorApplications] = useState<Application[]>([])
  const [instructorActivity, setInstructorActivity] = useState<InstructorActivitySummary | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.instructorId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // 강사 활동 요약 데이터 로드
        const activityData = await getInstructorActivitySummary(user.instructorId)
        setInstructorActivity(activityData)

        // 강사 신청 내역 로드
        const applications = await applicationService.getByUserId(user.instructorId, 'instructor')
        setInstructorApplications(applications)
      } catch (error) {
        console.error('데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.instructorId])

  // 신청 상태별 통계
  const applicationStats = {
    submitted: instructorApplications.filter(app => app.status === 'submitted').length,
    reviewing: instructorApplications.filter(app => app.status === 'reviewing').length,
    approved: instructorApplications.filter(app => app.status === 'approved').length,
    rejected: instructorApplications.filter(app => app.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={PAGE_HEADER_STYLE}>
        <Title level={2} style={{ margin: 0 }}>
          강사 마이페이지
        </Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
          신청 현황, 일정, 정산 정보를 한눈에 확인할 수 있습니다.
        </Paragraph>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Phase 0.2.5: 상단 - 신청 접수 상태 */}
        <Card title="신청 접수 상태">
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {applicationStats.submitted}
                  </div>
                  <div style={{ color: '#8c8c8c', marginTop: 4 }}>접수</div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                    {applicationStats.reviewing}
                  </div>
                  <div style={{ color: '#8c8c8c', marginTop: 4 }}>검토 중</div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {applicationStats.approved}
                  </div>
                  <div style={{ color: '#8c8c8c', marginTop: 4 }}>확정</div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {applicationStats.rejected}
                  </div>
                  <div style={{ color: '#8c8c8c', marginTop: 4 }}>반려</div>
                </div>
              </Card>
            </Col>
          </Row>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="link" onClick={() => navigate('/programs/my')}>
              신청 내역 전체 보기 →
            </Button>
          </div>
        </Card>

        {/* Phase 0.2.5: 하단 - 좌: 캘린더 + 프로그램 일정, 우: 강사료 신청 현황 */}
        <Row gutter={16}>
          {/* 좌 하단: 캘린더 + 프로그램 일정 */}
          <Col span={12}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>교육 일정</span>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/schedules/my/calendar')}>
                  전체 보기 →
                </Button>
              }
            >
              {instructorActivity ? (
                <UpcomingSchedulesList
                  schedules={instructorActivity.schedules.upcoming}
                  loading={false}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                  일정 정보가 없습니다.
                </div>
              )}
            </Card>
          </Col>

          {/* 우 하단: 강사료 신청 현황 */}
          <Col span={12}>
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>강사료 신청 현황</span>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/settlements/my')}>
                  전체 보기 →
                </Button>
              }
            >
              {instructorActivity ? (
                <PendingTasksList
                  reportPending={instructorActivity.pendingTasks.reportPending}
                  settlementPending={instructorActivity.pendingTasks.settlementPending}
                  settlementTasks={instructorActivity.pendingTasks.settlementTasks}
                  loading={false}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                  정산 정보가 없습니다.
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* 빠른 메뉴 */}
        <Card title="빠른 메뉴">
          <Row gutter={16}>
            <Col span={6}>
              <Button
                type="default"
                block
                icon={<UserOutlined />}
                onClick={() => navigate('/mypage/profile')}
                style={{ height: 80 }}
              >
                <div>내정보 관리</div>
              </Button>
            </Col>
            <Col span={6}>
              <Button
                type="default"
                block
                icon={<FileTextOutlined />}
                onClick={() => navigate('/instructor/documents')}
                style={{ height: 80 }}
              >
                <div>제출 서류 관리</div>
              </Button>
            </Col>
            <Col span={6}>
              <Button
                type="default"
                block
                icon={<CalendarOutlined />}
                onClick={() => navigate('/instructor/schedule')}
                style={{ height: 80 }}
              >
                <div>교육 일정</div>
              </Button>
            </Col>
            <Col span={6}>
              <Button
                type="default"
                block
                icon={<DollarOutlined />}
                onClick={() => navigate('/settlements/my')}
                style={{ height: 80 }}
              >
                <div>강사료 신청</div>
              </Button>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Button
                type="default"
                block
                icon={<FileTextOutlined />}
                onClick={() => navigate('/instructor/reports')}
                style={{ height: 80 }}
              >
                <div>강의보고서</div>
              </Button>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  )
}
