import { useEffect, useState } from 'react'
import type { FileAttachmentParagraph } from '@/features/template/model/writing-form-draft.schema'
import { resolveParagraphTitleRequiredMark } from '@/features/template/lib/paragraph-required-mark'
import { FormParagraphSectionDescription } from '@/features/template/ui/shared/form-paragraph-section-description'
import { loadAdminFileBlob } from '@/shared/lib/admin-file-upload'
import './document-education-photos-readonly.css'

const DEFAULT_EDUCATION_PHOTOS_SLOT_COUNT = 2

const photoBlobByFileObjectId = new Map<number, Promise<Blob>>()

function trimText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function loadEducationPhotoBlob(fileObjectId: number): Promise<Blob> {
  const cached = photoBlobByFileObjectId.get(fileObjectId)
  if (cached) return cached
  const pending = loadAdminFileBlob(fileObjectId, { skipGlobalErrorAlert: true })
  photoBlobByFileObjectId.set(fileObjectId, pending)
  pending.catch(() => {
    photoBlobByFileObjectId.delete(fileObjectId)
  })
  return pending
}

function EducationPhotoSlot({
  fileObjectId,
  originalFileName,
  index,
}: {
  fileObjectId: number
  originalFileName?: string
  index: number
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const label = originalFileName?.trim() || `첨부 파일 ${index + 1}`

  useEffect(() => {
    let alive = true
    let objectUrl: string | null = null
    setSrc(null)
    setFailed(false)

    void loadEducationPhotoBlob(fileObjectId)
      .then(blob => {
        if (blob.size < 1 || blob.type === 'application/json') {
          if (alive) setFailed(true)
          return
        }
        const url = URL.createObjectURL(blob)
        if (!alive) {
          URL.revokeObjectURL(url)
          return
        }
        objectUrl = url
        setSrc(url)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })

    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileObjectId])

  const state = src && !failed ? 'ready' : failed ? 'failed' : 'loading'

  return (
    <div
      className="document-education-photos-readonly__slot"
      data-file-object-id={fileObjectId}
      data-photo-state={state}
    >
      {src && !failed ? (
        <img
          className="document-education-photos-readonly__image"
          src={src}
          alt={label}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="document-education-photos-readonly__file-label">
          {failed ? '사진을 불러오지 못했습니다.' : label}
        </span>
      )}
    </div>
  )
}

/** A4 contentOnly — 제목·설명·placeholder 그리드를 한 컴포넌트에서 렌더 (헤더 숨김과 병행) */
export function DocumentEducationPhotosReadonly({
  paragraph,
  slotCount = DEFAULT_EDUCATION_PHOTOS_SLOT_COUNT,
  files = [],
  hideRequiredMark = false,
}: {
  paragraph: FileAttachmentParagraph
  slotCount?: number
  files?: readonly { fileObjectId: number; originalFileName?: string }[]
  hideRequiredMark?: boolean
}) {
  const title = trimText(paragraph.paragraphTitle) || '교육 사진'
  const description = trimText(paragraph.paragraphDescription)
  const showDescription = description.length > 0 && description !== '설명 입력'

  return (
    <div className="document-education-photos-readonly">
      <div className="document-education-photos-readonly__header">
        <div className="document-education-photos-readonly__title-wrap">
          <span className="document-education-photos-readonly__title">{title}</span>
          {!hideRequiredMark && resolveParagraphTitleRequiredMark(paragraph) ? (
            <span className="document-education-photos-readonly__required" aria-hidden>
              *
            </span>
          ) : null}
        </div>
        {showDescription ? (
          <FormParagraphSectionDescription
            surface="templateAuthoring"
            titleAligned
            className="document-education-photos-readonly__description"
          >
            {description}
          </FormParagraphSectionDescription>
        ) : null}
      </div>
      <div className="document-education-photos-readonly__grid">
        {Array.from({ length: Math.max(slotCount, files.length) }, (_, index) => {
          const file = files[index]
          if (file == null) {
            return (
              <div
                key={`empty-${index}`}
                className="document-education-photos-readonly__slot"
                aria-hidden
              />
            )
          }
          return (
            <EducationPhotoSlot
              key={file.fileObjectId}
              fileObjectId={file.fileObjectId}
              originalFileName={file.originalFileName}
              index={index}
            />
          )
        })}
      </div>
    </div>
  )
}
