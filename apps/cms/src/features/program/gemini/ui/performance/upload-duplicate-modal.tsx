import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'

export type GeminiPerformanceDuplicateStrategy = 'overwrite' | 'append'

type UploadDuplicateModalProps = {
  open: boolean
  onCancel: () => void
  onOverwrite: () => void
  onAppend: () => void
}

export function UploadDuplicateModal({
  open,
  onCancel,
  onOverwrite,
  onAppend,
}: UploadDuplicateModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="중복 데이터 안내"
      width={520}
      footer={
        <>
          <CmsButton variant="secondary" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="secondary" type="button" onClick={onOverwrite}>
            덮어쓰기
          </CmsButton>
          <CmsButton type="button" onClick={onAppend}>
            데이터 추가
          </CmsButton>
        </>
      }
    >
      <p className="gemini-performance-upload-duplicate-modal__message">
        중복 데이터가 있습니다. 어떻게 처리하시겠습니까?
      </p>
    </ContentModal>
  )
}
