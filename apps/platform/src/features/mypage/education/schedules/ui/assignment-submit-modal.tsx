import { useRef, useState, type ChangeEvent } from 'react'
import type { EducationScheduleAssignmentFile } from '../model/types'
import { PFButton, PFModal, PFText, PFTextInput } from '@/shared/ui'
import closeFileUrl from '@/shared/assets/icons/close-black.svg'
import attachFileUrl from '../image/icon/attach-file-24.svg'
import styles from './assignment-submit-modal.module.css'

const MAX_FILE_COUNT = 20
const MAX_FILE_BYTES = 20 * 1024 * 1024
const ACCEPTED_FILE_EXTENSIONS = [
  'hwp',
  'hwpx',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'pdf',
  'xls',
  'xlsx',
  'csv',
  'txt',
  'png',
  'jpg',
  'jpeg',
  'heic',
  'bmp',
  'mp4',
  'mov',
  'zip',
] as const

type SubmissionItem = {
  id: string
  label: string
  kind: 'file' | 'url'
  file?: File
  fileObjectId?: number
}

export type AssignmentSubmitModalInput = {
  newFiles: File[]
  keepFileObjectIds: number[]
  links: string[]
}

type EducationAssignmentSubmitModalProps = {
  open: boolean
  sessionHeading: string
  initialFiles?: readonly EducationScheduleAssignmentFile[]
  submitting?: boolean
  onClose: () => void
  onSubmit: (input: AssignmentSubmitModalInput) => void
}

let nextItemId = 0

function createItemId(prefix: string): string {
  nextItemId += 1
  return `${prefix}-${nextItemId}`
}

function getFileExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.trim().toLowerCase()
  return extension ?? ''
}

function mapInitialFile(file: EducationScheduleAssignmentFile): SubmissionItem {
  return {
    id: file.id,
    label: file.fileName,
    kind: file.kind,
    ...(file.fileObjectId != null ? { fileObjectId: file.fileObjectId } : {}),
  }
}

function fileValidationMessage(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return '파일당 최대 20MB까지 첨부할 수 있어요.'
  }
  if (!ACCEPTED_FILE_EXTENSIONS.includes(getFileExtension(file.name) as (typeof ACCEPTED_FILE_EXTENSIONS)[number])) {
    return '첨부할 수 없는 파일 형식이에요. 안내된 형식의 파일을 선택해 주세요.'
  }
  return null
}

export function EducationAssignmentSubmitModal({
  open,
  sessionHeading,
  initialFiles = [],
  submitting = false,
  onClose,
  onSubmit,
}: EducationAssignmentSubmitModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<SubmissionItem[]>(() => initialFiles.map(mapInitialFile))
  const [linkInput, setLinkInput] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const openFilePicker = () => {
    if (!submitting) fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) return

    const remainingCount = MAX_FILE_COUNT - items.length
    if (remainingCount <= 0) {
      setErrorMessage(`과제 파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있어요.`)
      return
    }

    const filesToAdd = selected.slice(0, remainingCount)
    const invalidFile = filesToAdd.find(file => fileValidationMessage(file) != null)
    if (invalidFile) {
      setErrorMessage(fileValidationMessage(invalidFile) ?? '파일을 첨부할 수 없어요.')
      return
    }

    setItems(previous => [
      ...previous,
      ...filesToAdd.map(file => ({
        id: createItemId('file'),
        label: file.name,
        kind: 'file' as const,
        file,
      })),
    ])
    setErrorMessage('')
  }

  const addLink = () => {
    const link = linkInput.trim()
    if (!/^https?:\/\//i.test(link)) {
      setErrorMessage('https://로 시작하는 링크를 입력해 주세요.')
      return
    }
    if (items.some(item => item.kind === 'url' && item.label === link)) {
      setErrorMessage('이미 추가한 링크예요.')
      return
    }
    if (items.length >= MAX_FILE_COUNT) {
      setErrorMessage(`과제 파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있어요.`)
      return
    }

    setItems(previous => [
      ...previous,
      { id: createItemId('link'), label: link, kind: 'url' },
    ])
    setLinkInput('')
    setErrorMessage('')
  }

  const removeItem = (itemId: string) => {
    setItems(previous => previous.filter(item => item.id !== itemId))
    setErrorMessage('')
  }

  const handleSubmit = () => {
    if (items.length === 0) {
      setErrorMessage('파일 또는 링크 중 1개 이상 첨부해야 제출할 수 있어요.')
      return
    }

    onSubmit({
      newFiles: items.flatMap(item => (item.file ? [item.file] : [])),
      keepFileObjectIds: items.flatMap(item =>
        item.kind === 'file' && item.fileObjectId != null ? [item.fileObjectId] : [],
      ),
      links: items.flatMap(item => (item.kind === 'url' ? [item.label] : [])),
    })
  }

  return (
    <PFModal
      open={open}
      title="과제 제출하기"
      size="md"
      mobilePlacement="full"
      closeOnBackdropClick={!submitting}
      closeOnEscape={!submitting}
      onClose={onClose}
      className={styles.modal}
    >
      <div className={styles.body}>
        <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600" className={styles.guide}>
          과제 파일 또는 링크를 첨부해 제출해 주세요. 여러 개 첨부할 수 있어요.
          <br />
          제출한 과제는 마감 전까지 수정할 수 있어요.
          <br />* 파일 또는 링크 중 1개 이상 첨부해야 제출할 수 있어요.
        </PFText>

        <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600" className={styles.sessionHeading}>
          {sessionHeading}
        </PFText>

        <section className={styles.section} aria-labelledby="assignment-file-label">
          <PFText
            as="h2"
            id="assignment-file-label"
            typo="bd-md-sb"
            color="neutral-cool-600"
            className={styles.sectionTitle}
          >
            과제 파일을 첨부해 주세요.
          </PFText>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_EXTENSIONS.map(extension => `.${extension}`).join(',')}
            className={styles.fileInput}
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleFileChange}
          />
          <PFButton
            type="button"
            variant="tertiary"
            size="xlarge"
            width="100%"
            disabled={submitting}
            onClick={openFilePicker}
          >
            파일 추가하기
          </PFButton>
          <ul className={styles.policy}>
            <li>파일당 최대 20MB까지 hwp, hwpx, doc, docx, ppt, pptx, pdf, xls, xlsx, csv, txt, png, jpg(jpeg), heic, bmp, mp4, mov, zip 형식만 등록 가능합니다.</li>
            <li>첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.</li>
          </ul>
          {items.some(item => item.kind === 'file') ? (
            <ul className={styles.itemList} aria-label="첨부한 과제 파일">
              {items
                .filter(item => item.kind === 'file')
                .map(item => (
                  <li key={item.id} className={styles.item}>
                    <img src={attachFileUrl} alt="" width={24} height={24} aria-hidden="true" />
                    <PFText as="span" typo="bd-lg-rg" color="black" className={styles.itemLabel}>
                      {item.label}
                    </PFText>
                    <button
                      type="button"
                      className={styles.removeButton}
                      aria-label={`${item.label} 삭제`}
                      disabled={submitting}
                      onClick={() => removeItem(item.id)}
                    >
                      <img src={closeFileUrl} alt="" width={20} height={20} aria-hidden="true" />
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}
        </section>

        <section className={styles.section} aria-labelledby="assignment-link-label">
          <PFText
            as="h2"
            id="assignment-link-label"
            typo="bd-md-sb"
            color="neutral-cool-600"
            className={styles.sectionTitle}
          >
            링크를 첨부해 주세요.
          </PFText>
          <div className={styles.linkRow}>
            <PFTextInput
              size="xlarge"
              value={linkInput}
              aria-label="과제 링크"
              placeholder="https://로 시작하는 링크를 입력해 주세요"
              disabled={submitting}
              onValueChange={setLinkInput}
              className={styles.linkInput}
            />
            <PFButton
              type="button"
              variant="secondary"
              size="xlarge"
              width={160}
              disabled={submitting}
              onClick={addLink}
            >
              추가
            </PFButton>
          </div>
          {items.some(item => item.kind === 'url') ? (
            <ul className={styles.itemList} aria-label="첨부한 과제 링크">
              {items
                .filter(item => item.kind === 'url')
                .map(item => (
                  <li key={item.id} className={styles.item}>
                    <PFText as="span" typo="bd-lg-rg" color="black" className={styles.itemLabel}>
                      {item.label}
                    </PFText>
                    <button
                      type="button"
                      className={styles.removeButton}
                      aria-label={`${item.label} 삭제`}
                      disabled={submitting}
                      onClick={() => removeItem(item.id)}
                    >
                      <img src={closeFileUrl} alt="" width={20} height={20} aria-hidden="true" />
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}
        </section>

        {errorMessage ? (
          <PFText as="p" role="alert" typo="bd-sm-rg" color="error" className={styles.error}>
            {errorMessage}
          </PFText>
        ) : null}

        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            width={160}
            disabled={submitting}
            onClick={onClose}
          >
            취소
          </PFButton>
          <PFButton
            type="button"
            variant="primary"
            size="xlarge"
            width={160}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? '제출 중...' : '과제 제출하기'}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
