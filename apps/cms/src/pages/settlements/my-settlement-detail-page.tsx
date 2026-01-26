/**
 * 강사용 정산 상세 페이지
 * Phase 5.2.4: 본인 정산 정보
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, Spin, message } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMySettlementDetail } from '@/entities/settlement/api/instructor-settlement-service'
import { settlementStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { programService } from '@/entities/program/api/program-service'
import { MESSAGES } from '@/shared/constants'
import { SettlementCalculationSummary } from '@/features/settlement/ui/settlement-calculation-summary'
import dayjs from 'dayjs'
import type { Settlement } from '@/types/domain'

export function MySettlementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [loading, setLoading] = useState(false)

  const loadSettlement = useCallback(async () => {
    if (!id || !user?.instructorId) return

    setLoading(true)
    try {
      const data = await getMySettlementDetail(user.instructorId, id)
      if (data) {
        setSettlement(data)
      } else {
        message.error(MESSAGES.error.settlementNotFound)
        navigate('/settlements/my')
      }
    } catch (error) {
      console.error('정산 로드 실패:', error)
        message.error(MESSAGES.error.settlementLoadFailed)
      navigate('/settlements/my')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, user?.instructorId])

  useEffect(() => {
    if (id && user?.instructorId) {
      loadSettlement()
    }
  }, [id, user?.instructorId, loadSettlement])

  if (!user?.instructorId) {
    return (
      <div>
        <h1>정산 상세</h1>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px', color: 'rgba(0, 0, 0, 0.45)' }}>
            강사 정보가 없습니다.
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!settlement) {
    return (
      <div>
        <h1>정산 상세</h1>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px', color: 'rgba(0, 0, 0, 0.45)' }}>
            정산 정보를 찾을 수 없습니다.
          </div>
        </Card>
      </div>
    )
  }

  const program = programService.getByIdSync(settlement.programId)

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
          {/* <h1 style={{ margin: 0 }}>정산 상세</h1> */}
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/settlements/my')}>
            목록으로
          </Button>
        </Space>

        <Card>
          <Descriptions title="정산 정보" bordered column={2}>
            <Descriptions.Item label="정산 ID">{settlement.id}</Descriptions.Item>
            <Descriptions.Item label="상태">
              <StatusBadge status={settlement.status} statusConfig={settlementStatusStatusConfig} />
            </Descriptions.Item>
            <Descriptions.Item label="프로그램">
              {program ? (
                program.title
              ) : (
                <Tag color="error">프로그램 정보 오류 (ID: {settlement.programId.slice(-8)})</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="기간">{settlement.period}</Descriptions.Item>
            <Descriptions.Item label="총 정산 금액" span={2}>
              <strong style={{ fontSize: 18, color: '#1890ff' }}>
                {settlement.totalAmount.toLocaleString()}원
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="생성일">
              {dayjs(settlement.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="수정일">
              {dayjs(settlement.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {settlement.documentGeneratedAt && (
              <Descriptions.Item label="문서 생성일">
                {dayjs(settlement.documentGeneratedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            {settlement.notes && (
              <Descriptions.Item label="비고" span={2}>
                {settlement.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {settlement.calculationResult ? (
          <Card title="산출내역 (강사비 · 교통비)">
            <SettlementCalculationSummary result={settlement.calculationResult} />
          </Card>
        ) : (
          <Card title="정산 항목">
            <Descriptions bordered column={1}>
              {settlement.items.map((item, index) => (
                <Descriptions.Item key={index} label={item.type}>
                  {item.amount.toLocaleString()}원
                  {item.description && ` (${item.description})`}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        )}

        <Card title="증빙 파일">
          {settlement.attachments && settlement.attachments.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {settlement.attachments.map(file => (
                <Card key={file.id} size="small" style={{ background: '#fafafa' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space direction="vertical" size="small" style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{file.fileName}</div>
                      <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                        {file.fileSize != null ? `${(file.fileSize / 1024).toFixed(1)} KB` : '크기 정보 없음'}
                      </div>
                    </Space>
                    <Space>
                      <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => {
                          // TODO: 파일 미리보기 API 연결
                          message.info(MESSAGES.info.filePreviewComingSoon)
                        }}
                      >
                        미리보기
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        onClick={() => {
                          // TODO: 파일 다운로드 API 연결
                          message.info(MESSAGES.info.fileDownloadComingSoon)
                        }}
                      >
                        다운로드
                      </Button>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(0, 0, 0, 0.45)' }}>
              첨부된 파일이 없습니다.
            </div>
          )}
        </Card>

        {settlement.approvalHistories && settlement.approvalHistories.length > 0 && (
          <Card title="승인 이력">
            <Space direction="vertical" style={{ width: '100%' }}>
              {settlement.approvalHistories.map((history, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Tag>{history.actionLabel}</Tag>
                      {history.reviewerName && <span> - {history.reviewerName}</span>}
                    </div>
                    {history.comment && (
                      <div style={{ color: 'rgba(0, 0, 0, 0.65)' }}>{history.comment}</div>
                    )}
                    <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                      {dayjs(history.createdAt).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        )}
      </Space>
    </div>
  )
}

