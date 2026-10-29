import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'
import {
  GEMINI_PERFORMANCE_DUPLICATE_MESSAGE,
  GEMINI_PERFORMANCE_DUPLICATE_TITLE,
} from '../../lib/performance/import-popup-copy'

export type GeminiPerformanceDuplicateStrategy = 'overwrite' | 'append'

type UploadDuplicateModalProps = {
  open: boolean
  onCancel: () => void
  onOverwrite: () => void
  onAppend: () => void
  /** 지급 완료 중복 — 덮어쓰기 숨김, 데이터 추가만 */
  overwriteDisabled?: boolean
}

export function UploadDuplicateModal({
  open,
  onCancel,
  onOverwrite,
  onAppend,
  overwriteDisabled = false,
}: UploadDuplicateModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={GEMINI_PERFORMANCE_DUPLICATE_TITLE}
      width={600}
      footer={
        <>
          <CmsButton variant="secondary" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          {overwriteDisabled ? null : (
            <CmsButton variant="secondary" type="button" onClick={onOverwrite}>
              덮어쓰기
            </CmsButton>
          )}
          <CmsButton type="button" onClick={onAppend}>
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
