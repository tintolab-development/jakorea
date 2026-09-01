import { useCallback, useId, useState } from 'react'
import { INQUIRY_CATEGORY_OPTIONS, INQUIRY_PROGRAM_OPTIONS } from '../lib/constants'
import type { FaqCategory, OneToOneInquiryWritePayload } from '../model/types'
import { PFButton, PFModal, PFSelect, PFText, PFTextInput } from '@/shared/ui'
import styles from './one-to-one-inquiry-write-modal.module.css'

export type OneToOneInquiryWriteModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: OneToOneInquiryWritePayload) => void
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

function resolveProgramName(programValue: string) {
  return INQUIRY_PROGRAM_OPTIONS.find(option => option.value === programValue)?.label ?? ''
}

export function OneToOneInquiryWriteModal({
  open,
  onClose,
  onSubmit,
}: OneToOneInquiryWriteModalProps) {
  const contentFieldId = useId()
  const [programValue, setProgramValue] = useState(EMPTY_FORM.programValue)
  const [category, setCategory] = useState(EMPTY_FORM.category)
  const [title, setTitle] = useState(EMPTY_FORM.title)
  const [content, setContent] = useState(EMPTY_FORM.content)
  const [errors, setErrors] = useState<FieldErrors>({})

  const resetForm = useCallback(() => {
    setProgramValue(EMPTY_FORM.programValue)
    setCategory(EMPTY_FORM.category)
    setTitle(EMPTY_FORM.title)
    setContent(EMPTY_FORM.content)
    setErrors({})
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const handleSubmit = () => {
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

    onSubmit({
      programValue,
      programName: resolveProgramName(programValue),
      category: category as FaqCategory,
      title: trimmedTitle,
      content: trimmedContent,
    })
    resetForm()
    onClose()
  }

  return (
    <PFModal
      open={open}
      size="md"
      title="1:1 문의 작성하기"
      mobilePlacement="full"
      onClose={handleClose}
    >
      <div className={styles.form}>
        <div className={styles.fieldProgram}>
          <PFSelect
            size="xlarge"
            label="문의 프로그램명"
            placeholder="문의할 프로그램을 선택해 주세요."
            options={[...INQUIRY_PROGRAM_OPTIONS]}
            value={programValue}
            required
            error={Boolean(errors.program)}
            message={
              errors.program ??
              '프로그램 문의가 아닌 단순 문의인 경우, [해당 없음] 항목을 선택해 주세요.'
            }
            messageStatus={errors.program ? 'error' : 'neutral'}
            onValueChange={value => {
              setProgramValue(value)
              setErrors(previous => ({ ...previous, program: undefined }))
            }}
          />
        </div>

        <div className={styles.fieldCategory}>
          <PFSelect
            size="xlarge"
            label="카테고리"
            placeholder="문의하실 유형을 선택해 주세요"
            options={[...INQUIRY_CATEGORY_OPTIONS]}
            value={category}
            required
            error={Boolean(errors.category)}
            message={errors.category}
            messageStatus={errors.category ? 'error' : 'neutral'}
            onValueChange={value => {
              setCategory(value)
              setErrors(previous => ({ ...previous, category: undefined }))
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
            onValueChange={value => {
              setTitle(value)
              setErrors(previous => ({ ...previous, title: undefined }))
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
            onChange={event => {
              setContent(event.target.value)
              setErrors(previous => ({ ...previous, content: undefined }))
            }}
          />
          {errors.content ? (
            <p className={[styles.message, styles.messageError].join(' ')}>{errors.content}</p>
          ) : null}
        </div>

        <div className={styles.actions}>
          <PFButton type="button" variant="secondary" size="xlarge" onClick={handleClose}>
            취소
          </PFButton>
          <PFButton type="button" size="xlarge" onClick={handleSubmit}>
            등록
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
