import { type ChangeEvent, useRef, useState } from 'react'
import axios from 'axios'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import {
  formatKoreanPhoneNumber,
  isValidKoreanPhoneNumber,
  KOREAN_MOBILE_PREFIX,
  normalizeKoreanPhoneDigits,
} from '@jakorea/domain/shared/korean-phone'
import {
  PFAlertModal,
  PFAttachedFileList,
  PFButton,
  PFModal,
  PFRequiredMissingAlert,
  PFText,
  PFTextInput,
  PFTextarea,
  PFToggle,
} from '@/shared/ui'
import { validateUploadBatch } from '@/shared/lib/file-upload-policy'
import { PLATFORM_ALERT_COPY, type PlatformAlertCopy } from '@/shared/lib/platform-alert-copy'
import { resolvePlatformErrorAlert } from '@/shared/lib/platform-error-alert'
import {
  buildRequiredMissingAlertCopy,
  type RequiredMissingAlertCopy,
} from '@/shared/lib/required-missing-alert'
import {
  useCreatePublicCorporateConsultation,
  useUploadPublicCorporateConsultationAttachments,
} from '../api/hooks'
import type { PublicCorporateConsultationCreateRequest } from '../api/types'
import {
  CORPORATE_DONATION_INQUIRY_PRIVACY_AGREEMENT_LABEL,
  CORPORATE_DONATION_INQUIRY_PRIVACY_CONSENT_FIELD_LABEL,
  CORPORATE_DONATION_INQUIRY_PRIVACY_CONSENT_INTRO,
  CORPORATE_DONATION_INQUIRY_PRIVACY_CONSENT_SECTIONS,
} from '../lib/privacy-consent'
import {
  DOCUMENT_ATTACHMENT_ACCEPT,
  DOCUMENT_ATTACHMENT_HINT,
  validateDocumentAttachmentType,
} from '@/shared/lib/document-attachment-policy'
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

/** 필수 누락 팝업 항목명 — 화면 라벨과 같은 순서 */
const REQUIRED_TEXT_FIELD_LABELS = {
  companyName: '기업명',
  contactName: '담당자 이름',
  departmentTitle: '부서명/직함',
  contactPhone: '휴대폰 번호',
  consultationContent: '상담내용',
} as const satisfies Partial<Record<keyof InquiryValues, string>>

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
  if (!value.trim()) return '휴대폰 번호를 입력해 주세요.'

  const digits = normalizeKoreanPhoneDigits(value)
  const isMobile =
    digits.startsWith(KOREAN_MOBILE_PREFIX) &&
    digits.length === 11 &&
    isValidKoreanPhoneNumber(value)

  if (!isMobile) {
    return '휴대폰 번호 형식(010-0000-0000)으로 입력해 주세요.'
  }

  return true
}

/** 서버가 보낸 업무 메시지만 — FE 기본 실패 문구는 공통 「처리 실패」 팝업이 맡는다 */
function serverMessageFromError(error: unknown): string | null {
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
  return null
}

function buildRequest(
  values: InquiryValues,
  attachments: Array<{ assetId: number; uploadToken: string }>,
): PublicCorporateConsultationCreateRequest {
  const request: PublicCorporateConsultationCreateRequest = {
    companyName: values.companyName.trim(),
    contactName: values.contactName.trim(),
    departmentTitle: values.departmentTitle.trim(),
    contactPhone: formatKoreanPhoneNumber(values.contactPhone.trim()),
    consultationContent: values.consultationContent.trim(),
    privacyConsent: true,
  }

  const linkUrl = values.linkUrl.trim()
  if (linkUrl) request.linkUrl = linkUrl
  if (attachments.length > 0) {
    const ids = attachments.map(item => item.assetId)
    const tokens = attachments.map(item => item.uploadToken)
    request.attachmentAssetId = ids[0]
    request.attachmentAssetIds = ids
    request.attachmentUploadToken = tokens[0]
    request.attachmentUploadTokens = tokens
  }

  return request
}

export function CorporateDonationInquiryModal({
  open,
  onClose,
}: CorporateDonationInquiryModalProps) {
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; file: File }>>([])
  const [requiredMissing, setRequiredMissing] = useState<RequiredMissingAlertCopy | null>(null)
  /** 시안 「오류 제한 팝업」(14491-2533) — 파일 형식·미동의·접수 실패, 용량·업로드 중 안내 */
  const [errorAlert, setErrorAlert] = useState<PlatformAlertCopy | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    control,
    clearErrors,
    getValues,
    formState: { isSubmitting },
    handleSubmit: handleFormSubmit,
    reset,
  } = useForm<InquiryValues>({
    defaultValues: EMPTY_VALUES,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const consultationMutation = useCreatePublicCorporateConsultation()
  const attachmentsMutation = useUploadPublicCorporateConsultationAttachments()

  const isBusy = consultationMutation.isPending || attachmentsMutation.isPending || isSubmitting

  const resetDraft = () => {
    reset(EMPTY_VALUES)
    clearErrors()
    setAttachedFiles([])
    setRequiredMissing(null)
  }

  const handleClose = () => {
    if (isBusy) return
    resetDraft()
    onClose()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) return
    for (const file of selected) {
      const typeError = validateDocumentAttachmentType(file)
      if (typeError) {
        // 시안 「파일 형식이 맞지 않는 경우」 팝업
        setErrorAlert(typeError)
        return
      }
    }
    // 플랫폼 공통 업로드 정책: 최대 10개 · 파일당 20MB · 총 100MB
    const batchError = validateUploadBatch({
      currentCount: attachedFiles.length,
      currentTotalBytes: attachedFiles.reduce((sum, item) => sum + item.file.size, 0),
      incoming: selected,
    })
    if (batchError) {
      // 용량·개수 제한 — 시안 팝업이 없어 「안내」 팝업
      setErrorAlert({ title: '안내', description: batchError })
      return
    }
    setAttachedFiles(prev => [
      ...prev,
      ...selected.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
      })),
    ])
  }

  const handleSubmit: SubmitHandler<InquiryValues> = async values => {
    if (attachmentsMutation.isPending) {
      setErrorAlert({ title: '안내', description: '첨부파일 업로드가 끝난 후 등록해 주세요.' })
      return
    }

    try {
      const uploaded = await attachmentsMutation.mutateAsync(attachedFiles.map(item => item.file))
      await consultationMutation.mutateAsync(buildRequest(values, uploaded))
      resetDraft()
      onClose()
      setSuccessOpen(true)
    } catch (error) {
      // 시안 「네트워크 오류 / 처리 제한 / 처리 실패」 — 서버 업무 메시지는 설명에 그대로
      setErrorAlert(resolvePlatformErrorAlert(error, { serverMessage: serverMessageFromError }))
    }
  }

  /** 입력란 아래 문구와 함께 시안 팝업 — 미입력(항목명) 먼저, 그다음 필수 항목 미동의 */
  const handleInvalidSubmit = () => {
    const values = getValues()
    const missingLabels = (
      Object.keys(REQUIRED_TEXT_FIELD_LABELS) as (keyof typeof REQUIRED_TEXT_FIELD_LABELS)[]
    )
      .filter(key => !values[key].trim())
      .map(key => REQUIRED_TEXT_FIELD_LABELS[key])
    if (missingLabels.length > 0) {
      setRequiredMissing(buildRequiredMissingAlertCopy({ kind: 'field', labels: missingLabels }))
      return
    }
    if (!values.privacyConsent) {
      setErrorAlert(PLATFORM_ALERT_COPY.requiredNotAgreed)
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
        closeOnEscape={!isBusy && errorAlert == null && requiredMissing == null}
        className={styles.panel}
      >
          <form className={styles.form} onSubmit={handleFormSubmit(handleSubmit, handleInvalidSubmit)} noValidate>
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
                  render={({ field: { onChange, ...field }, fieldState }) => (
                    <PFTextInput
                      {...field}
                      label="휴대폰 번호"
                      placeholder="휴대폰 번호를 입력해 주세요"
                      size="xlarge"
                      width="100%"
                      maxLength={13}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      error={Boolean(fieldState.error)}
                      message={fieldState.error?.message}
                      messageStatus="error"
                      required
                      value={field.value}
                      onValueChange={value => {
                        onChange(formatKoreanPhoneNumber(value))
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
                      className={styles.consultTextarea}
                      rows={5}
                      maxLength={5000}
                      error={Boolean(fieldState.error)}
                      message={fieldState.error?.message}
                      messageStatus="error"
                      required
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(value)
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
                      }}
                    />
                  )}
                />

              <div className={styles.fileField}>
                <PFText
                  as="label"
                  typo="label-md"
                  color="neutral-warm-600"
                  className={styles.fieldLabel}
                >
                  파일 첨부
                </PFText>
                <div className={styles.filePicker}>
                  <PFButton
                    type="button"
                    variant="tertiary"
                    size="xlarge"
                    width="100%"
                    disabled={isBusy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {attachmentsMutation.isPending ? '업로드 중…' : '파일 추가하기'}
                  </PFButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={DOCUMENT_ATTACHMENT_ACCEPT}
                    className={styles.fileInput}
                    disabled={isBusy}
                    onChange={handleFileChange}
                  />
                </div>
                <ul className={styles.fileHint}>
                  <li>{DOCUMENT_ATTACHMENT_HINT}</li>
                  <li>첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.</li>
                </ul>
                <PFAttachedFileList
                  files={attachedFiles.map(item => ({ id: item.id, name: item.file.name }))}
                  disabled={isBusy}
                  onRemove={id => {
                    setAttachedFiles(prev => prev.filter(item => item.id !== id))
                  }}
                />
              </div>

              <Controller
                name="privacyConsent"
                control={control}
                rules={{
                  validate: checked =>
                    checked ? true : '개인정보 수집·이용에 동의해 주세요.',
                }}
                render={({ field, fieldState }) => (
                  <div className={styles.privacySection}>
                    <div className={styles.privacyLabelRow}>
                      <PFText as="span" typo="label-md" color="neutral-warm-600">
                        {CORPORATE_DONATION_INQUIRY_PRIVACY_CONSENT_FIELD_LABEL}
                      </PFText>
                      <PFText as="span" typo="label-md" color="error" aria-hidden>
                        *
                      </PFText>
                    </div>
                    <div className={styles.privacyContent}>
                      <div
                        className={styles.privacyBox}
                        role="region"
                        aria-label="개인정보 수집 및 이용 안내"
                      >
                        <PFText
                          as="p"
                          typo="bd-sm-sb"
                          color="neutral-cool-700"
                          className={styles.privacyIntro}
                        >
                          {CORPORATE_DONATION_INQUIRY_PRIVACY_CONSENT_INTRO}
                        </PFText>
                        {CORPORATE_DONATION_INQUIRY_PRIVACY_CONSENT_SECTIONS.map(section => (
                          <div key={section.heading} className={styles.privacyBlock}>
                            <PFText
                              as="p"
                              typo="bd-sm-sb"
                              color="neutral-cool-700"
                              className={styles.privacyHeading}
                            >
                              {section.heading}
                            </PFText>
                            {section.paragraphs.map(paragraph => (
                              <PFText
                                key={paragraph}
                                as="p"
                                typo="caption-rg"
                                color="neutral-cool-700"
                                className={styles.privacyParagraph}
                              >
                                {paragraph}
                              </PFText>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div
                        className={[
                          styles.privacyAgreementBar,
                          field.value ? styles.privacyAgreementBarChecked : undefined,
                          fieldState.error ? styles.privacyAgreementError : undefined,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {/* 시안 13260:85079 — Atomic Checkbox type=check(박스 없는 체크 표시), 재능기부 동의와 같은 PFToggle */}
                        <PFToggle
                          variant="check-large"
                          checked={field.value}
                          onChange={checked => {
                            field.onChange(checked)
                          }}
                          disabled={isBusy}
                        >
                          <PFText
                            as="span"
                            typo="bd-lg-sb"
                            color={field.value ? 'primary-600' : 'neutral-cool-700'}
                            className={styles.privacyAgreementLabel}
                          >
                            {CORPORATE_DONATION_INQUIRY_PRIVACY_AGREEMENT_LABEL}
                          </PFText>
                        </PFToggle>
                      </div>
                    </div>
                    <div className={styles.privacyErrorSlot} aria-live="polite">
                      {fieldState.error ? (
                        <PFText as="p" typo="bd-sm-rg" color="error" className={styles.error}>
                          {fieldState.error.message}
                        </PFText>
                      ) : null}
                    </div>
                  </div>
                )}
              />
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

      <PFRequiredMissingAlert copy={requiredMissing} onConfirm={() => setRequiredMissing(null)} />
      <PFAlertModal
        open={errorAlert != null}
        title={errorAlert?.title ?? ''}
        description={errorAlert?.description}
        onConfirm={() => setErrorAlert(null)}
      />

      <PFAlertModal
        open={successOpen}
        title="등록 완료"
        description="기업후원 문의가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다."
        onConfirm={() => setSuccessOpen(false)}
      />
    </>
  )
}
