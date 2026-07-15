/**
 * 강사용 정산 상세 페이지
 * Phase 5.2.4: 본인 정산 정보
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Space, Spin } from 'antd'
import { CmsButton } from '@/shared/ui'
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMySettlementDetail } from '@/entities/settlement/api/instructor-settlement-service'
import { getStatusConfigAccentColor, settlementStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/components/status-badge'
import { useProgramService } from '@/features/program/general/hooks/use-program-service'
import { SettlementCalculationSummary } from '@/features/settlement/ui/settlement-calculation-summary'
import { paymentStatementService } from '@/entities/settlement/api/payment-statement-service'
import dayjs from 'dayjs'
import type { Settlement } from '@/types/domain'
import { ConfirmModal } from '@/shared/ui/confirm-modal'

export function MySettlementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { getByIdSync: getProgramByIdSync } = useProgramService()
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)

  const loadSettlement = useCallback(async () => {
    if (!id || !user?.instructorId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getMySettlementDetail(user.instructorId, id)
      if (data) {
        setSettlement(data)
      } else {
        navigate('/settlements/my')
      }
    } catch (error) {
      console.error('정산 로드 실패:', error)
      navigate('/settlements/my')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, user?.instructorId])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    if (user?.instructorId) {
      void loadSettlement()
      return
    }
    setLoading(false)
  }, [id, user?.instructorId, loadSettlement])

  // 지급조서 확인 완료 처리
  const handleConfirmPaymentStatement = useCallback(() => {
    if (!settlement || !user?.instructorId) return
    setPaymentConfirmOpen(true)
  }, [settlement, user?.instructorId])

  const handlePaymentConfirmOk = useCallback(async () => {
    if (!settlement || !user?.instructorId) return
    setConfirming(true)
    try {
      const paymentStatement = await paymentStatementService.getBySettlementId(settlement.id)
      if (!paymentStatement) {
        return
      }
      await paymentStatementService.confirmByInstructor(paymentStatement.id)
      await loadSettlement()
      setPaymentConfirmOpen(false)
    } catch (error: unknown) {
      console.error('지급조서 확인 실패:', error)
    } finally {
      setConfirming(false)
    }
  }, [loadSettlement, settlement, user?.instructorId])

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
      <div
        className="page-content-loading page-content-loading--viewport"
        role="status"
        aria-label="정산 불러오는 중"
      >
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

  const program = getProgramByIdSync(settlement.programId)

  // 지급조서 확인 가능 여부 (승인된 정산이고 아직 확인하지 않은 경우)
  const canConfirmPaymentStatement =
    settlement.status === 'approved' && user?.instructorId === settlement.instructorId

  // 지급조서 확인 상태 확인
  const [paymentStatement, setPaymentStatement] = useState<any>(null)
  useEffect(() => {
    if (settlement) {
      paymentStatementService
        .getBySettlementId(settlement.id)
        .then(ps => {
          setPaymentStatement(ps)
        })
        .catch(() => {
          setPaymentStatement(null)
        })
    }
  }, [settlement])

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
          {/* <h1 style={{ margin: 0 }}>정산 상세</h1> */}
          <CmsButton variant="default" icon={<ArrowLeftOutlined />} onClick={() => navigate('/settlements/my')}>
            목록으로
          </CmsButton>
        </Space>

        {/* 지급조서 확인 섹션 */}
        {canConfirmPaymentStatement &&
          paymentStatement &&
          !paymentStatement.instructorConfirmed && (
            <Card
              title="지급조서 확인"
              style={{ border: '2px solid #1890ff', background: '#f0f9ff' }}
              extra={
                <CmsButton
                  variant="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleConfirmPaymentStatement}
                  loading={confirming}
                  size="large"
                >
                  지급조서 확인 완료
                </CmsButton>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.65)' }}>
                  지급조서 내용을 확인하신 후, 아래 버튼을 클릭하여 확인 완료를 진행해주세요. 확인
                  완료 시 계좌로 지급이 진행됩니다.
                </p>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="지급 금액">
                    <strong style={{ fontSize: 16, color: '#1890ff' }}>
                      {paymentStatement.totalAmount.toLocaleString('ko-KR')}원
                    </strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="지급조서 생성일">
                    {dayjs(paymentStatement.generatedAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            </Card>
          )}

        {/* 지급조서 확인 완료 상태 표시 */}
        {paymentStatement?.instructorConfirmed && (
          <Card
            title="지급조서 확인 완료"
            style={{ border: '2px solid #52c41a', background: '#f6ffed' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tag color="success" icon={<CheckCircleOutlined />}>
                확인 완료
              </Tag>
              {paymentStatement.instructorConfirmedAt && (
                <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.65)' }}>
                  확인 완료일:{' '}
                  {dayjs(paymentStatement.instructorConfirmedAt).format('YYYY-MM-DD HH:mm')}
                </p>
              )}
              {paymentStatement.paymentCompleted && <Tag color="success">계좌 지급 완료</Tag>}
            </Space>
          </Card>
        )}

        <Card>
          <Descriptions title="정산 정보" bordered column={2}>
            <Descriptions.Item label="정산 ID">{settlement.id}</Descriptions.Item>
            <Descriptions.Item label="상태">
              <StatusBadge
                domain="custom"
                label={settlementStatusStatusConfig[settlement.status].label}
                accentColor={getStatusConfigAccentColor(
                  settlementStatusStatusConfig[settlement.status].color
                )}
              />
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
                  {item.amount.toLocaleString()}원{item.description && ` (${item.description})`}
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
                        {file.fileSize != null
                          ? `${(file.fileSize / 1024).toFixed(1)} KB`
                          : '크기 정보 없음'}
                      </div>
                    </Space>
                    <Space>
                      <CmsButton
                        variant="default"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => {
                          // TODO: 파일 미리보기 API 연결
                        }}
                      >
                        미리보기
                      </CmsButton>
                      <CmsButton
                        variant="default"
                        icon={<DownloadOutlined />}
                        size="small"
                        onClick={() => {
                          // TODO: 파일 다운로드 API 연결
                        }}
                      >
                        다운로드
                      </CmsButton>
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

      <ConfirmModal
        open={paymentConfirmOpen}
        title="지급조서 확인 완료"
        content="지급조서 내용을 확인하셨습니까? 확인 완료 시 계좌로 지급이 진행됩니다."
        confirmText="확인 완료"
        cancelText="취소"
        onConfirm={handlePaymentConfirmOk}
        onCancel={() => setPaymentConfirmOpen(false)}
      />
    </div>
  )
}
