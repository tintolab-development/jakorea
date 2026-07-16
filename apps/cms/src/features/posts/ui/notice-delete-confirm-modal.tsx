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
  /** ContentModal 가로(px). `inquiry` | `faq` | `notice`일 때 기본 600 */
  width?: number
  /** `inquiry`: 문의 삭제 600×230 · `faq` | `notice`: 600px 너비(각각 CSS 클래스) */
  preset?: 'default' | 'inquiry' | 'faq' | 'notice'
  /** 확인(삭제) 버튼 라벨 (기본: 삭제) */
  confirmLabel?: string
}

export function NoticeDeleteConfirmModal({
  open,
  onCancel,
  onConfirm,
  zIndex = 1100,
  title = '공지사항 삭제',
  line1 = DEFAULT_LINE1,
  line2 = DEFAULT_LINE2,
  width: widthProp,
  preset = 'default',
  confirmLabel = '삭제',
}: NoticeDeleteConfirmModalProps) {
  const width =
    preset === 'inquiry' || preset === 'faq' || preset === 'notice'
      ? (widthProp ?? 600)
      : widthProp

  const wrapClassName = [
    'notice-delete-confirm-modal-wrap',
    preset === 'inquiry' && 'inquiry-delete-confirm-modal-wrap',
    preset === 'faq' && 'faq-delete-confirm-modal-wrap',
    preset === 'notice' && 'post-notice-delete-confirm-modal-wrap',
  ]
    .filter(Boolean)
    .join(' ')

  const modalClassName = [
    'notice-delete-confirm-modal',
    preset === 'inquiry' && 'inquiry-delete-confirm-modal',
    preset === 'faq' && 'faq-delete-confirm-modal',
    preset === 'notice' && 'post-notice-delete-confirm-modal',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={width}
      zIndex={zIndex}
      wrapClassName={wrapClassName}
      className={modalClassName}
      description={`${line1}\n${line2}`}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            size="medium"
            className="notice-delete-confirm-modal__delete-btn"
            onClick={onConfirm}
          >
            {confirmLabel}
          </CmsButton>
        </>
      }
    >
      {null}
    </ContentModal>
  )
}
