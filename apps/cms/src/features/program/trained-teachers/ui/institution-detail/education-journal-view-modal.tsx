import { CmsButton } from '@/shared/ui'
import { ContentModal } from '@/shared/ui/content-modal'
import type { TrainedTeachersEducationJournalEntry } from '@/data/mock/trained-teachers-institution-detail'
import './education-journal-section.css'

interface TrainedTeachersEducationJournalViewModalProps {
  open: boolean
  entry: TrainedTeachersEducationJournalEntry | null
  onClose: () => void
}

export function TrainedTeachersEducationJournalViewModal({
  open,
  entry,
  onClose,
}: TrainedTeachersEducationJournalViewModalProps) {
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
            <p>파일 미리보기(mock)</p>
            <CmsButton
              variant="secondary"
              size="medium"
              width={160}
              onClick={() => {
                window.alert(`「${entry.fileName}」 다운로드를 시작합니다. (mock)`)
              }}
            >
              파일 다운로드
            </CmsButton>
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
