import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { SponsorContactType } from '@/features/sponsor/model/sponsor-management.types'
import {
  DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES,
  sponsorContactRegisterFormSchema,
  toSponsorContactRegisterPayload,
  type SponsorContactRegisterFormValues,
} from '@/features/sponsor/model/sponsor-contact-register-schema'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import {
  ContentModal,
  CmsButton,
  CmsInput,
  CmsPhoneInput,
  CmsRadioGroup,
  useCmsAlert,
} from '@/shared/ui'
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
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="sponsor-contact-register-modal__field">
      <label className="sponsor-contact-register-modal__label" htmlFor={id}>
        {label}
        {required ? <span className="sponsor-contact-register-modal__required"> *</span> : null}
      </label>
      {children}
    </div>
  )
}

function firstFieldErrorMessage(
  errors: FieldErrors<SponsorContactRegisterFormValues>
): string | undefined {
  for (const key of Object.keys(errors) as (keyof SponsorContactRegisterFormValues)[]) {
    const message = errors[key]?.message
    if (typeof message === 'string' && message.trim()) return message
  }
  return undefined
}

function hasMissingRequiredFields(values: SponsorContactRegisterFormValues): boolean {
  return !values.contactType || !values.name.trim() || !values.phone.trim()
}

export function SponsorContactRegisterModal({
  open,
  onCancel,
  onSubmit,
  existingContactCount = 0,
}: SponsorContactRegisterModalProps) {
  const { showAlert } = useCmsAlert()
  const { control, handleSubmit, reset, getValues } = useForm<SponsorContactRegisterFormValues>({
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

  const handleInvalidSubmit = (fieldErrors: FieldErrors<SponsorContactRegisterFormValues>) => {
    if (hasMissingRequiredFields(getValues())) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    const message = firstFieldErrorMessage(fieldErrors)
    if (message) {
      showAlert({ title: '안내', content: message })
    }
  }

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      className="sponsor-contact-register-modal"
      title="후원사 담당자 등록"
      width={720}
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={handleCancel} disabled={submitting}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            loading={submitting}
            onClick={() => handleSubmit(handleValidSubmit, handleInvalidSubmit)()}
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
          handleSubmit(handleValidSubmit, handleInvalidSubmit)(event)
        }}
        noValidate
      >
        <Field id="sponsor-contact-type" label="담당자 유형" required>
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

        <div className="sponsor-contact-register-modal__row">
          <Field id="sponsor-contact-name" label="담당자명" required>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  id="sponsor-contact-name"
                  placeholder="담당자명을 입력해 주세요"
                  inputSize="large"
                  width="100%"
                />
              )}
            />
          </Field>
          <Field id="sponsor-contact-department" label="부서">
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  id="sponsor-contact-department"
                  placeholder="부서를 입력해 주세요"
                  inputSize="large"
                  width="100%"
                />
              )}
            />
          </Field>
        </div>

        <div className="sponsor-contact-register-modal__row">
          <Field id="sponsor-contact-position" label="직함">
            <Controller
              name="position"
              control={control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  id="sponsor-contact-position"
                  placeholder="직함을 입력해 주세요"
                  inputSize="large"
                  width="100%"
                />
              )}
            />
          </Field>
          <Field id="sponsor-contact-office-phone" label="내선번호">
            <Controller
              name="officePhone"
              control={control}
              render={({ field }) => (
                <CmsPhoneInput
                  {...field}
                  id="sponsor-contact-office-phone"
                  placeholder="내선번호를 입력해 주세요"
                  inputSize="large"
                  width="100%"
                />
              )}
            />
          </Field>
        </div>

        <div className="sponsor-contact-register-modal__row">
          <Field id="sponsor-contact-phone" label="연락처" required>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <CmsPhoneInput
                  {...field}
                  id="sponsor-contact-phone"
                  placeholder="연락처를 입력해 주세요"
                  inputSize="large"
                  width="100%"
                />
              )}
            />
          </Field>
          <Field id="sponsor-contact-email" label="이메일">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  id="sponsor-contact-email"
                  placeholder="이메일을 입력해 주세요"
                  inputSize="large"
                  width="100%"
                />
              )}
            />
          </Field>
        </div>

        <Field id="sponsor-contact-company-address" label="회사 주소">
          <Controller
            name="companyAddress"
            control={control}
            render={({ field }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-company-address"
                placeholder="회사 주소를 입력해 주세요"
                inputSize="large"
                width="100%"
              />
            )}
          />
        </Field>

        <Field id="sponsor-contact-memo" label="비고">
          <Controller
            name="memo"
            control={control}
            render={({ field }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-memo"
                placeholder="비고를 입력해 주세요"
                inputSize="large"
                width="100%"
              />
            )}
          />
        </Field>
      </form>
    </ContentModal>
  )
}
