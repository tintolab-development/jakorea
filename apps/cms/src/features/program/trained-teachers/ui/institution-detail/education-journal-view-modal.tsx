import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { CmsButton } from '@/shared/ui'
import { ContentModal } from '@/shared/ui/content-modal'
import type { TrainedTeachersEducationJournalEntry } from '@/features/program/trained-teachers/model/institution-detail'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { fetchTrainedTeacherEducationJournalBlob } from '@/features/program/trained-teachers/api/education-journals-service'
import './education-journal-section.css'

type PreviewKind = 'pdf' | 'image' | 'unsupported'

function resolvePreviewKind(fileName: string, blob: Blob): PreviewKind {
  const mime = blob.type.toLowerCase()
  const lower = fileName.toLowerCase()
  if (mime.includes('pdf') || lower.endsWith('.pdf')) return 'pdf'
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/u.test(lower)) return 'image'
  return 'unsupported'
}

interface TrainedTeachersEducationJournalViewModalProps {
  open: boolean
  entry: TrainedTeachersEducationJournalEntry | null
  onClose: () => void
  onDownload: (entry: TrainedTeachersEducationJournalEntry) => void
  isDownloading?: boolean
  programId?: string
}

export function TrainedTeachersEducationJournalViewModal({
  open,
  entry,
  onClose,
  onDownload,
  isDownloading = false,
  programId,
}: TrainedTeachersEducationJournalViewModalProps) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi() && Boolean(programId)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewKind, setPreviewKind] = useState<PreviewKind>('unsupported')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !entry) {
      setPreviewUrl(null)
      setPreviewKind('unsupported')
      setPreviewError(null)
      setIsPreviewLoading(false)
      return
    }

    let createdObjectUrl: string | null = null
    let cancelled = false

    const loadPreview = async () => {
      setIsPreviewLoading(true)
      setPreviewError(null)
      setPreviewUrl(null)
      setPreviewKind('unsupported')

      try {
        if (remoteEnabled && programId) {
          const blob = await fetchTrainedTeacherEducationJournalBlob(programId, entry)
          if (cancelled) return
          const kind = resolvePreviewKind(entry.fileName, blob)
          setPreviewKind(kind)
          if (kind === 'unsupported') return
          createdObjectUrl = URL.createObjectURL(blob)
          if (cancelled) {
            URL.revokeObjectURL(createdObjectUrl)
            createdObjectUrl = null
            return
          }
          setPreviewUrl(createdObjectUrl)
          return
        }

        const directUrl = entry.fileUrl?.trim()
        if (directUrl) {
          const byExt = resolvePreviewKind(entry.fileName, new Blob())
          setPreviewKind(byExt)
          if (byExt !== 'unsupported') {
            setPreviewUrl(directUrl)
          }
          return
        }

        setPreviewError('미리보기를 불러올 수 없습니다. 파일을 다운로드해 주세요.')
      } catch {
        if (!cancelled) {
          setPreviewError('미리보기를 불러오지 못했습니다. 파일을 다운로드해 주세요.')
        }
      } finally {
        if (!cancelled) setIsPreviewLoading(false)
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl)
    }
  }, [entry, open, programId, remoteEnabled])

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="교육일지 보기"
      width={800}
      footer={
        <CmsButton variant="primary" size="large" width={120} onClick={onClose}>
          닫기
        </CmsButton>
      }
    >
      {entry ? (
        <div className="trained-teachers-education-journal-view">
          <p className="trained-teachers-education-journal-view__file-name">{entry.fileName}</p>
          <p className="trained-teachers-education-journal-view__meta">
            제출 일시: {entry.submittedAt}
          </p>
          <div className="trained-teachers-education-journal-view__preview" role="status">
            {isPreviewLoading ? (
              <Spin />
            ) : previewUrl && previewKind === 'pdf' ? (
              <iframe
                className="trained-teachers-education-journal-view__preview-frame"
                title={`${entry.fileName} 미리보기`}
                src={previewUrl}
              />
            ) : previewUrl && previewKind === 'image' ? (
              <img
                className="trained-teachers-education-journal-view__preview-image"
                src={previewUrl}
                alt={entry.fileName}
              />
            ) : (
              <p className="trained-teachers-education-journal-view__preview-fallback">
                {previewError ??
                  '이 파일 형식은 미리보기를 지원하지 않습니다. 다운로드 후 확인해 주세요.'}
              </p>
            )}
            <CmsButton
              variant="secondary"
              size="medium"
              width={160}
              loading={isDownloading}
              disabled={isDownloading}
              onClick={() => onDownload(entry)}
            >
              파일 다운로드
            </CmsButton>
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
