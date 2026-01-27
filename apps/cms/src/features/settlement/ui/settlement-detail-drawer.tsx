/**
 * 정산 상세 Drawer 컴포넌트
 * Phase 4: 사이드 패널로 상세 정보 표시
 */

import {
  Descriptions,
  Tag,
  Space,
  Typography,
  Divider,
  Table,
  message,
  Radio,
  Button,
  Card,
  List,
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { Settlement } from '@/types/domain'
import { SettlementApprovalWorkflow } from './settlement-approval-workflow'
import { settlementStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { MESSAGES } from '@/shared/constants'
import { domainColorsHex } from '@/shared/constants/colors'
import { useSettlementDetail } from '../hooks/use-settlement-detail'
import { PaymentInfoSection } from './payment-info-section'
import { useInstructorService } from '@/features/instructor/hooks/use-instructor-service'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { useState } from 'react'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { BaseDetailDrawer } from '@/shared/ui/base-detail-drawer'
import './settlement-detail-drawer.css'

const { Text, Title } = Typography

interface SettlementDetailDrawerProps {
  open: boolean
  settlement?: Settlement | null // optional로 변경하여 store의 selectedSettlement 우선 사용
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Settlement['status']) => Promise<void>
  loading?: boolean
  zIndex?: number
}

export function SettlementDetailDrawer({
  open,
  settlement,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  loading,
  zIndex,
}: SettlementDetailDrawerProps) {
  const { selectedSettlement: storeSelectedSettlement } = useSettlementStore()
  const { getByIdSync: getInstructorByIdSync } = useInstructorService()

  // prop의 settlement를 우선 사용 (즉시 표시), 없으면 store의 selectedSettlement 사용
  const displaySettlement = settlement || storeSelectedSettlement || null

  const {
    programTitle,
    instructorName,
    matchingLabel,
    canDownload,
    itemColumns,
    changeStatus,
    rollbackStatus,
  } = useSettlementDetail(displaySettlement, onStatusChange)

  const [downloadFormat, setDownloadFormat] = useState<'excel' | 'pdf'>('excel')
  const instructor = displaySettlement
    ? getInstructorByIdSync(displaySettlement.instructorId)
    : null

  // 다운로드 핸들러
  const handleDownload = async () => {
    if (!displaySettlement || !programTitle || !instructor) return
    try {
      const { generatePaymentStatement } = await import('@/shared/utils/settlement-document')
      await generatePaymentStatement(
        displaySettlement,
        instructor,
        programTitle,
        undefined,
        downloadFormat
      )
      message.success(MESSAGES.success.paymentStatementDownloaded)
    } catch (error) {
      console.error('Failed to download payment statement:', error)
      message.error(MESSAGES.error.paymentStatementDownloadFailed)
    }
  }

  if (!displaySettlement) return null

  // 액션 버튼 구성
  const actions = [
    {
      key: 'edit',
      label: '수정',
      onClick: onEdit,
      icon: <EditOutlined />,
    },
    {
      key: 'delete',
      label: '삭제',
      onClick: onDelete,
      danger: true,
      icon: <DeleteOutlined />,
      loading,
    },
  ]

  // 다운로드 extra 영역
  const downloadExtra = canDownload ? (
    <Space>
      <Radio.Group
        value={downloadFormat}
        onChange={e => setDownloadFormat(e.target.value)}
        size="small"
      >
        <Radio.Button value="excel">Excel</Radio.Button>
        <Radio.Button value="pdf">PDF</Radio.Button>
      </Radio.Group>
      <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
        지급조서 다운로드
      </Button>
    </Space>
  ) : undefined

  return (
    <BaseDetailDrawer
      open={open}
      onClose={onClose}
      title={
        <Space>
          <Title level={4} className="settlement-detail-drawer__title">
            정산 상세
          </Title>
          <StatusBadge
            status={displaySettlement.status}
            statusConfig={settlementStatusStatusConfig}
            variant="badge"
          />
        </Space>
      }
      width={LAYOUT_CONSTANTS.widths.modal.medium}
      loading={loading}
      actions={actions}
      extra={downloadExtra}
      zIndex={zIndex}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="기간">
          <Tag color="geekblue">{displaySettlement.period}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="프로그램">
          {programTitle ? (
            <Tag color={domainColorsHex.program.primary}>{programTitle}</Tag>
          ) : (
            <Tag color="error">
              프로그램 정보 오류 (ID: {displaySettlement.programId.slice(-8)})
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="강사">{instructorName || '-'}</Descriptions.Item>
        <Descriptions.Item label="매칭">{matchingLabel || '-'}</Descriptions.Item>
        <Descriptions.Item label="상태">
          <StatusBadge
            status={displaySettlement.status}
            statusConfig={settlementStatusStatusConfig}
            variant="badge"
          />
        </Descriptions.Item>
        {displaySettlement.documentGeneratedAt && (
          <Descriptions.Item label="문서 생성일">
            {new Date(displaySettlement.documentGeneratedAt).toLocaleString('ko-KR')}
          </Descriptions.Item>
        )}
        {displaySettlement.notes && (
          <Descriptions.Item label="비고">{displaySettlement.notes}</Descriptions.Item>
        )}
        <Descriptions.Item label="등록일">
          {new Date(displaySettlement.createdAt).toLocaleString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {new Date(displaySettlement.updatedAt).toLocaleString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* 승인 워크플로우 */}
      <SettlementApprovalWorkflow
        settlement={displaySettlement}
        onCalculate={() => {
          if (displaySettlement.status === 'pending') {
            void changeStatus('calculated')
          } else {
            message.warning(MESSAGES.warning.cannotProcessCalculated)
          }
        }}
        onApprove={() => {
          // 상태에 따라 승인/지급 완료 처리 분기
          if (displaySettlement.status === 'review') {
            // 검토 -> 승인
            void changeStatus('approved')
          } else if (displaySettlement.status === 'approved') {
            // 승인 -> 지급 완료
            void changeStatus('paid')
          }
        }}
        onReject={() => {
          // 산출 완료/검토 단계에서만 반려(취소) 허용
          if (displaySettlement.status === 'calculated' || displaySettlement.status === 'review') {
            void changeStatus('cancelled')
          } else {
            message.warning(MESSAGES.warning.cannotRejectCurrentStatus)
          }
        }}
        onReview={() => {
          // 산출 완료 -> 검토 (정방향 진행만 담당)
          if (displaySettlement.status === 'calculated') {
            void changeStatus('review')
          } else {
            message.warning(MESSAGES.warning.reviewOnlyFromCalculated)
          }
        }}
        onRollback={() => void rollbackStatus()}
        loading={loading}
      />

      <Divider />

      {/* 교통비 영수증 확인 섹션 */}
      {(() => {
        const transportItem = displaySettlement.items.find(item => item.type === 'transportation')
        const hasTransportFee = transportItem && transportItem.amount > 0
        const transportAttachments =
          displaySettlement.attachments?.filter(
            att =>
              att.fileName?.toLowerCase().includes('교통') ||
              att.fileName?.toLowerCase().includes('주유') ||
              att.fileName?.toLowerCase().includes('통행') ||
              att.fileName?.toLowerCase().includes('fuel') ||
              att.fileName?.toLowerCase().includes('toll')
          ) || []
        const calculationBreakdown = displaySettlement.calculationResult?.breakdown

        if (!hasTransportFee) return null

        return (
          <>
            <Title level={5}>교통비 영수증 확인</Title>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* 산출 내역 */}
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    산출 내역
                  </Text>
                  <Descriptions column={2} size="small" bordered>
                    {calculationBreakdown?.fuelCost !== undefined && (
                      <Descriptions.Item label="주유비">
                        {calculationBreakdown.fuelCost.toLocaleString('ko-KR')}원
                      </Descriptions.Item>
                    )}
                    {calculationBreakdown?.tollFee !== undefined && (
                      <Descriptions.Item label="통행료">
                        {calculationBreakdown.tollFee.toLocaleString('ko-KR')}원
                      </Descriptions.Item>
                    )}
                    {calculationBreakdown?.distance !== undefined && (
                      <Descriptions.Item label="거리">
                        {calculationBreakdown.distance}km
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="교통비 합계">
                      <Text strong>{transportItem.amount.toLocaleString('ko-KR')}원</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </div>

                {/* 첨부된 영수증 */}
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    첨부된 영수증
                  </Text>
                  {transportAttachments.length > 0 ? (
                    <List
                      dataSource={transportAttachments}
                      renderItem={file => (
                        <List.Item>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <FileTextOutlined style={{ color: '#1890ff' }} />
                              <Text>{file.fileName}</Text>
                              {file.fileSize && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  ({(file.fileSize / 1024).toFixed(2)} KB)
                                </Text>
                              )}
                            </Space>
                            <Button
                              type="link"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => {
                                // TODO: 파일 미리보기 API 연결
                                message.info('파일 미리보기 기능은 준비 중입니다.')
                              }}
                            >
                              미리보기
                            </Button>
                          </Space>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Text type="secondary">교통비 영수증이 첨부되지 않았습니다.</Text>
                  )}
                </div>

                {/* 통행료 증빙 검토 상태 */}
                {displaySettlement.tollReceiptReview && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      검토 상태
                    </Text>
                    {displaySettlement.tollReceiptReview.status === 'pending' && (
                      <Tag color="processing">검토 대기</Tag>
                    )}
                    {displaySettlement.tollReceiptReview.status === 'approved' && (
                      <Space direction="vertical" size={4}>
                        <Tag color="success">검토 완료</Tag>
                        {displaySettlement.tollReceiptReview.reviewedAt && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(
                              displaySettlement.tollReceiptReview.reviewedAt
                            ).toLocaleString('ko-KR')}
                          </Text>
                        )}
                      </Space>
                    )}
                    {displaySettlement.tollReceiptReview.status === 'rejected' && (
                      <Space direction="vertical" size={4}>
                        <Tag color="error">반려</Tag>
                        {displaySettlement.tollReceiptReview.comment && (
                          <Text type="secondary">
                            {displaySettlement.tollReceiptReview.comment}
                          </Text>
                        )}
                        {displaySettlement.tollReceiptReview.reviewedAt && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(
                              displaySettlement.tollReceiptReview.reviewedAt
                            ).toLocaleString('ko-KR')}
                          </Text>
                        )}
                      </Space>
                    )}
                  </div>
                )}
              </Space>
            </Card>
            <Divider />
          </>
        )
      })()}

      {/* 지급정보 섹션 (V3 Phase 4) */}
      {instructor && (
        <>
          <Title level={5}>지급정보</Title>
          <PaymentInfoSection
            instructor={instructor}
            readOnly={displaySettlement.status === 'paid'}
          />
          <Divider />
        </>
      )}

      <Title level={5}>정산 항목</Title>
      <Table
        dataSource={displaySettlement.items}
        columns={itemColumns}
        rowKey={(record, index) => `${record.type}-${index}`}
        pagination={false}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <Text strong>총액</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Text strong>{displaySettlement.totalAmount.toLocaleString('ko-KR')}원</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </BaseDetailDrawer>
  )
}
