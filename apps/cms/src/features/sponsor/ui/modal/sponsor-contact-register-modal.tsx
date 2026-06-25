import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { SponsorContactType } from '@/features/sponsor/model/sponsor-management.types'
import {
  DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES,
  sponsorContactRegisterFormSchema,
  toSponsorContactRegisterPayload,
  type SponsorContactRegisterFormValues,
} from '@/features/sponsor/model/sponsor-contact-register-schema'
import { ContentModal, CmsButton, CmsInput, CmsRadioGroup } from '@/shared/ui'
import './sponsor-contact-register-modal.css'

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
  /** 기존 담당자가 없을 때는 주 담당자만 등록 가능 */
  existingContactCount?: number
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

  useEffect(() => {
    if (!open) return
    reset(DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES)
  }, [open, reset])

  const handleCancel = () => {
    reset(DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES)
    onCancel()
  }

  const handleValidSubmit = (values: SponsorContactRegisterFormValues) => {
    onSubmit(toSponsorContactRegisterPayload(values))
    reset(DEFAULT_SPONSOR_CONTACT_REGISTER_FORM_VALUES)
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
          <CmsButton variant="primary" size="large" onClick={() => handleSubmit(handleValidSubmit)()}>
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
        <div className="sponsor-contact-register-modal__field">
          <label className="sponsor-contact-register-modal__label" htmlFor="sponsor-contact-type">
            담당자 유형
          </label>
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
          {errors.contactType?.message ? (
            <span className="sponsor-contact-register-modal__error" role="alert">
              {errors.contactType.message}
            </span>
          ) : null}
        </div>

        <div className="sponsor-contact-register-modal__field">
          <label className="sponsor-contact-register-modal__label" htmlFor="sponsor-contact-name">
            담당자명 <span className="sponsor-contact-register-modal__required">*</span>
          </label>
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
          {errors.name?.message ? (
            <span className="sponsor-contact-register-modal__error" role="alert">
              {errors.name.message}
            </span>
          ) : null}
        </div>

        <div className="sponsor-contact-register-modal__field">
          <label className="sponsor-contact-register-modal__label" htmlFor="sponsor-contact-position">
            직급
          </label>
          <Controller
            name="position"
            control={control}
            render={({ field, fieldState }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-position"
                placeholder="직급을 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
          {errors.position?.message ? (
            <span className="sponsor-contact-register-modal__error" role="alert">
              {errors.position.message}
            </span>
          ) : null}
        </div>

        <div className="sponsor-contact-register-modal__field">
          <label className="sponsor-contact-register-modal__label" htmlFor="sponsor-contact-phone">
            연락처
          </label>
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <CmsInput
                {...field}
                id="sponsor-contact-phone"
                placeholder="연락처를 입력해 주세요."
                inputSize="large"
                width="100%"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
          {errors.phone?.message ? (
            <span className="sponsor-contact-register-modal__error" role="alert">
              {errors.phone.message}
            </span>
          ) : null}
        </div>

        <div className="sponsor-contact-register-modal__field">
          <label className="sponsor-contact-register-modal__label" htmlFor="sponsor-contact-email">
            이메일
          </label>
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
          {errors.email?.message ? (
            <span className="sponsor-contact-register-modal__error" role="alert">
              {errors.email.message}
            </span>
          ) : null}
        </div>
      </form>
    </ContentModal>
  )
}
