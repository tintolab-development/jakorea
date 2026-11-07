import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'
import {
  GEMINI_PERFORMANCE_DUPLICATE_MESSAGE,
  GEMINI_PERFORMANCE_DUPLICATE_TITLE,
} from '../../lib/performance/import-popup-copy'

export type GeminiPerformanceDuplicateStrategy = 'overwrite' | 'append'

type UploadDuplicateModalProps = {
  open: boolean
  loading?: boolean
  onCancel: () => void
  onOverwrite: () => void
  onAppend: () => void
}

export function UploadDuplicateModal({
  open,
  loading = false,
  onCancel,
  onOverwrite,
  onAppend,
}: UploadDuplicateModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={() => {
        if (!loading) onCancel()
      }}
      title={GEMINI_PERFORMANCE_DUPLICATE_TITLE}
      width={600}
      footer={
        <>
          <CmsButton variant="cancel" type="button" disabled={loading} onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="secondary" type="button" disabled={loading} onClick={onOverwrite}>
            덮어쓰기
          </CmsButton>
          <CmsButton variant="primary" type="button" disabled={loading} onClick={onAppend}>
            데이터 추가
          </CmsButton>
        </>
      }
    >
      <p className="gemini-performance-upload-duplicate-modal__message">
        {GEMINI_PERFORMANCE_DUPLICATE_MESSAGE}
      </p>
    </ContentModal>
  )
}
