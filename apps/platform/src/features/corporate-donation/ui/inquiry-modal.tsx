import { useState } from 'react'
import axios from 'axios'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import {
  PFAlertModal,
  PFButton,
  PFCheckbox,
  PFItemDeleteButton,
  PFModal,
  PFText,
  PFTextInput,
  PFTextarea,
} from '@/shared/ui'
import { validateUploadFileSize } from '@/shared/lib/file-upload-policy'
import {
  useCreatePublicCorporateConsultation,
  useUploadPublicCorporateConsultationAttachment,
} from '../api/hooks'
import type { PublicCorporateConsultationCreateRequest } from '../api/types'
import styles from './inquiry-modal.module.css'

type InquiryValues = {
  companyName: string
  contactName: string
  departmentTitle: string
  contactPhone: string
  consultationContent: string
  linkUrl: string
  privacyConsent: boolean
}

type UploadedAttachment = {
  name: string
  assetId: number
  uploadToken: string
}

type CorporateDonationInquiryModalProps = {
  open: boolean
  onClose: () => void
}

const EMPTY_VALUES: InquiryValues = {
  companyName: '',
  contactName: '',
  departmentTitle: '',
  contactPhone: '',
  consultationContent: '',
  linkUrl: '',
  privacyConsent: false,
}

const ACCEPTED_ATTACHMENT_TYPES = new Set(['image/jpeg', 'image/png'])
const ACCEPTED_ATTACHMENT_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])

function formatContactPhone(value: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, -4)}-${digits.slice(-4)}`
  }

  if (/^1[568]\d{2}/.test(digits)) {
    if (digits.length <= 4) return digits
    return `${digits.slice(0, 4)}-${digits.slice(4)}`
  }

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, -4)}-${digits.slice(-4)}`
}

function validateRequiredText(
  value: string,
  requiredMessage: string,
  lengthMessage: string,
  maxLength: number,
): true | string {
  if (!value.trim()) return requiredMessage
  if (value.length > maxLength) return lengthMessage
  return true
}

function validateContactPhone(value: string): true | string {
  if (!value.trim()) return '연락처를 입력해 주세요.'

  const digits = value.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 11) {
    return '연락처를 올바르게 입력해 주세요.'
  }

  if (!/^(02|0\d{2,3}|1[568]\d{2})-\d{3,4}-\d{4}$/.test(value.trim())) {
    return '연락처를 올바르게 입력해 주세요.'
  }

  return true
}

function messageFromError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      const nestedError = record.error
      const candidates = [
        record.message,
        typeof nestedError === 'object' && nestedError !== null
          ? (nestedError as Record<string, unknown>).message
          : undefined,
      ]
      const message = candidates.find(value => typeof value === 'string' && value.trim())
      if (typeof message === 'string') return message.trim()
    }
  }
  return '문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

function attachmentValidationMessage(file: File): string | null {
  const sizeError = validateUploadFileSize(file)
  if (sizeError) return sizeError

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ACCEPTED_ATTACHMENT_TYPES.has(file.type) && !ACCEPTED_ATTACHMENT_EXTENSIONS.has(extension)) {
    return 'JPG, PNG 형식의 파일만 첨부할 수 있습니다.'
  }

  return null
}

function buildRequest(
  values: InquiryValues,
  attachment: UploadedAttachment | null,
): PublicCorporateConsultationCreateRequest {
  const request: PublicCorporateConsultationCreateRequest = {
    companyName: values.companyName.trim(),
    contactName: values.contactName.trim(),
    departmentTitle: values.departmentTitle.trim(),
    contactPhone: values.contactPhone.trim(),
    consultationContent: values.consultationContent.trim(),
    privacyConsent: true,
  }

  const linkUrl = values.linkUrl.trim()
  if (linkUrl) request.linkUrl = linkUrl
  if (attachment) {
    request.attachmentAssetId = attachment.assetId
    request.attachmentUploadToken = attachment.uploadToken
  }

  return request
}

export function CorporateDonationInquiryModal({
  open,
  onClose,
}: CorporateDonationInquiryModalProps) {
  const [attachment, setAttachment] = useState<UploadedAttachment | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const {
    control,
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit: handleFormSubmit,
    reset,
  } = useForm<InquiryValues>({
    defaultValues: EMPTY_VALUES,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const consultationMutation = useCreatePublicCorporateConsultation()
  const attachmentMutation = useUploadPublicCorporateConsultationAttachment()

  const isBusy = consultationMutation.isPending || attachmentMutation.isPending || isSubmitting

  const resetDraft = () => {
    reset(EMPTY_VALUES)
    clearErrors()
    setAttachment(null)
    setFormError(null)
    setUploadError(null)
  }

  const handleClose = () => {
    if (isBusy) return
    resetDraft()
    onClose()
  }

  const handleFileSelect = async (file: File) => {
    const validationError = attachmentValidationMessage(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }

    setUploadError(null)
    setFormError(null)
    setAttachment(null)

    try {
      const uploaded = await attachmentMutation.mutateAsync(file)
      setAttachment({ name: file.name, ...uploaded })
    } catch (error) {
      setUploadError(messageFromError(error))
    }
  }

  const handleSubmit: SubmitHandler<InquiryValues> = async values => {
    if (attachmentMutation.isPending) {
      setFormError('첨부파일 업로드가 끝난 후 등록해 주세요.')
      return
    }
    if (uploadError) {
      setFormError('첨부파일을 확인해 주세요.')
      return
    }

    setFormError(null)
    try {
      await consultationMutation.mutateAsync(buildRequest(values, attachment))
      resetDraft()
      onClose()
      setSuccessOpen(true)
    } catch (error) {
      setFormError(messageFromError(error))
    }
  }

  return (
    <>
      <PFModal
        open={open}
        onClose={handleClose}
        title="기업후원 상담하기"
        size="md"
        mobilePlacement="full"
        closeOnBackdropClick={!isBusy}
        closeOnEscape={!isBusy}
        className={styles.modal}
      >
          <form className={styles.form} onSubmit={handleFormSubmit(handleSubmit)} noValidate>
            <div className={styles.body}>
              <div className={styles.fields}>
                <Controller
                  name="companyName"
                  control={control}
                  rules={{
                    validate: value =>
                      validateRequiredText(
                        value,
                        '기업명을 입력해 주세요.',
                        '기업명은 300자 이하로 입력해 주세요.',
                        300,
                      ),
                  }}
                  render={({ field, fieldState }) => (
                    <PFTextInput
                      {...field}
                      label="기업명"
                      placeholder="기업명을 입력해 주세요"
                      size="xlarge"
                      width="100%"
                      maxLength={300}
                      error={Boolean(fieldState.error)}
                      message={fieldState.error?.message}
                      messageStatus="error"
                      required
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(value)
                        setFormError(null)
                      }}
                    />
                  )}
                />
                <Controller
                  name="contactName"
                  control={control}
                  rules={{
                    validate: value =>
                      validateRequiredText(
                        value,
                        '담당자 이름을 입력해 주세요.',
                        '담당자 이름은 200자 이하로 입력해 주세요.',
                        200,
                      ),
                  }}
                  render={({ field, fieldState }) => (
                    <PFTextInput
                      {...field}
                      label="담당자 이름"
                      placeholder="담당자 이름을 입력해 주세요"
                      size="xlarge"
                      width="100%"
                      maxLength={200}
                      error={Boolean(fieldState.error)}
                      message={fieldState.error?.message}
                      messageStatus="error"
                      required
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(value)
                        setFormError(null)
                      }}
                    />
                  )}
                />
                <Controller
                  name="departmentTitle"
                  control={control}
                  rules={{
                    validate: value =>
                      validateRequiredText(
                        value,
                        '부서명/직함을 입력해 주세요.',
                        '부서명/직함은 300자 이하로 입력해 주세요.',
                        300,
                      ),
                  }}
                  render={({ field, fieldState }) => (
                    <PFTextInput
                      {...field}
                      label="부서명/직함"
                      placeholder="부서명/직함을 입력해 주세요"
                      size="xlarge"
                      width="100%"
                      maxLength={300}
                      error={Boolean(fieldState.error)}
                      message={fieldState.error?.message}
                      messageStatus="error"
                      required
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(value)
                        setFormError(null)
                      }}
                    />
                  )}
                />
                <Controller
                  name="contactPhone"
                  control={control}
                  rules={{
                    validate: validateContactPhone,
                  }}
                  render={({ field, fieldState }) => (
                    <PFTextInput
                      {...field}
                      label="연락처"
                      placeholder="연락처를 입력해 주세요"
                      size="xlarge"
                      width="100%"
                      maxLength={13}
                      inputMode="tel"
                      autoComplete="tel"
                      error={Boolean(fieldState.error)}
                      message={fieldState.error?.message}
                      messageStatus="error"
                      required
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(formatContactPhone(value))
                        setFormError(null)
                      }}
                    />
                  )}
                />
                <Controller
                  name="consultationContent"
                  control={control}
                  rules={{
                    validate: value =>
                      validateRequiredText(
                        value,
                        '상담내용을 입력해 주세요.',
                        '상담내용은 5000자 이하로 입력해 주세요.',
                        5000,
                      ),
                  }}
                  render={({ field, fieldState }) => (
                    <PFTextarea
                      {...field}
                      label="상담내용"
                      placeholder="상담내용을 입력해 주세요"
                      size="xlarge"
                      width="100%"
                      rows={5}
                      maxLength={5000}
                      error={Boolean(fieldState.error)}
                      message={fieldState.error?.message}
                      messageStatus="error"
                      required
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(value)
                        setFormError(null)
                      }}
                    />
                  )}
                />
                <Controller
                  name="linkUrl"
                  control={control}
                  rules={{
                    validate: value => {
                      const normalized = value.trim()
                      if (!normalized) return true
                      if (normalized.length > 2048) {
                        return '링크는 2048자 이하로 입력해 주세요.'
                      }
                      try {
                        const url = new URL(normalized)
                        if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
                          return 'http:// 또는 https:// 형식의 링크를 입력해 주세요.'
                        }
                        if (url.username || url.password) {
                          return '사용자 정보가 포함된 링크는 입력할 수 없습니다.'
                        }
                        return true
                      } catch {
                        return '올바른 링크를 입력해 주세요.'
                      }
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <PFTextInput
                      {...field}
                      label="링크 삽입"
                      placeholder="(선택)링크를 삽입해 주세요"
                      size="xlarge"
                      width="100%"
                      maxLength={2048}
                      error={Boolean(fieldState.error)}
                      message={fieldState.error?.message}
                      messageStatus="error"
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(value)
                        setFormError(null)
                      }}
                    />
                  )}
                />

              <div className={styles.fileField}>
                <PFText as="label" typo="label-md" color="black" className={styles.fieldLabel}>
                  파일 첨부
                </PFText>
                <label className={styles.filePicker}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className={styles.fileInput}
                    disabled={isBusy}
                    onChange={event => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (file) void handleFileSelect(file)
                    }}
                  />
                  <PFButton
                    type="button"
                    variant="tertiary"
                    size="xlarge"
                    width="100%"
                    disabled={isBusy}
                  >
                    {attachmentMutation.isPending ? '업로드 중…' : '파일 추가하기'}
                  </PFButton>
                </label>
                <ul className={styles.fileHint}>
                  <li>파일은 최대 20MB까지 JPG, PNG 형식만 등록 가능합니다.</li>
                  <li>첨부파일명에 특수문자가 포함된 경우, 등록 시 오류가 발생할 수 있습니다.</li>
                </ul>
                {attachment ? (
                  <div className={styles.fileRow}>
                    <PFText as="span" typo="bd-md-md" color="black" className={styles.fileName}>
                      {attachment.name}
                    </PFText>
                    <PFItemDeleteButton
                      aria-label={`${attachment.name} 삭제`}
                      disabled={isBusy}
                      onClick={() => {
                        setAttachment(null)
                        setUploadError(null)
                      }}
                    />
                  </div>
                ) : null}
                {uploadError ? (
                  <PFText as="p" typo="bd-sm-rg" color="error" className={styles.error}>
                    {uploadError}
                  </PFText>
                ) : null}
              </div>

              <Controller
                name="privacyConsent"
                control={control}
                rules={{
                  validate: checked =>
                    checked ? true : '개인정보 수집·이용에 동의해 주세요.',
                }}
                render={({ field, fieldState }) => (
                  <div
                    className={[
                      styles.consentRow,
                      fieldState.error ? styles.consentError : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <PFCheckbox
                      checked={field.value}
                      onCheckedChange={checked => {
                        field.onChange(checked)
                        setFormError(null)
                      }}
                      label="개인정보 수집·이용 동의"
                      disabled={isBusy}
                    />
                  </div>
                )}
              />
              {errors.privacyConsent ? (
                <PFText as="p" typo="bd-sm-rg" color="error" className={styles.error}>
                  {errors.privacyConsent.message}
                </PFText>
              ) : null}
              {formError ? (
                <PFText as="p" typo="bd-sm-md" color="error" className={styles.error}>
                  {formError}
                </PFText>
              ) : null}
            </div>
          </div>

          <div className={styles.actions}>
            <PFButton
              type="button"
              variant="secondary"
              size="xlarge"
              disabled={isBusy}
              onClick={handleClose}
            >
              취소
            </PFButton>
            <PFButton
              type="submit"
              variant="primary"
              size="xlarge"
              disabled={isBusy}
            >
              {consultationMutation.isPending ? '등록 중…' : '등록'}
            </PFButton>
          </div>
        </form>
      </PFModal>

      <PFAlertModal
        open={successOpen}
        title="등록 완료"
        description="기업후원 문의가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다."
        onConfirm={() => setSuccessOpen(false)}
      />
    </>
  )
}
