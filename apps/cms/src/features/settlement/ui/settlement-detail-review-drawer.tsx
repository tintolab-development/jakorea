/**
 * 정산 상세 검토 Drawer 컴포넌트
 * Phase 0.4.2: 관리자 정산 검토 - 증빙자료 확인, 승인/반려 버튼
 */

import { useState } from 'react'
import { Drawer, Descriptions, Tag, Space, Button, Badge, Typography, Divider, Table, Card, List, Modal, Form, InputNumber, Input, message } from 'antd'
import { CheckOutlined, CloseOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons'
import type { Settlement, SettlementItem } from '@/types/domain'
import {
  getSettlementStatusLabel,
  getSettlementStatusColor,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import { useSettlementDetail } from '../hooks/use-settlement-detail'
import { useSettlementReview } from '../hooks/use-settlement-review'
import { settlementService } from '@/entities/settlement/api/settlement-service'
import './settlement-detail-drawer.css'

const { Text, Title } = Typography

interface SettlementDetailReviewDrawerProps {
  open: boolean
  settlement: Settlement | null
  onClose: () => void
  onApprove: (settlement: Settlement) => Promise<void>
  onReject: (settlement: Settlement) => Promise<void>
  onUpdate?: (settlement: Settlement) => Promise<void> // Phase 0.4.2: 금액 조정 후 업데이트 콜백
  loading?: boolean
}

export function SettlementDetailReviewDrawer({
  open,
  settlement,
  onClose,
  onApprove,
  onReject,
  onUpdate,
  loading,
}: SettlementDetailReviewDrawerProps) {
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustingItem, setAdjustingItem] = useState<SettlementItem | null>(null)
  const [adjustForm] = Form.useForm()
  const [adjusting, setAdjusting] = useState(false)

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

  const handleOpenAdjustModal = (item: SettlementItem) => {
    setAdjustingItem(item)
    adjustForm.setFieldsValue({
      amount: item.amount,
      reason: '',
    })
    setAdjustModalOpen(true)
  }

  const handleAdjustAmount = async () => {
    if (!settlement || !adjustingItem) return

    try {
      const values = await adjustForm.validateFields()
      setAdjusting(true)

      // items 배열에서 해당 항목 찾아서 금액 업데이트
      const updatedItems = settlement.items.map(item =>
        item === adjustingItem
          ? { ...item, amount: values.amount }
          : item
      )

      // 조정 사유를 notes에 추가 (기존 notes가 있으면 이어서)
      const adjustmentNote = `[금액 조정] ${adjustingItem.description}: ${adjustingItem.amount.toLocaleString()}원 → ${values.amount.toLocaleString()}원${values.reason ? ` (사유: ${values.reason})` : ''}`
      const updatedNotes = settlement.notes
        ? `${settlement.notes}\n${adjustmentNote}`
        : adjustmentNote

      const updated = await settlementService.update(settlement.id, {
        items: updatedItems,
        notes: updatedNotes,
      })

      message.success('금액이 조정되었습니다')
      setAdjustModalOpen(false)
      adjustForm.resetFields()
      setAdjustingItem(null)

      // 부모 컴포넌트에 업데이트 알림
      if (onUpdate) {
        await onUpdate(updated)
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return
      }
      console.error('Failed to adjust amount:', error)
      message.error('금액 조정 중 오류가 발생했습니다')
    } finally {
      setAdjusting(false)
    }
  }

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
        columns={[
          ...itemColumns,
          // Phase 0.4.2: 금액 조정 버튼 (교통비, 숙박비만)
          {
            title: '조정',
            key: 'adjust',
            width: 80,
            render: (_: unknown, record: SettlementItem) => {
              const isAdjustable = record.type === 'transportation' || record.type === 'accommodation'
              if (!isAdjustable || !canApprove) return null
              return (
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenAdjustModal(record)
                  }}
                >
                  조정
                </Button>
              )
            },
          },
        ]}
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

      {/* Phase 0.4.2: 금액 조정 모달 */}
      <Modal
        title="금액 조정"
        open={adjustModalOpen}
        onCancel={() => {
          setAdjustModalOpen(false)
          adjustForm.resetFields()
          setAdjustingItem(null)
        }}
        onOk={handleAdjustAmount}
        confirmLoading={adjusting}
        okText="조정"
        cancelText="취소"
      >
        {adjustingItem && (
          <Form form={adjustForm} layout="vertical">
            <Form.Item label="항목">
              <Text>{adjustingItem.description}</Text>
            </Form.Item>
            <Form.Item label="현재 금액">
              <Text>{adjustingItem.amount.toLocaleString('ko-KR')}원</Text>
            </Form.Item>
            <Form.Item
              name="amount"
              label="조정 금액"
              rules={[
                { required: true, message: '조정 금액을 입력해주세요' },
                { type: 'number', min: 0, message: '금액은 0 이상이어야 합니다' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) as unknown as 0}
                suffix="원"
              />
            </Form.Item>
            <Form.Item
              name="reason"
              label="조정 사유 (선택사항)"
            >
              <Input.TextArea rows={3} placeholder="금액 조정 사유를 입력해주세요" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Drawer>
  )
}
