import { useEffect } from 'react'
import { Form } from 'antd'
import type { SponsorContactType } from '@/features/sponsor/model/sponsor-management.types'
import { ContentModal, CmsButton, CmsInput, CmsRadioGroup } from '@/shared/ui'
import './sponsor-contact-register-modal.css'

type SponsorContactRegisterFormValues = {
  contactType: SponsorContactType
  name: string
  position?: string
  phone?: string
  email?: string
}

export interface SponsorContactRegisterPayload {
  contactType: SponsorContactType
  name: string
  position: string
  phone: string
  email: string
}

interface SponsorContactRegisterModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (payload: SponsorContactRegisterPayload) => void
}

export function SponsorContactRegisterModal({
  open,
  onCancel,
  onSubmit,
}: SponsorContactRegisterModalProps) {
  const [form] = Form.useForm<SponsorContactRegisterFormValues>()

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      contactType: 'lead',
      name: '',
      position: '',
      phone: '',
      email: '',
    })
  }, [form, open])

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const handleFinish = (values: SponsorContactRegisterFormValues) => {
    onSubmit({
      contactType: values.contactType,
      name: values.name.trim(),
      position: values.position?.trim() ?? '',
      phone: values.phone?.trim() ?? '',
      email: values.email?.trim() ?? '',
    })
    form.resetFields()
  }

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="담당자 등록"
      width={600}
      className="sponsor-contact-register-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={handleCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="large" onClick={() => form.submit()}>
            등록
          </CmsButton>
        </>
      }
    >
      <Form<SponsorContactRegisterFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        className="sponsor-contact-register-modal__form"
        onFinish={handleFinish}
      >
        <Form.Item
          name="contactType"
          label="담당자 유형"
          className="sponsor-contact-register-modal__field"
          rules={[{ required: true, message: '담당자 유형을 선택해 주세요.' }]}
        >
          <CmsRadioGroup
            size="large"
            options={[
              { label: '주 담당자', value: 'lead' },
              { label: '담당자', value: 'assistant' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="name"
          label={
            <span>
              담당자명 <span className="sponsor-contact-register-modal__required">*</span>
            </span>
          }
          className="sponsor-contact-register-modal__field"
          rules={[{ required: true, message: '담당자명을 입력해 주세요.' }]}
        >
          <CmsInput placeholder="담당자명을 입력해 주세요." inputSize="large" width="100%" />
        </Form.Item>
        <Form.Item name="position" label="직급" className="sponsor-contact-register-modal__field">
          <CmsInput placeholder="직급을 입력해 주세요." inputSize="large" width="100%" />
        </Form.Item>
        <Form.Item name="phone" label="연락처" className="sponsor-contact-register-modal__field">
          <CmsInput placeholder="연락처를 입력해 주세요." inputSize="large" width="100%" />
        </Form.Item>
        <Form.Item name="email" label="이메일" className="sponsor-contact-register-modal__field">
          <CmsInput placeholder="이메일을 입력해 주세요." inputSize="large" width="100%" />
        </Form.Item>
      </Form>
    </ContentModal>
  )
}
