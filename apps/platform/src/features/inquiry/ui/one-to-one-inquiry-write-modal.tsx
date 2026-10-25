import { useCallback, useId, useState } from 'react'
import { INQUIRY_CATEGORY_OPTIONS, INQUIRY_PROGRAM_OPTIONS } from '../lib/constants'
import { createInquiryIdempotencyKey } from '../lib/idempotency'
import { getInquiryApiErrorMessage } from '../lib/inquiry-errors'
import type { OneToOneInquiryWritePayload } from '../model/types'
import { PFButton, PFModal, PFSelect, PFText, PFTextInput } from '@/shared/ui'
import styles from './one-to-one-inquiry-write-modal.module.css'

export type InquirySelectOption = {
  value: string
  label: string
}

export type OneToOneInquiryWriteModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: OneToOneInquiryWritePayload, idempotencyKey: string) => Promise<void>
  programOptions?: readonly InquirySelectOption[]
  categoryOptions?: readonly InquirySelectOption[]
}

const EMPTY_FORM = {
  programValue: '',
  category: '',
  title: '',
  content: '',
}

type FieldErrors = {
  program?: string
  category?: string
  title?: string
  content?: string
}

function resolveProgramName(programValue: string, options: readonly InquirySelectOption[]) {
  return options.find(option => option.value === programValue)?.label ?? ''
}

export function OneToOneInquiryWriteModal({
  open,
  onClose,
  onSubmit,
  programOptions = INQUIRY_PROGRAM_OPTIONS,
  categoryOptions = INQUIRY_CATEGORY_OPTIONS,
}: OneToOneInquiryWriteModalProps) {
  const contentFieldId = useId()
  const [programValue, setProgramValue] = useState(EMPTY_FORM.programValue)
  const [category, setCategory] = useState(EMPTY_FORM.category)
  const [title, setTitle] = useState(EMPTY_FORM.title)
  const [content, setContent] = useState(EMPTY_FORM.content)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setProgramValue(EMPTY_FORM.programValue)
    setCategory(EMPTY_FORM.category)
    setTitle(EMPTY_FORM.title)
    setContent(EMPTY_FORM.content)
    setErrors({})
    setSubmitError(null)
    setIdempotencyKey(null)
  }, [])

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    resetForm()
    onClose()
  }, [isSubmitting, onClose, resetForm])

  const handleSubmit = async () => {
    if (isSubmitting) return
    setSubmitError(null)
    const nextErrors: FieldErrors = {}
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!programValue) {
      nextErrors.program = '문의 프로그램명을 선택해 주세요.'
    }
    if (!category) {
      nextErrors.category = '카테고리를 선택해 주세요.'
    }
    if (!trimmedTitle) {
      nextErrors.title = '제목을 입력해 주세요.'
    }
    if (!trimmedContent) {
      nextErrors.content = '문의내용을 입력해 주세요.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    const requestKey = idempotencyKey ?? createInquiryIdempotencyKey()
    setIdempotencyKey(requestKey)
    try {
      await onSubmit({
        programValue,
        programName: resolveProgramName(programValue, programOptions),
        category,
        title: trimmedTitle,
        content: trimmedContent,
      }, requestKey)
      resetForm()
      onClose()
    } catch (error) {
      setSubmitError(getInquiryApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PFModal
      open={open}
      size="md"
      title="1:1 문의 작성하기"
      mobilePlacement="full"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      onClose={handleClose}
    >
      <div className={styles.form}>
        <div className={styles.fieldProgram}>
          <PFSelect
            size="xlarge"
            label="문의 프로그램명"
            placeholder="문의할 프로그램을 선택해 주세요."
            options={[...programOptions]}
            value={programValue}
            required
            error={Boolean(errors.program)}
            message={
              errors.program ??
              '프로그램 문의가 아닌 단순 문의인 경우, [해당 없음] 항목을 선택해 주세요.'
            }
            messageStatus={errors.program ? 'error' : 'neutral'}
            disabled={isSubmitting}
            onValueChange={value => {
              setProgramValue(value)
              setIdempotencyKey(null)
              setErrors(previous => ({ ...previous, program: undefined }))
              setSubmitError(null)
            }}
          />
        </div>

        <div className={styles.fieldCategory}>
          <PFSelect
            size="xlarge"
            label="카테고리"
            placeholder="문의하실 유형을 선택해 주세요"
            options={[...categoryOptions]}
            value={category}
            required
            error={Boolean(errors.category)}
            message={errors.category}
            messageStatus={errors.category ? 'error' : 'neutral'}
            disabled={isSubmitting}
            onValueChange={value => {
              setCategory(value)
              setIdempotencyKey(null)
              setErrors(previous => ({ ...previous, category: undefined }))
              setSubmitError(null)
            }}
          />
        </div>

        <div className={styles.fieldTitle}>
          <PFTextInput
            size="xlarge"
            label="제목"
            placeholder="제목을 입력해 주세요."
            required
            value={title}
            error={Boolean(errors.title)}
            message={errors.title}
            messageStatus={errors.title ? 'error' : 'neutral'}
            disabled={isSubmitting}
            onValueChange={value => {
              setTitle(value)
              setIdempotencyKey(null)
              setErrors(previous => ({ ...previous, title: undefined }))
              setSubmitError(null)
            }}
          />
        </div>

        <div className={styles.fieldContent}>
          <label className={styles.label} htmlFor={contentFieldId}>
            <PFText as="span" typo="label-md" color="inherit" className={styles.labelText}>
              문의내용
            </PFText>
            <span className={styles.requiredMark} aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id={contentFieldId}
            className={[styles.textarea, errors.content ? styles.textareaError : undefined]
              .filter(Boolean)
              .join(' ')}
            value={content}
            placeholder="문의내용을 입력해 주세요."
            disabled={isSubmitting}
            onChange={event => {
              setContent(event.target.value)
              setIdempotencyKey(null)
              setErrors(previous => ({ ...previous, content: undefined }))
              setSubmitError(null)
            }}
          />
          {errors.content ? (
            <p className={[styles.message, styles.messageError].join(' ')}>{errors.content}</p>
          ) : null}
        </div>

        {submitError ? (
          <PFText as="p" typo="bd-sm-md" color="error" role="alert" className={styles.submitError}>
            {submitError}
          </PFText>
        ) : null}

        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            취소
          </PFButton>
          <PFButton
            type="button"
            size="xlarge"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중…' : '등록'}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
