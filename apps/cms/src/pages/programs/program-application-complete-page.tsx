/**
 * 프로그램 신청 완료 페이지
 * Phase 0.2.3: 신청 완료/결과 안내 (FR-C04)
 * §3.1: "신청 되었습니다" 화면
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Result, Card, Typography, Space } from 'antd'
import { CmsButton } from '@/shared/ui'
import { CheckCircleOutlined, FileSearchOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import dayjs from 'dayjs'

const { Paragraph, Text } = Typography

export function ProgramApplicationCompletePage() {
  const { id: programId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { programs } = useProgramStore()
  const [loading, setLoading] = useState(true)

  // Phase 0.2.1: FR-C01 - 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // 로딩 완료 처리
  useEffect(() => {
    setLoading(false)
  }, [])

  const program = programs.find(p => p.id === programId)
  const programName = program?.title || '프로그램'

  const getApplicationListPath = () => {
    if (!user || user.role === 'ADMIN') return '/programs'
    return '/programs/my'
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      {/* Phase 0.2.3: FR-C04 - 신청 완료 화면 */}
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        status="success"
        title="신청이 완료되었습니다"
        subTitle="관리자 검토 후 결과를 안내해 드립니다."
        extra={[
          <CmsButton
            key="list"
            icon={<FileSearchOutlined />}
            onClick={() => navigate(getApplicationListPath())}
          >
            신청 내역 확인
          </CmsButton>,
          <CmsButton key="home" variant="default" onClick={() => navigate(getRedirectPathByRole(user))}>
            홈으로 이동
          </CmsButton>,
        ]}
      />

      {/* 신청 요약 정보 */}
      <Card title="신청 요약" style={{ marginTop: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">프로그램명: </Text>
            <Text strong>{programName}</Text>
          </div>
          <div>
            <Text type="secondary">신청 일시: </Text>
            <Text>{dayjs().format('YYYY년 MM월 DD일 HH:mm')}</Text>
          </div>
        </Space>
      </Card>

      {/* 안내 메시지 */}
      <Card style={{ marginTop: 24 }}>
        <Paragraph style={{ margin: 0, textAlign: 'center', color: '#8c8c8c' }}>
          승인 결과는 신청 내역에서 확인하실 수 있으며, 확정 후 안내 문자/이메일이 발송됩니다.
        </Paragraph>
      </Card>
    </div>
  )
}
