/**
 * 정산 상세 Drawer 컴포넌트
 * Phase 4: 사이드 패널로 상세 정보 표시
 */

import { Drawer, Descriptions, Tag, Space, Button, Badge, Typography, Divider, Table, message, Radio } from 'antd'
import { EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import type { Settlement } from '@/types/domain'
import { SettlementApprovalWorkflow } from './settlement-approval-workflow'
import {
  getSettlementStatusLabel,
  getSettlementStatusColor,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import { useSettlementDetail } from '../hooks/use-settlement-detail'
import { PaymentInfoSection } from './payment-info-section'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { useState } from 'react'
import './settlement-detail-drawer.css'

const { Text, Title } = Typography

interface SettlementDetailDrawerProps {
  open: boolean
  settlement: Settlement | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Settlement['status']) => Promise<void>
  loading?: boolean
}

export function SettlementDetailDrawer({
  open,
  settlement,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  loading,
}: SettlementDetailDrawerProps) {
  const {
    programTitle,
    instructorName,
    matchingLabel,
    canDownload,
    itemColumns,
    changeStatus,
    rollbackStatus,
  } = useSettlementDetail(settlement, onStatusChange)
  
  const [downloadFormat, setDownloadFormat] = useState<'excel' | 'pdf'>('excel')
  const instructor = settlement ? instructorService.getByIdSync(settlement.instructorId) : null

  if (!settlement) return null

  return (
    <Drawer
      title={
        <Space>
          <Title level={4} className="settlement-detail-drawer__title">
            정산 상세
          </Title>
          <Badge status={getSettlementStatusColor(settlement.status) as any} text={getSettlementStatusLabel(settlement.status)} />
        </Space>
      }
      placement="right"
      width={660}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          {canDownload && (
            <Space>
              <Radio.Group
                value={downloadFormat}
                onChange={e => setDownloadFormat(e.target.value)}
                size="small"
              >
                <Radio.Button value="excel">Excel</Radio.Button>
                <Radio.Button value="pdf">PDF</Radio.Button>
              </Radio.Group>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={async () => {
                  if (!settlement || !programTitle || !instructor) return
                  try {
                    const { generatePaymentStatement } = await import('@/shared/utils/settlement-document')
                    await generatePaymentStatement(settlement, instructor, programTitle, undefined, downloadFormat)
                    message.success(`지급조서(${downloadFormat.toUpperCase()})가 다운로드되었습니다`)
                  } catch (error) {
                    console.error('Failed to download payment statement:', error)
                    message.error('지급조서 다운로드 중 오류가 발생했습니다')
                  }
                }}
              >
                지급조서 다운로드
              </Button>
            </Space>
          )}
          <Button icon={<EditOutlined />} onClick={onEdit}>
            수정
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={onDelete} loading={loading}>
            삭제
          </Button>
        </Space>
      }
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="기간">
          <Tag color="geekblue">{settlement.period}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="프로그램">
          {programTitle ? (
            <Tag color={domainColorsHex.program.primary}>{programTitle}</Tag>
          ) : (
            <Tag color="error">프로그램 정보 오류 (ID: {settlement.programId.slice(-8)})</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="강사">{instructorName || '-'}</Descriptions.Item>
        <Descriptions.Item label="매칭">
          {matchingLabel || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <Badge status={getSettlementStatusColor(settlement.status) as any} text={getSettlementStatusLabel(settlement.status)} />
        </Descriptions.Item>
        {settlement.documentGeneratedAt && (
          <Descriptions.Item label="문서 생성일">
            {new Date(settlement.documentGeneratedAt).toLocaleString('ko-KR')}
          </Descriptions.Item>
        )}
        {settlement.notes && <Descriptions.Item label="비고">{settlement.notes}</Descriptions.Item>}
        <Descriptions.Item label="등록일">
          {new Date(settlement.createdAt).toLocaleString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {new Date(settlement.updatedAt).toLocaleString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* 승인 워크플로우 */}
      <SettlementApprovalWorkflow
        settlement={settlement}
        onCalculate={() => {
          if (settlement.status === 'pending') {
            void changeStatus('calculated')
          } else {
            message.warning('현재 상태에서는 산출 완료 처리를 할 수 없습니다.')
          }
        }}
        onApprove={() => {
          // 상태에 따라 승인/지급 완료 처리 분기
          if (settlement.status === 'review') {
            // 검토 -> 승인
            void changeStatus('approved')
          } else if (settlement.status === 'approved') {
            // 승인 -> 지급 완료
            void changeStatus('paid')
          }
        }}
        onReject={() => {
          // 산출 완료/검토 단계에서만 반려(취소) 허용
          if (settlement.status === 'calculated' || settlement.status === 'review') {
            void changeStatus('cancelled')
          } else {
            message.warning('현재 상태에서는 반려할 수 없습니다.')
          }
        }}
        onReview={() => {
          // 산출 완료 -> 검토 (정방향 진행만 담당)
          if (settlement.status === 'calculated') {
            void changeStatus('review')
          } else {
            message.warning('검토 단계 진입은 산출 완료 상태에서만 가능합니다.')
          }
        }}
        onRollback={() => void rollbackStatus()}
        loading={loading}
      />

      <Divider />

      {/* 지급정보 섹션 (V3 Phase 4) */}
      {instructor && (
        <>
          <Title level={5}>지급정보</Title>
          <PaymentInfoSection
            instructor={instructor}
            readOnly={settlement.status === 'paid'}
          />
          <Divider />
        </>
      )}

      <Title level={5}>정산 항목</Title>
      <Table
        dataSource={settlement.items}
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
                <Text strong>{settlement.totalAmount.toLocaleString('ko-KR')}원</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Drawer>
  )
}

