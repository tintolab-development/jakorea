/**
 * 신청 결과 화면
 * Phase 5.2: 신청 상태별 결과 화면 개선
 * 참고 화면: U-02-02, U-02-03, U-02-04
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Result, Card, Typography, Space, Button, Alert } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  FileSearchOutlined,
} from '@ant-design/icons'
import { useApplicationStore } from '@/features/application/model/application-store'
import { mockProgramsMap } from '@/data/mock'
import type { Application } from '@/types/domain'
import dayjs from 'dayjs'

const { Paragraph, Text } = Typography

export function ApplicationResultPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { applications, fetchApplications } = useApplicationStore()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadApplication = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        await fetchApplications()
        const found = applications.find(a => a.id === id)
        setApplication(found || null)
      } catch (error) {
        console.error('Failed to load application:', error)
      } finally {
        setLoading(false)
      }
    }

    loadApplication()
  }, [id, fetchApplications, applications])

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (!application) {
    return (
      <Result
        status="404"
        title="신청을 찾을 수 없습니다"
        subTitle="요청하신 신청 정보가 존재하지 않거나 삭제되었습니다."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            홈으로 이동
          </Button>
        }
      />
    )
  }

  const program = mockProgramsMap.get(application.programId)
  const programName = program?.title || '알 수 없는 프로그램'

  // 신청 상태에 따라 다른 화면 렌더링
  if (application.status === 'submitted' || application.status === 'reviewing') {
    return <ApplicationPendingResult application={application} programName={programName} navigate={navigate} />
  }

  if (application.status === 'rejected') {
    return <ApplicationRejectedResult application={application} programName={programName} navigate={navigate} />
  }

  if (application.status === 'approved') {
    return <ApplicationApprovedResult application={application} programName={programName} navigate={navigate} />
  }

  // 기타 상태 (cancelled 등)
  return (
    <Result
      status="info"
      title="신청 정보"
      subTitle={`신청 상태: ${application.status}`}
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          홈으로 이동
        </Button>
      }
    />
  )
}

/**
 * 5.2.1 신청 완료(승인 대기) 화면
 */
interface ApplicationPendingResultProps {
  application: Application
  programName: string
  navigate: (path: string) => void
}

function ApplicationPendingResult({ application, programName, navigate }: ApplicationPendingResultProps) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      {/* 상태 확인 영역 (최상단, 가장 강조) */}
      <Result
        icon={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
        title="신청이 정상적으로 접수되었습니다"
        status="info"
      />

      {/* 상태 설명 영역 */}
      <Card style={{ marginTop: 24, marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph style={{ margin: 0, fontSize: 16 }}>
            <Text strong>현재 관리자 승인 대기 상태입니다.</Text>
          </Paragraph>
          <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
            현재 추가로 하실 일은 없습니다.
          </Paragraph>
        </Space>
      </Card>

      {/* 신청 요약 영역 */}
      <Card title="신청 요약" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">프로그램명: </Text>
            <Text strong>{programName}</Text>
          </div>
          <div>
            <Text type="secondary">신청 일시: </Text>
            <Text>{dayjs(application.submittedAt).format('YYYY년 MM월 DD일 HH:mm')}</Text>
          </div>
        </Space>
      </Card>

      {/* 다음 행동 안내 영역 */}
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
            승인 결과는 마이페이지에서 확인하실 수 있습니다.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate('/mypage')}
            style={{ minWidth: 200 }}
          >
            마이페이지로 이동
          </Button>
        </Space>
      </Card>
    </div>
  )
}

/**
 * 5.2.2 신청 반려 화면
 */
interface ApplicationRejectedResultProps {
  application: Application
  programName: string
  navigate: (path: string) => void
}

function ApplicationRejectedResult({ application, programName, navigate }: ApplicationRejectedResultProps) {
  // reason_public은 Application 타입에 없으므로 notes를 사용 (실제로는 reason_public 필드가 필요)
  const rejectionReason = application.notes || '반려 사유가 제공되지 않았습니다.'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      {/* 상태 결과 영역 (최상단, 가장 강조) */}
      <Result
        icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        title="신청이 반려되었습니다"
        status="error"
      />

      {/* 반려 사유 영역 (핵심) */}
      <Card title="반려 사유" style={{ marginTop: 24, marginBottom: 24 }}>
        <Alert
          message={rejectionReason}
          type="warning"
          showIcon
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        />
      </Card>

      {/* 신청 요약 영역 */}
      <Card title="신청 요약" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">프로그램명: </Text>
            <Text strong>{programName}</Text>
          </div>
          <div>
            <Text type="secondary">신청 일시: </Text>
            <Text>{dayjs(application.submittedAt).format('YYYY년 MM월 DD일 HH:mm')}</Text>
          </div>
        </Space>
      </Card>

      {/* 다음 행동 안내 영역 */}
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<FileSearchOutlined />}
            onClick={() => navigate('/programs')}
            style={{ minWidth: 200 }}
          >
            다른 프로그램 보기
          </Button>
        </Space>
      </Card>

      {/* 보조 안내 영역 */}
      <Card style={{ marginTop: 24 }}>
        <Paragraph style={{ margin: 0, textAlign: 'center', color: '#8c8c8c' }}>
          반려된 신청은 자동으로 종료 처리됩니다.
        </Paragraph>
      </Card>
    </div>
  )
}

/**
 * 5.2.3 신청 승인 완료 화면
 */
interface ApplicationApprovedResultProps {
  application: Application
  programName: string
  navigate: (path: string) => void
}

function ApplicationApprovedResult({ application, programName, navigate }: ApplicationApprovedResultProps) {
  // nextStep은 Application 타입에 없으므로 기본값 사용 (실제로는 nextStep 필드가 필요)
  // SCHEDULE, ACTIVITY, NONE 중 하나
  const nextStep = 'SCHEDULE' as 'SCHEDULE' | 'ACTIVITY' | 'NONE' // 실제로는 application.nextStep

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      {/* 승인 결과 영역 (최상단, 가장 강조) */}
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title="신청이 승인되었습니다"
        status="success"
      />

      {/* 승인 설명 영역 */}
      <Card style={{ marginTop: 24, marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph style={{ margin: 0, fontSize: 16 }}>
            <Text strong>신청하신 프로그램 참여가 확정되었습니다.</Text>
          </Paragraph>
        </Space>
      </Card>

      {/* 프로그램 요약 영역 */}
      <Card title="프로그램 요약" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">프로그램명: </Text>
            <Text strong>{programName}</Text>
          </div>
          {application.reviewedAt && (
            <div>
              <Text type="secondary">승인 일시: </Text>
              <Text>{dayjs(application.reviewedAt).format('YYYY년 MM월 DD일 HH:mm')}</Text>
            </div>
          )}
        </Space>
      </Card>

      {/* 다음 단계 안내 영역 (핵심) */}
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          {nextStep === 'SCHEDULE' && (
            <>
              <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
                일정 정보는 마이페이지에서 확인하실 수 있습니다.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                icon={<HomeOutlined />}
                onClick={() => navigate('/mypage')}
                style={{ minWidth: 200 }}
              >
                마이페이지로 이동
              </Button>
            </>
          )}
          {nextStep === 'ACTIVITY' && (
            <>
              <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
                활동 상세 정보를 확인하실 수 있습니다.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                icon={<FileSearchOutlined />}
                onClick={() => navigate(`/activities/${application.id}`)}
                style={{ minWidth: 200 }}
              >
                활동 상세 보기
              </Button>
            </>
          )}
          {nextStep === 'NONE' && (
            <>
              <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
                추가 안내사항은 마이페이지에서 확인하실 수 있습니다.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                icon={<HomeOutlined />}
                onClick={() => navigate('/mypage')}
                style={{ minWidth: 200 }}
              >
                마이페이지로 이동
              </Button>
            </>
          )}
        </Space>
      </Card>

      {/* 보조 안내 영역 */}
      <Card style={{ marginTop: 24 }}>
        <Paragraph style={{ margin: 0, textAlign: 'center', color: '#8c8c8c' }}>
          일정 및 활동 관련 안내는 문자 및 서비스 알림으로도 제공됩니다.
        </Paragraph>
      </Card>
    </div>
  )
}

