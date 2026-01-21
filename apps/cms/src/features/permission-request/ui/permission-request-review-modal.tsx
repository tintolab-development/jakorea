/**
 * 권한 요청 검토 모달 컴포넌트
 * Phase 0.5.2: 권한 요청 UX
 * 시니어 개발자 관점: 컴포넌트 분리
 */

import { useState } from 'react'
import { Modal, Form, Input, DatePicker, Radio, Button, Space, Descriptions, Tag } from 'antd'
import type { PermissionRequest, ReviewPermissionRequestInput } from '@/types/permission-request'
import dayjs from 'dayjs'

const { TextArea } = Input
const { RangePicker } = DatePicker

interface PermissionRequestReviewModalProps {
  open: boolean
  request: PermissionRequest
  onApprove: (input: ReviewPermissionRequestInput) => Promise<void>
  onReject: (input: ReviewPermissionRequestInput) => Promise<void>
  onCancel: () => void
}

const actionLabels: Record<PermissionRequest['requestedAction'], string> = {
  VIEW: '조회',
  DOWNLOAD: '다운로드',
  EDIT: '수정',
}

const roleLabels: Record<PermissionRequest['requestedRole'], string> = {
  OWNER: '소유자',
  PARTNER: '파트너',
  ASSISTANT: '어시스턴트',
}

export function PermissionRequestReviewModal({
  open,
  request,
  onApprove,
  onReject,
  onCancel,
}: PermissionRequestReviewModalProps) {
  const [form] = Form.useForm()
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const input: ReviewPermissionRequestInput = {
        requestId: request.id,
        approved: action === 'approve',
        reviewComment: values.reviewComment,
        grantedPeriod: values.grantedPeriod
          ? {
              startDate: values.grantedPeriod[0].toISOString(),
              endDate: values.grantedPeriod[1].toISOString(),
            }
          : undefined,
      }

      if (action === 'approve') {
        await onApprove(input)
      } else {
        await onReject(input)
      }
    } catch (error) {
      // Form validation error는 무시
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setAction('approve')
    onCancel()
  }

  return (
    <Modal
      open={open}
      title="권한 요청 검토"
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnHidden
    >
      <Descriptions column={1} bordered style={{ marginBottom: 24 }}>
        <Descriptions.Item label="요청자">{request.requesterName}</Descriptions.Item>
        <Descriptions.Item label="프로그램">{request.programName}</Descriptions.Item>
        <Descriptions.Item label="요청 역할">
          <Tag>{roleLabels[request.requestedRole]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="요청 권한">
          <Tag>{actionLabels[request.requestedAction]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="요청 사유">
          <div style={{ whiteSpace: 'pre-wrap' }}>{request.reason}</div>
        </Descriptions.Item>
        {request.requestedPeriod && (
          <Descriptions.Item label="요청 기간">
            {new Date(request.requestedPeriod.startDate).toLocaleDateString('ko-KR')} ~{' '}
            {new Date(request.requestedPeriod.endDate).toLocaleDateString('ko-KR')}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="요청일">
          {new Date(request.createdAt).toLocaleString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item label="처리 결정" required>
          <Radio.Group value={action} onChange={(e) => setAction(e.target.value)}>
            <Radio value="approve">승인</Radio>
            <Radio value="reject">거부</Radio>
          </Radio.Group>
        </Form.Item>

        {action === 'approve' && (
          <Form.Item
            label="부여 기간"
            name="grantedPeriod"
            tooltip="기간을 지정하지 않으면 요청 기간 또는 기본 30일로 설정됩니다"
          >
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        )}

        <Form.Item
          label={action === 'approve' ? '승인 메모 (선택사항)' : '거부 사유'}
          name="reviewComment"
          rules={action === 'reject' ? [{ required: true, message: '거부 사유를 입력해주세요.' }] : []}
        >
          <TextArea
            rows={3}
            placeholder={action === 'approve' ? '승인 메모를 입력하세요' : '거부 사유를 입력해주세요'}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} disabled={submitting}>
              취소
            </Button>
            <Button
              type="primary"
              danger={action === 'reject'}
              htmlType="submit"
              loading={submitting}
            >
              {action === 'approve' ? '승인' : '거부'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
