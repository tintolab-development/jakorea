/**
 * 문의하기 모달 컴포넌트
 */

import { Modal, Form, Input, Select, Button, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { useState } from 'react'

const { TextArea } = Input
const { Option } = Select

interface InquiryFormData {
  category: string
  title: string
  content: string
  contactEmail?: string
  contactPhone?: string
}

interface InquiryModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

export function InquiryModal({ open, onCancel, onSuccess }: InquiryModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (_values: InquiryFormData) => {
    setSubmitting(true)
    try {
      // TODO: API 연동 필요
      // await submitInquiry(values)
      message.success('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.')
      form.resetFields()
      onSuccess?.()
      onCancel()
    } catch (error) {
      message.error('문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      open={open}
      title="문의하기"
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 24 }}
      >
        <Form.Item
          label="문의 유형"
          name="category"
          rules={[{ required: true, message: '문의 유형을 선택해주세요' }]}
        >
          <Select placeholder="문의 유형을 선택하세요">
            <Option value="settlement">정산 관련</Option>
            <Option value="program">프로그램 관련</Option>
            <Option value="account">계정 관련</Option>
            <Option value="technical">기술 지원</Option>
            <Option value="other">기타</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="제목"
          name="title"
          rules={[{ required: true, message: '제목을 입력해주세요' }]}
        >
          <Input placeholder="문의 제목을 입력하세요" />
        </Form.Item>

        <Form.Item
          label="문의 내용"
          name="content"
          rules={[{ required: true, message: '문의 내용을 입력해주세요' }]}
        >
          <TextArea
            rows={6}
            placeholder="문의 내용을 상세히 입력해주세요"
            showCount
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item label="연락처 이메일 (선택)" name="contactEmail">
          <Input type="email" placeholder="답변 받을 이메일 주소 (선택사항)" />
        </Form.Item>

        <Form.Item label="연락처 전화번호 (선택)" name="contactPhone">
          <Input placeholder="답변 받을 전화번호 (선택사항)" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={handleCancel}>취소</Button>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting}>
              문의 접수
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}
