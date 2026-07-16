/**
 * 문의하기 모달 — ContentModal 셸 + 폼
 */

import { Form, Input, Select } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'

const { TextArea } = Input
const { Option } = Select

interface InquiryFormData {
  category: '활동' | '봉사시간' | '시스템' | '정산' | '안내' | '기타'
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

  const handleSubmit = async (values: InquiryFormData) => {
    setSubmitting(true)
    try {
      // TODO: API 연동 필요
      console.log('Submitting inquiry:', values)
      // await submitInquiry(values)
      form.resetFields()
      onSuccess?.()
      onCancel()
    } catch (e) {
      console.error('Failed to submit inquiry:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <ContentModal
      open={open}
      title="문의하기"
      onCancel={handleCancel}
      width={700}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={handleCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            icon={<SendOutlined />}
            loading={submitting}
            className="cms-button--footer-auto"
            onClick={() => form.submit()}
          >
            문의 접수
          </CmsButton>
        </>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="문의 유형" name="category" rules={[{ required: true }]}>
          <Select placeholder="문의 유형을 선택하세요">
            <Option value="활동">활동 관련 (배정, 일정 등)</Option>
            <Option value="봉사시간">봉사시간 관련 (1365 연계 등)</Option>
            <Option value="정산">정산 관련 (교통비 등)</Option>
            <Option value="시스템">시스템 관련 (오류, 계정 등)</Option>
            <Option value="안내">일반 안내 (인증서 등)</Option>
            <Option value="기타">기타</Option>
          </Select>
        </Form.Item>

        <Form.Item label="제목" name="title" rules={[{ required: true }]}>
          <Input placeholder="문의 제목을 입력하세요" />
        </Form.Item>

        <Form.Item label="문의 내용" name="content" rules={[{ required: true }]}>
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

        <Form.Item label="연락처 전화번호 (선택)" name="contactPhone" style={{ marginBottom: 0 }}>
          <Input placeholder="답변 받을 전화번호 (선택사항)" />
        </Form.Item>
      </Form>
    </ContentModal>
  )
}
