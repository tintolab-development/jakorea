/**
 * 연차 / 회계감사 보고서 등록·수정 모달
 */

import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  ReportCreateInput,
  ReportKind,
  TransparencyReport,
} from '@/entities/reports-disclosure/model/types'
import { ThumbnailEmptyIcon } from '@/features/reports-disclosure/ui/thumbnail-empty-icon'
import { shouldUseReportsDisclosureRemoteApi } from '@/features/reports-disclosure/api/capabilities'
import {
  CmsButton,
  CmsInput,
  ConfirmModal,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'

import './report-form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const PDF_ACCEPT = '.pdf,application/pdf'
const MAX_BYTES = 15 * 1024 * 1024

const KIND_META = {
  annual: {
    label: '연차보고서',
    description:
      '연차보고서 제목 작성 및 썸네일 이미지와 첨부파일을 업로드 해주세요.\n썸네일 이미지는 A4 비율로 반영 및 노출됩니다.',
    thumbGuide: [
      '- 파일은 최대 15MB까지 JPG, PNG 형식만 등록 가능합니다.',
      '- 권장 썸네일 사이즈는 328*463입니다.',
    ],
    previewClass: 'rd-form-modal__preview--a4',
  },
  audit: {
    label: '회계감사 보고서',
    description:
      '회계감사 보고서 제목 작성 및 썸네일 이미지와 첨부파일을 업로드 해주세요.\n썸네일 이미지는 16:9 비율로 반영 및 노출됩니다.',
    thumbGuide: [
      '- 파일은 최대 15MB까지 JPG, PNG 형식만 등록 가능합니다.',
      '- 권장 썸네일 사이즈는 461*256입니다.',
    ],
    previewClass: 'rd-form-modal__preview--wide',
  },
} as const

const ATTACH_GUIDE = [
  '- 파일은 최대 15MB까지 pdf 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

function isAllowedImageFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

function isAllowedPdfFile(file: File): boolean {
  if (file.type.toLowerCase() === 'application/pdf') return true
  return file.name.toLowerCase().endsWith('.pdf')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export type ReportFormValues = ReportCreateInput

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  kind: ReportKind
  initial?: TransparencyReport | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: ReportFormValues) => void
  onDelete?: () => void
}

export function ReportFormModal({
  open,
  mode,
  kind,
  initial,
  confirmLoading,
  deleteLoading,
  onCancel,
  onSubmit,
  onDelete,
}: Props) {
  const meta = KIND_META[kind]
  const { showAlert } = useCmsAlert()
  const [title, setTitle] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailFileName, setThumbnailFileName] = useState('')
  const [attachmentFileName, setAttachmentFileName] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [pendingThumbFile, setPendingThumbFile] = useState<File | null>(null)
  const [pendingAttachFile, setPendingAttachFile] = useState<File | null>(null)
  const [thumbCleared, setThumbCleared] = useState(false)
  const [attachCleared, setAttachCleared] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const resetFromInitial = useCallback(() => {
    if (mode === 'edit' && initial) {
      setTitle(initial.title)
      setThumbnailUrl(initial.thumbnailUrl)
      setThumbnailFileName(initial.thumbnailFileName)
      setAttachmentFileName(initial.attachmentFileName)
      setAttachmentUrl(initial.attachmentUrl)
    } else {
      setTitle('')
      setThumbnailUrl('')
      setThumbnailFileName('')
      setAttachmentFileName('')
      setAttachmentUrl('')
    }
    setPendingThumbFile(null)
    setPendingAttachFile(null)
    setThumbCleared(false)
    setAttachCleared(false)
  }, [mode, initial])

  useEffect(() => {
    if (open) resetFromInitial()
  }, [open, resetFromInitial])

  const handleThumbFiles = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (!isAllowedImageFile(file)) {
      showAlert({
        title: '파일 형식 오류',
        content: 'JPG, PNG 형식의 이미지만 등록할 수 있습니다.',
      })
      return
    }
    if (file.size > MAX_BYTES) {
      showAlert({
        title: '용량 초과',
        content: '파일은 최대 15MB까지 등록 가능합니다.',
      })
      return
    }
    try {
      const url = await readFileAsDataUrl(file)
      setThumbnailUrl(url)
      setThumbnailFileName(file.name)
      setPendingThumbFile(file)
      setThumbCleared(false)
    } catch {
      showAlert({
        title: '파일 읽기 실패',
        content: '썸네일 이미지를 읽지 못했습니다. 다시 시도해 주세요.',
      })
    }
  }

  const handleAttachFiles = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (!isAllowedPdfFile(file)) {
      showAlert({
        title: '파일 형식 오류',
        content: 'PDF 형식의 파일만 등록할 수 있습니다.',
      })
      return
    }
    if (file.size > MAX_BYTES) {
      showAlert({
        title: '용량 초과',
        content: '파일은 최대 15MB까지 등록 가능합니다.',
      })
      return
    }
    try {
      const url = await readFileAsDataUrl(file)
      setAttachmentUrl(url)
      setAttachmentFileName(file.name)
      setPendingAttachFile(file)
      setAttachCleared(false)
    } catch {
      showAlert({
        title: '파일 읽기 실패',
        content: '첨부파일을 읽지 못했습니다. 다시 시도해 주세요.',
      })
    }
  }

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) {
      showAlert({ title: '입력 확인', content: '제목을 입력해 주세요.' })
      return
    }
    const useRemote = shouldUseReportsDisclosureRemoteApi()
    const hasExistingThumb =
      useRemote &&
      !thumbCleared &&
      !pendingThumbFile &&
      Boolean(initial?.thumbnailAssetId) &&
      Boolean(thumbnailUrl.trim())
    const hasExistingAttach =
      useRemote &&
      !attachCleared &&
      !pendingAttachFile &&
      Boolean(initial?.attachmentAssetId) &&
      Boolean(attachmentUrl.trim())

    if (!thumbnailUrl || !thumbnailFileName) {
      if (!(useRemote && hasExistingThumb)) {
        showAlert({ title: '입력 확인', content: '썸네일 이미지를 등록해 주세요.' })
        return
      }
    }
    if (!attachmentUrl || !attachmentFileName) {
      if (!(useRemote && hasExistingAttach)) {
        showAlert({ title: '입력 확인', content: '첨부파일을 등록해 주세요.' })
        return
      }
    }
    if (useRemote && mode === 'create' && (!pendingThumbFile || !pendingAttachFile)) {
      showAlert({
        title: '입력 확인',
        content: '썸네일과 첨부파일을 파일로 등록해 주세요.',
      })
      return
    }
    onSubmit({
      title: t,
      thumbnailUrl,
      thumbnailFileName,
      attachmentFileName,
      attachmentUrl,
      thumbnailFile: pendingThumbFile,
      attachmentFile: pendingAttachFile,
      thumbnailAssetId:
        !pendingThumbFile && !thumbCleared ? initial?.thumbnailAssetId : undefined,
      attachmentAssetId:
        !pendingAttachFile && !attachCleared ? initial?.attachmentAssetId : undefined,
    })
  }

  const titleText =
    mode === 'create' ? `${meta.label} 등록` : `${meta.label} 수정`
  const confirmText = mode === 'create' ? '보고서 등록' : '저장'

  const footer = (
    <div className="rd-form-modal__footer">
      <div className="rd-form-modal__footer-start">
        {mode === 'edit' && onDelete ? (
          <CmsButton
            variant="delete"
            size="large"
            type="button"
            disabled={confirmLoading || deleteLoading}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            보고서 삭제
          </CmsButton>
        ) : null}
      </div>
      <div className="rd-form-modal__footer-end">
        <CmsButton
          variant="secondary"
          size="large"
          type="button"
          disabled={confirmLoading || deleteLoading}
          onClick={onCancel}
        >
          취소
        </CmsButton>
        <CmsButton
          variant="primary"
          size="large"
          type="button"
          loading={confirmLoading}
          disabled={deleteLoading}
          onClick={handleSubmit}
        >
          {confirmText}
        </CmsButton>
      </div>
    </div>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={titleText}
        description={meta.description}
        width={720}
        className="rd-form-modal content-modal content-modal--title-body-gap-always teal-header-modal"
        footer={footer}
      >
        <DetailInfoForm title={titleText} hideHeader mode="edit">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="제목"
                view={null}
                edit={
                  <CmsInput
                    inputSize="large"
                    width="100%"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="썸네일"
                view={null}
                edit={
                  <div className="rd-form-modal__image-row">
                    <div
                      className={
                        thumbnailUrl
                          ? `rd-form-modal__preview ${meta.previewClass}`
                          : 'rd-form-modal__preview rd-form-modal__preview--empty'
                      }
                      aria-hidden={!thumbnailUrl}
                    >
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="썸네일 미리보기" />
                      ) : (
                        <ThumbnailEmptyIcon className="rd-form-modal__preview-empty" />
                      )}
                    </div>
                    <FileSelectField
                      className="rd-form-modal__file-field"
                      multiple={false}
                      accept={IMAGE_ACCEPT}
                      buttonLabel="파일 추가"
                      fileNames={thumbnailFileName ? [thumbnailFileName] : []}
                      guideLines={meta.thumbGuide}
                      onFilesChange={files => {
                        void handleThumbFiles(files)
                      }}
                      onRemoveFile={() => {
                        setThumbnailUrl('')
                        setThumbnailFileName('')
                        setPendingThumbFile(null)
                        setThumbCleared(true)
                      }}
                    />
                  </div>
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="첨부파일"
                view={null}
                edit={
                  <div className="rd-form-modal__attach-row">
                    <FileSelectField
                      className="rd-form-modal__file-field"
                      multiple={false}
                      accept={PDF_ACCEPT}
                      buttonLabel="파일 추가"
                      fileNames={attachmentFileName ? [attachmentFileName] : []}
                      guideLines={ATTACH_GUIDE}
                      onFilesChange={files => {
                        void handleAttachFiles(files)
                      }}
                      onRemoveFile={() => {
                        setAttachmentUrl('')
                        setAttachmentFileName('')
                        setPendingAttachFile(null)
                        setAttachCleared(true)
                      }}
                    />
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
      </ContentModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="보고서 삭제"
        content={'선택한 보고서를 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.'}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={deleteLoading}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete?.()
        }}
      />
    </>
  )
}
