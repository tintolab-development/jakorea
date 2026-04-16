import { ContentModal, CmsButton } from '@/shared/ui'
import './notice-delete-confirm-modal.css'

const DEFAULT_LINE1 = '해당 공지사항을 삭제하시겠습니까?'
const DEFAULT_LINE2 = '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?'

export interface NoticeDeleteConfirmModalProps {
  open: boolean
  onCancel: () => void
  /** 삭제 버튼 클릭 시 (스토어 삭제·토스트 등은 호출부에서 처리) */
  onConfirm: () => void
  /** 다른 모달(예: 공지 수정) 위에 겹칠 때 */
  zIndex?: number
  /** 헤더 제목 (미지정 시 「공지사항 삭제」) */
  title?: string
  /** 본문 첫 줄 (미지정 시 단건 삭제 기본 문구) */
  line1?: string
  /** 본문 둘째 줄 (미지정 시 기본 문구) */
  line2?: string
}

export function NoticeDeleteConfirmModal({
  open,
  onCancel,
  onConfirm,
  zIndex = 1100,
  title = '공지사항 삭제',
  line1 = DEFAULT_LINE1,
  line2 = DEFAULT_LINE2,
}: NoticeDeleteConfirmModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      zIndex={zIndex}
      wrapClassName="notice-delete-confirm-modal-wrap"
      className="notice-delete-confirm-modal"
      description={
        <div className="notice-delete-confirm-modal__body">
          <p className="notice-delete-confirm-modal__line">{line1}</p>
          <p className="notice-delete-confirm-modal__line">{line2}</p>
        </div>
      }
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            size="large"
            className="notice-delete-confirm-modal__delete-btn"
            onClick={onConfirm}
          >
            삭제
          </CmsButton>
        </>
      }
    >
      {null}
    </ContentModal>
  )
}
