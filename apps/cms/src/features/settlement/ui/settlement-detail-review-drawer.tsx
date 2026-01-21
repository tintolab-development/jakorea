/**
 * 정산 상세 검토 Drawer 컴포넌트
 * Phase 0.4.2: 관리자 정산 검토 - 증빙자료 확인, 승인/반려 버튼
 */

import { Drawer, Descriptions, Tag, Space, Button, Badge, Typography, Divider, Table, Card, List } from 'antd'
import { CheckOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons'
import type { Settlement } from '@/types/domain'
import {
  getSettlementStatusLabel,
  getSettlementStatusColor,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import { useSettlementDetail } from '../hooks/use-settlement-detail'
import { useSettlementReview } from '../hooks/use-settlement-review'
import './settlement-detail-drawer.css'

const { Text, Title } = Typography

interface SettlementDetailReviewDrawerProps {
  open: boolean
  settlement: Settlement | null
  onClose: () => void
  onApprove: (settlement: Settlement) => Promise<void>
  onReject: (settlement: Settlement) => Promise<void>
  loading?: boolean
}

export function SettlementDetailReviewDrawer({
  open,
  settlement,
  onClose,
  onApprove,
  onReject,
  loading,
}: SettlementDetailReviewDrawerProps) {
  const {
    programTitle,
    instructorName,
    matchingLabel,
    itemColumns,
  } = useSettlementDetail(settlement, async () => {})

  const {
    canApprove,
    canReject,
    handleApprove,
    handleReject,
  } = useSettlementReview(settlement, onApprove, onReject)

  if (!settlement) return null

  return (
    <Drawer
      title={
        <Space>
          <Title level={4} className="settlement-detail-drawer__title">
            정산 상세 검토
          </Title>
          <Badge status={getSettlementStatusColor(settlement.status) as any} text={getSettlementStatusLabel(settlement.status)} />
        </Space>
      }
      placement="right"
      width={720}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          {canApprove && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleApprove()}
              loading={loading}
            >
              승인
            </Button>
          )}
          {canReject && (
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => handleReject()}
              loading={loading}
            >
              반려
            </Button>
          )}
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

      {/* 증빙자료 확인 */}
      <Card title="증빙자료 확인" size="small">
        {settlement.attachments && settlement.attachments.length > 0 ? (
          <List
            dataSource={settlement.attachments}
            renderItem={(file) => (
              <List.Item>
                <Space>
                  <FileTextOutlined style={{ color: '#1890ff' }} />
                  <Text>{file.fileName}</Text>
                  {file.fileSize && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      ({(file.fileSize / 1024).toFixed(2)} KB)
                    </Text>
                  )}
                </Space>
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">증빙자료가 없습니다.</Text>
        )}
      </Card>

      <Divider />

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
