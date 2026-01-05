/**
 * 승인/반려 모달 컴포넌트
 * Phase 4.3.3: 승인 프로세스
 */

import { Modal, Input, Form, Button, Space } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { approvalSchema, type ApprovalFormData } from '@/entities/interview/model/schema'
import type { Interview } from '@/types/interview'

const { TextArea } = Input

interface ApprovalModalProps {
  open: boolean
  interview: Interview | null
  onApprove: (reason?: string) => Promise<void>
  onCancel: () => void
  isReject?: boolean
}

export function ApprovalModal({
  open,
  interview: _interview,
  onApprove,
  onCancel,
  isReject = false,
}: ApprovalModalProps) {
  // interview는 현재 사용하지 않지만 향후 확장을 위해 유지
  void _interview
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      approved: !isReject,
    },
  })

  const onFormSubmit = async (data: ApprovalFormData) => {
    await onApprove(data.reason)
    reset()
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  return (
    <Modal
      open={open}
      title={isReject ? '반려 처리' : '승인 처리'}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
        <Controller
          name="reason"
          control={control}
          render={({ field }) => (
            <Form.Item label={isReject ? '반려 사유' : '승인 메모 (선택사항)'}>
              <TextArea
                {...field}
                rows={4}
                placeholder={isReject ? '반려 사유를 입력해주세요' : '승인 메모를 입력해주세요 (선택사항)'}
              />
            </Form.Item>
          )}
        />

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} disabled={isSubmitting}>
              취소
            </Button>
            <Button
              type="primary"
              danger={isReject}
              htmlType="submit"
              loading={isSubmitting}
            >
              {isReject ? '반려' : '승인'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

