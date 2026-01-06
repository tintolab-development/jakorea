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
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMemo } from 'react'
import { mockApplications } from '@/data/mock'
import { useNavigate } from 'react-router-dom'
import { programService } from '@/entities/program/api/program-service'

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

  // 상태별 신청 수
  const statusCounts = useMemo(() => {
    return {
      pending: myApplications.filter(app => app.status === 'reviewing').length,
      confirmed: myApplications.filter(app => app.status === 'approved').length,
      rejected: myApplications.filter(app => app.status === 'rejected').length,
      total: myApplications.length,
    }
  }, [myApplications])

  // 최근 신청 (최근 3개)
  const recentApplications = useMemo(() => {
    return [...myApplications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }, [myApplications])

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Tag color="blue">접수</Tag>
      case 'reviewing':
        return <Tag color="orange">검토 중</Tag>
      case 'approved':
        return <Tag color="green">확정</Tag>
      case 'rejected':
        return <Tag color="red">반려</Tag>
      case 'cancelled':
        return <Tag color="default">취소</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  return (
    <Card
      title="내 신청 현황"
      extra={
        <Button type="link" onClick={() => navigate('/applications')}>
          전체 보기
        </Button>
      }
      style={{ height: '100%' }}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="전체 신청" value={statusCounts.total} prefix={<FileTextOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic
            title="검토 중"
            value={statusCounts.pending}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="확정"
            value={statusCounts.confirmed}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="반려"
            value={statusCounts.rejected}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
      </Row>

      {recentApplications.length > 0 && (
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>최근 신청</div>
          {recentApplications.map(application => (
            <div
              key={application.id}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ marginBottom: 4 }}>
                  {programService.getNameById(application.programId) || '프로그램 정보 없음'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                  {new Date(application.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
              {getStatusTag(application.status)}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
