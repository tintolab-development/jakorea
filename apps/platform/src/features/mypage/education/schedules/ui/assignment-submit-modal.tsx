import { useRef, useState, type ChangeEvent } from 'react'
import type { EducationScheduleAssignmentFile } from '../model/types'
import { PFButton, PFModal, PFText, PFTextInput } from '@/shared/ui'
import {
  formatMultiFileUploadHint,
  sumUploadFileBytes,
  validateUploadBatch,
} from '@/shared/lib/file-upload-policy'
import { PORTAL_ASSIGNMENT_MAX_SUBMISSION_ITEMS } from '../api/assignment-client'
import closeFileUrl from '@/shared/assets/icons/close-black.svg'
import styles from './assignment-submit-modal.module.css'

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

const ASSIGNMENT_FILE_FORMATS =
  'hwp, hwpx, doc, docx, ppt, pptx, pdf, xls, xlsx, csv, txt, png, jpg(jpeg), heic, bmp, mp4, mov, zip'
const ASSIGNMENT_FILE_HINT = formatMultiFileUploadHint(ASSIGNMENT_FILE_FORMATS)
const ASSIGNMENT_LINK_HINTS = [
  '대용량 파일은 클라우드(구글 드라이브 등)에 업로드한 뒤 공유 링크를 첨부해 주세요.',
  '담당자가 열람할 수 있도록 링크 공유 권한을 설정해 주세요.',
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
  urls: string[]
}

type EducationAssignmentSubmitModalProps = {
  open: boolean
  sessionHeading: string
  periodLabel: string
  mode?: 'submit' | 'revise'
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
  const prefix = file.kind === 'url' ? 'url' : 'file'
  const id = file.id.startsWith(`${prefix}-`) ? file.id : `${prefix}-${file.id}`
  return {
    id,
    label: file.kind === 'url' ? file.url : file.fileName,
    kind: file.kind,
    ...(file.kind === 'file' && file.fileObjectId != null
      ? { fileObjectId: file.fileObjectId }
      : {}),
  }
}

function assignmentUrlValidationMessage(value: string): string | null {
  if (value.length === 0 || value.length > 4096 || /\s/.test(value)) {
    return 'https://로 시작하는 올바른 링크를 입력해 주세요.'
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return 'https://로 시작하는 올바른 링크를 입력해 주세요.'
  }

  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
    return 'https://로 시작하는 올바른 링크를 입력해 주세요.'
  }

  return null
}

function fileTypeValidationMessage(file: File): string | null {
  if (!ACCEPTED_FILE_EXTENSIONS.includes(getFileExtension(file.name) as (typeof ACCEPTED_FILE_EXTENSIONS)[number])) {
    return '첨부할 수 없는 파일 형식이에요. 안내된 형식의 파일을 선택해 주세요.'
  }
  return null
}

export function EducationAssignmentSubmitModal({
  open,
  sessionHeading,
  periodLabel,
  mode = 'submit',
  initialFiles = [],
  submitting = false,
  onClose,
  onSubmit,
}: EducationAssignmentSubmitModalProps) {
  const isRevision = mode === 'revise'
  const title = isRevision ? '과제 수정 제출하기' : '과제 제출하기'
  const displaySessionHeading = sessionHeading.replace(/,\s*/, ' ')
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

    if (items.length + selected.length > PORTAL_ASSIGNMENT_MAX_SUBMISSION_ITEMS) {
      setErrorMessage('과제 파일과 링크를 합쳐 최대 20개까지 제출할 수 있어요.')
      return
    }

    const fileItems = items.filter(item => item.kind === 'file')
    const policyError = validateUploadBatch({
      currentCount: fileItems.length,
      currentTotalBytes: sumUploadFileBytes(fileItems.flatMap(item => (item.file ? [item.file] : []))),
      incoming: selected,
    })
    if (policyError) {
      setErrorMessage(policyError)
      return
    }
    const invalidFile = selected.find(file => fileTypeValidationMessage(file) != null)
    if (invalidFile) {
      setErrorMessage(fileTypeValidationMessage(invalidFile) ?? '파일을 첨부할 수 없어요.')
      return
    }

    setItems(previous => [
      ...previous,
      ...selected.map(file => ({
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
    const validationMessage = assignmentUrlValidationMessage(link)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }
    if (items.length >= PORTAL_ASSIGNMENT_MAX_SUBMISSION_ITEMS) {
      setErrorMessage('과제 파일과 링크를 합쳐 최대 20개까지 제출할 수 있어요.')
      return
    }
    if (items.some(item => item.kind === 'url' && item.label === link)) {
      setErrorMessage('이미 추가한 링크예요.')
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
      setErrorMessage('과제 파일 또는 링크를 1개 이상 첨부해 제출해 주세요.')
      return
    }

    onSubmit({
      newFiles: items.flatMap(item => (item.file ? [item.file] : [])),
      keepFileObjectIds: items.flatMap(item =>
        item.kind === 'file' && item.fileObjectId != null ? [item.fileObjectId] : [],
      ),
      urls: items.flatMap(item => (item.kind === 'url' ? [item.label] : [])),
    })
  }

  const fileItems = items.filter(item => item.kind === 'file')
  const linkItems = items.filter(item => item.kind === 'url')

  return (
    <PFModal
      showCloseButton={false}
      open={open}
      title={title}
      size="md"
      mobilePlacement="full"
      closeOnBackdropClick={!submitting}
      closeOnEscape={!submitting}
      onClose={onClose}
      className={styles.modal}
    >
      <div className={styles.body}>
        <PFText as="p" typo="bd-md-rg" color="neutral-warm-600" className={styles.guide}>
          과제 파일 또는 업로드 링크를 첨부해 제출해 주세요.
          <br />
          제출한 과제는 마감 전까지 수정할 수 있어요.
        </PFText>

        <div className={styles.sessionCard}>
          <PFText as="p" typo="bd-lg-sb" color="black" className={styles.sessionHeading}>
            {displaySessionHeading}
          </PFText>
          <div className={styles.periodRow}>
            <PFText as="span" typo="bd-lg-rg" color="primary-500">
              과제 제출 기간
            </PFText>
            <span className={styles.periodDivider} aria-hidden="true" />
            <PFText as="span" typo="bd-lg-rg" color="primary-500">
              {periodLabel}
            </PFText>
          </div>
        </div>

        <section className={styles.section} aria-labelledby="assignment-file-label">
          <PFText
            as="h2"
            id="assignment-file-label"
            typo="bd-md-rg"
            color="neutral-warm-600"
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
            <li>{ASSIGNMENT_FILE_HINT}</li>
            <li>첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.</li>
          </ul>
          {fileItems.length > 0 ? (
            <div
              className={[styles.itemListViewport, fileItems.length >= 2 ? styles.itemListScrollable : undefined]
                .filter(Boolean)
                .join(' ')}
            >
              <ul className={styles.itemList} aria-label="첨부한 과제 파일">
                {fileItems.map(item => (
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
            </div>
          ) : (
            <div className={styles.emptyItemSpace} aria-hidden="true" />
          )}
        </section>

        <div className={styles.sectionDivider} aria-hidden="true" />

        <section className={styles.section} aria-labelledby="assignment-link-label">
          <PFText
            as="h2"
            id="assignment-link-label"
            typo="bd-md-rg"
            color="neutral-warm-600"
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
          <ul className={styles.policy}>
            {ASSIGNMENT_LINK_HINTS.map(hint => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
          {linkItems.length > 0 ? (
            <div
              className={[styles.itemListViewport, linkItems.length >= 2 ? styles.itemListScrollable : undefined]
                .filter(Boolean)
                .join(' ')}
            >
              <ul className={styles.itemList} aria-label="첨부한 과제 링크">
                {linkItems.map(item => (
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
            </div>
          ) : (
            <div className={styles.emptyItemSpace} aria-hidden="true" />
          )}
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
            {submitting ? '제출 중...' : isRevision ? '수정 제출하기' : '과제 제출하기'}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
