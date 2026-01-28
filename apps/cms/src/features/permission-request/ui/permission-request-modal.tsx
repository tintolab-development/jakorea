/**
 * 권한 요청 모달 컴포넌트
 * Phase 0.5.2: 권한 요청 UX
 * 시니어 개발자 관점: 컴포넌트 분리
 */

import { Modal, Form, Input, DatePicker, Select, Button, Space, message } from 'antd'
import { MESSAGES } from '@/shared/constants'
import { usePermissionRequest } from '../hooks/use-permission-request'
import type { ProgramRole, PermissionAction } from '@/types/permission-request'
import type { UUID } from '@/types'
import dayjs from 'dayjs'

const { TextArea } = Input
const { RangePicker } = DatePicker

interface PermissionRequestModalProps {
  open: boolean
  programId: UUID
  programName: string
  requestedAction: PermissionAction
  onCancel: () => void
  onSuccess?: () => void
}

const roleOptions: { value: ProgramRole; label: string }[] = [
  { value: 'OWNER', label: '소유자' },
  { value: 'PARTNER', label: '파트너' },
  { value: 'ASSISTANT', label: '어시스턴트' },
]

export function PermissionRequestModal({
  open,
  programId,
  programName,
  requestedAction,
  onCancel,
  onSuccess,
}: PermissionRequestModalProps) {
  const [form] = Form.useForm()
  const { submitting, submitRequest } = usePermissionRequest()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const result = await submitRequest({
        programId,
        requestedRole: values.requestedRole,
        requestedAction,
        reason: values.reason,
        requestedPeriod: values.requestedPeriod
          ? {
              startDate: values.requestedPeriod[0].toISOString(),
              endDate: values.requestedPeriod[1].toISOString(),
            }
          : undefined,
      })

      if (result) {
        form.resetFields()
        onSuccess?.()
        onCancel()
      }
    } catch (error) {
      // Form validation error는 무시 (이미 표시됨)
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return
      }
      message.error(MESSAGES.error.permissionRequestSubmitFailed)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const actionLabels: Record<PermissionAction, string> = {
    VIEW: '조회',
    DOWNLOAD: '다운로드',
    EDIT: '수정',
  }

  return (
    <Modal
      open={open}
      title="권한 요청"
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="프로그램">
          <Input value={programName} disabled />
        </Form.Item>

        <Form.Item label="요청 권한">
          <Input value={actionLabels[requestedAction]} disabled />
        </Form.Item>

        <Form.Item
          label="요청 역할"
          name="requestedRole"
          rules={[{ required: true, message: '요청할 역할을 선택해주세요.' }]}
        >
          <Select placeholder="역할을 선택하세요" options={roleOptions} />
        </Form.Item>

        <Form.Item
          label="요청 사유"
          name="reason"
          rules={[{ required: true, message: '요청 사유를 입력해주세요.' }]}
        >
          <TextArea
            rows={4}
            placeholder="권한이 필요한 사유를 입력하세요"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="요청 기간 (선택사항)"
          name="requestedPeriod"
          tooltip="기간을 지정하지 않으면 기본 30일로 설정됩니다"
        >
          <RangePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            disabledDate={current => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} disabled={submitting}>
              취소
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              요청 제출
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
