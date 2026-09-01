import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { SponsorContactType } from '@/features/sponsor/model/sponsor-management.types'
import {
  DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES,
  sponsorContactRegisterFormSchema,
  toSponsorContactRegisterPayload,
  type SponsorContactRegisterFormValues,
} from '@/features/sponsor/model/sponsor-contact-register-schema'
import { ContentModal, CmsButton, CmsInput, CmsPhoneInput, CmsRadioGroup } from '@/shared/ui'
import './sponsor-contact-register-modal.css'

export interface SponsorContactRegisterPayload {
  contactType: SponsorContactType
  name: string
  department: string
  position: string
  officePhone: string
  phone: string
  email: string
  companyAddress: string
  memo: string
}

interface SponsorContactRegisterModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (payload: SponsorContactRegisterPayload) => void | Promise<void>
  /** 기존 담당자가 없을 때는 주 담당자만 등록 가능 */
  existingContactCount?: number
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="sponsor-contact-register-modal__field">
      <label className="sponsor-contact-register-modal__label" htmlFor={id}>
        {label}
        {required ? <span className="sponsor-contact-register-modal__required"> *</span> : null}
      </label>
      {children}
      {error ? (
        <span className="sponsor-contact-register-modal__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

export function SponsorContactRegisterModal({
  open,
  onCancel,
  onSubmit,
  existingContactCount = 0,
}: SponsorContactRegisterModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SponsorContactRegisterFormValues>({
    resolver: zodResolver(sponsorContactRegisterFormSchema),
    defaultValues: DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setSubmitting(false)
    reset(DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES)
  }, [open, reset])

  const handleCancel = () => {
    if (submitting) return
    reset(DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES)
    onCancel()
  }

  const handleValidSubmit = async (values: SponsorContactRegisterFormValues) => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onSubmit(toSponsorContactRegisterPayload(values))
    } finally {
      setSubmitting(false)
    }
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
          <CmsButton variant="secondary" size="large" onClick={handleCancel} disabled={submitting}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            loading={submitting}
            onClick={() => handleSubmit(handleValidSubmit)()}
          >
            등록
          </CmsButton>
        </>
      }
    >
      <form
        className="sponsor-contact-register-modal__form"
        onSubmit={event => {
          event.preventDefault()
          handleSubmit(handleValidSubmit)(event)
        }}
        noValidate
      >
        <Field id="sponsor-contact-type" label="담당자 유형" error={errors.contactType?.message}>
          <Controller
            name="contactType"
            control={control}
            render={({ field }) => (
              <CmsRadioGroup
                {...field}
                id="sponsor-contact-type"
                size="large"
                options={[
                  { label: '주 담당자', value: 'lead' },
                  { label: '담당자', value: 'assistant', disabled: existingContactCount === 0 },
                ]}
              />
            )}
          />
        </Field>

        <Field id="sponsor-contact-name" label="담당자명" required error={errors.name?.message}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-name"
                placeholder="담당자명을 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </Field>

        <Field id="sponsor-contact-department" label="부서" error={errors.department?.message}>
          <Controller
            name="department"
            control={control}
            render={({ field, fieldState }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-department"
                placeholder="부서를 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </Field>

        <Field id="sponsor-contact-position" label="직함" error={errors.position?.message}>
          <Controller
            name="position"
            control={control}
            render={({ field, fieldState }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-position"
                placeholder="직함을 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </Field>

        <Field id="sponsor-contact-office-phone" label="내선 번호" error={errors.officePhone?.message}>
          <Controller
            name="officePhone"
            control={control}
            render={({ field, fieldState }) => (
              <CmsPhoneInput
                {...field}
                id="sponsor-contact-office-phone"
                placeholder="내선 번호를 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </Field>

        <Field id="sponsor-contact-phone" label="연락처" error={errors.phone?.message}>
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <CmsPhoneInput
                {...field}
                id="sponsor-contact-phone"
                placeholder="연락처를 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </Field>

        <Field id="sponsor-contact-email" label="이메일" error={errors.email?.message}>
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-email"
                placeholder="이메일을 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </Field>

        <Field
          id="sponsor-contact-company-address"
          label="회사 주소"
          error={errors.companyAddress?.message}
        >
          <Controller
            name="companyAddress"
            control={control}
            render={({ field, fieldState }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-company-address"
                placeholder="회사 주소를 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </Field>

        <Field id="sponsor-contact-memo" label="비고" error={errors.memo?.message}>
          <Controller
            name="memo"
            control={control}
            render={({ field, fieldState }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-memo"
                placeholder="비고를 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </Field>
      </form>
    </ContentModal>
  )
}
