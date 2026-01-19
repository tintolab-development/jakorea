/**
 * 본인 신청 현황 카드
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * 수강자용: 본인 신청 현황
 */

import { Card, Row, Col, Statistic, Tag, Button } from 'antd'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMemo, useCallback } from 'react'
import { mockApplications } from '@/data/mock'
import { useNavigate } from 'react-router-dom'
import { programService } from '@/entities/program/api/program-service'
import './my-application-summary.css'

export function MyApplicationSummary() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // 본인 신청 데이터 필터링 (수강자의 경우 subjectId로 필터링)
  const myApplications = useMemo(() => {
    if (!user) {
      return []
    }
    // 수강자의 경우 subjectType이 'student'이고 subjectId가 사용자 ID와 매칭되어야 함
    // 현재는 간단히 모든 신청을 표시 (실제로는 사용자 ID와 매칭 로직 필요)
    return mockApplications.filter(application => application.subjectType === 'student')
  }, [user])

  type ProgressStatus = 'APPLIED' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED'

  const getProgressStatus = useCallback((status: string, programId: string): ProgressStatus => {
    if (status !== 'approved') {
      return 'APPLIED'
    }

    const program = programService.getByIdSync(programId)
    const lifecycleStatus = program?.lifecycleStatus

    if (lifecycleStatus === 'in_progress') {
      return 'IN_PROGRESS'
    }

    if (lifecycleStatus === 'completed') {
      return 'COMPLETED'
    }

    return 'UPCOMING'
  }, [])

  // 상태별 신청 수 (신청 완료/진행 예정/진행 중/진행 완료)
  const statusCounts = useMemo(() => {
    const counts = {
      applied: 0,
      upcoming: 0,
      inProgress: 0,
      completed: 0,
      total: myApplications.length,
    }

    myApplications.forEach(app => {
      const progressStatus = getProgressStatus(app.status, app.programId)
      if (progressStatus === 'APPLIED') counts.applied += 1
      if (progressStatus === 'UPCOMING') counts.upcoming += 1
      if (progressStatus === 'IN_PROGRESS') counts.inProgress += 1
      if (progressStatus === 'COMPLETED') counts.completed += 1
    })

    return counts
  }, [getProgressStatus, myApplications])

  // 최근 신청 (최근 3개)
  const recentApplications = useMemo(() => {
    return [...myApplications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }, [myApplications])

  const getStatusTag = (status: string, programId: string) => {
    const progressStatus = getProgressStatus(status, programId)
    switch (progressStatus) {
      case 'APPLIED':
        return <Tag color="default" className="my-application-summary__status-tag">신청 완료</Tag>
      case 'UPCOMING':
        return <Tag color="default" className="my-application-summary__status-tag">진행 예정</Tag>
      case 'IN_PROGRESS':
        return <Tag color="default" className="my-application-summary__status-tag">진행 중</Tag>
      case 'COMPLETED':
        return <Tag color="default" className="my-application-summary__status-tag">진행 완료</Tag>
      default:
        return <Tag color="default" className="my-application-summary__status-tag">신청 완료</Tag>
    }
  }

  return (
    <Card
      title="내 프로그램 현황"
      extra={
        <Button type="link" onClick={() => navigate('/applications')}>
          전체 보기
        </Button>
      }
      style={{ height: '100%' }}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            className="my-application-summary__statistic"
            title={<span className="my-application-summary__statistic-title">신청 완료</span>}
            value={statusCounts.applied}
            prefix={<span className="my-application-summary__statistic-icon"><FileTextOutlined /></span>}
          />
        </Col>
        <Col span={6}>
          <Statistic
            className="my-application-summary__statistic"
            title={<span className="my-application-summary__statistic-title">진행 예정</span>}
            value={statusCounts.upcoming}
            prefix={<span className="my-application-summary__statistic-icon"><ClockCircleOutlined /></span>}
          />
        </Col>
        <Col span={6}>
          <Statistic
            className="my-application-summary__statistic"
            title={<span className="my-application-summary__statistic-title">진행 중</span>}
            value={statusCounts.inProgress}
            prefix={<span className="my-application-summary__statistic-icon"><SyncOutlined /></span>}
          />
        </Col>
        <Col span={6}>
          <Statistic
            className="my-application-summary__statistic"
            title={<span className="my-application-summary__statistic-title">진행 완료</span>}
            value={statusCounts.completed}
            prefix={<span className="my-application-summary__statistic-icon"><CheckCircleOutlined /></span>}
          />
        </Col>
      </Row>

      {recentApplications.length > 0 && (
        <div className="my-application-summary__recent">
          <div className="my-application-summary__recent-title">최근 신청</div>
          {recentApplications.map(application => (
            <div
              key={application.id}
              className="my-application-summary__recent-item"
            >
              <div className="my-application-summary__recent-info">
                <div className="my-application-summary__recent-name">
                  {programService.getNameById(application.programId) || '프로그램 정보 없음'}
                </div>
                <div className="my-application-summary__recent-date">
                  {new Date(application.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
              {getStatusTag(application.status, application.programId)}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
