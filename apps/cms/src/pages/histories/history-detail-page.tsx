/**
 * 이력 상세 / 증빙 화면
 * Phase 5.11: 사용자가 자신의 참여 결과를 정확히 이해
 * 참고 화면: U-05-02 이력 상세 / 증빙
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, Space, Typography, Descriptions, Tag, Button, Result, Spin, Alert, List, message } from 'antd'
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { StatusDisplay } from '@/shared/ui'
import { mockUserHistoriesMap, mockProgramsMap } from '@/data/mock/mypage'
import { downloadCertificate } from '@/shared/utils/certificate-download'
import dayjs from 'dayjs'
import type { UserHistory, FinalStatus } from '@/types/domain'

const { Title, Paragraph, Text } = Typography

// 완료 상태 라벨
const finalStatusLabels: Record<FinalStatus, string> = {
  COMPLETED: '프로그램이 완료되었습니다.',
  CONFIRMED: '프로그램이 확정되었습니다.',
  CANCELLED: '프로그램이 취소되었습니다.',
}

// 완료 상태 색상
const finalStatusColors: Record<FinalStatus, string> = {
  COMPLETED: 'success',
  CONFIRMED: 'success',
  CANCELLED: 'error',
}

// 참여 역할 라벨
const roleLabels: Record<string, string> = {
  INSTRUCTOR: '강사',
  VOLUNTEER: '봉사자',
  PARTICIPANT: '참여자',
}

// 정산 상태 라벨
const paymentStatusLabels: Record<string, string> = {
  PAY_01: '대기',
  PAY_02: '산출 완료',
  PAY_03: '승인',
  PAY_04: '지급 완료',
}

// 정산 상태 색상
const paymentStatusColors: Record<string, string> = {
  PAY_01: 'default',
  PAY_02: 'processing',
  PAY_03: 'success',
  PAY_04: 'success',
}

export function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [history, setHistory] = useState<UserHistory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistory = () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const found = mockUserHistoriesMap.get(id)
        setHistory(found || null)
      } catch (error) {
        console.error('Failed to load history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!history) {
    return (
      <Result
        status="404"
        title="이력을 찾을 수 없습니다"
        subTitle="요청하신 이력 정보가 존재하지 않거나 삭제되었습니다."
        extra={
          <Button type="primary" onClick={() => navigate('/histories')}>
            이력 목록으로 이동
          </Button>
        }
      />
    )
  }

  const program = mockProgramsMap.get(history.programId)

  const handleDownload = async (certificate: { id: string; title: string; downloadUrl: string; issuedAt: Date | string }) => {
    try {
      await downloadCertificate(certificate)
      message.success('증빙 문서가 다운로드되었습니다')
    } catch (error) {
      console.error('Failed to download certificate:', error)
      message.error('증빙 문서 다운로드 중 오류가 발생했습니다')
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 페이지 헤더 영역 */}
        <div>
          <Title level={2} style={{ margin: 0 }}>
            이력 상세
          </Title>
        </div>

        {/* 결과 요약 영역 (최상단, 가장 강조) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <StatusDisplay
              status={history.finalStatus}
              statusLabels={finalStatusLabels}
              statusColors={finalStatusColors}
            />
            <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
              이 결과는 최종 확정 상태입니다.
            </Paragraph>
          </Space>
        </Card>

        {/* 프로그램 및 참여 정보 영역 */}
        <Card title="프로그램 및 참여 정보">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="프로그램명">
              <Text strong>{program?.title || '알 수 없는 프로그램'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="참여 역할">
              <Tag color="blue">{roleLabels[history.role]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="완료 일시">
              {dayjs(history.completedAt).format('YYYY년 MM월 DD일')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 결과 상세 요약 영역 (조건부) */}
        {history.role === 'INSTRUCTOR' && (
          <Card title="정산 정보">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="정산 상태">
                <Tag color={paymentStatusColors[history.paymentStatus || 'PAY_01']}>
                  {paymentStatusLabels[history.paymentStatus || 'PAY_01']}
                </Tag>
              </Descriptions.Item>
              {history.paymentStatus === 'PAY_04' && history.paymentAmount && (
                <Descriptions.Item label="지급 금액">
                  <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                    {history.paymentAmount.toLocaleString()}원
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {history.role === 'VOLUNTEER' && (
          <Card title="봉사 정보">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="인정 봉사시간">
                <Text strong style={{ fontSize: 18 }}>
                  {history.volunteerHours || 0}시간
                </Text>
              </Descriptions.Item>
            </Descriptions>
            <Alert
              message="봉사시간은 프로그램 기준 고정 시간으로 인정됩니다."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        )}

        {/* 증빙 문서 영역 (핵심) */}
        {history.certificates && history.certificates.length > 0 && (
          <Card title="증빙 문서">
            <List
              dataSource={history.certificates}
              renderItem={(certificate) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(certificate)}
                    >
                      다운로드
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={certificate.title}
                    description={`발급일: ${dayjs(certificate.issuedAt).format('YYYY년 MM월 DD일')}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* 공식 기록 안내 영역 */}
        <Card>
          <Alert
            message="공식 기록 안내"
            description="본 이력 및 증빙 문서는 공식 기록으로 보관되며 수정할 수 없습니다."
            type="info"
            showIcon
          />
        </Card>

        {/* 완료 상태 안내 영역 */}
        <Card>
          <Paragraph style={{ margin: 0, textAlign: 'center', color: '#8c8c8c' }}>
            추가로 하실 일은 없습니다.
          </Paragraph>
        </Card>
      </Space>
    </div>
  )
}

