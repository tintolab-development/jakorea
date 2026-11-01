import { SIMPLE_DELETE_IRREVERSIBLE_LINE } from '@/shared/constants/simple-delete-confirm'
import { ContentModal, CmsButton } from '@/shared/ui'
import './notice-delete-confirm-modal.css'

const DEFAULT_LINE1 = '해당 공지사항을 삭제하시겠습니까?'

/** 삭제 확인(안내) 모달 — 시안 SSOT */
export const DELETE_CONFIRM_MODAL_WIDTH = 600

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
  /** ContentModal 가로(px). 기본 600 */
  width?: number
  /** `inquiry`: 문의 삭제 600×230(높이 CSS) · `faq` | `notice`: 동일 600px 너비 클래스 */
  preset?: 'default' | 'inquiry' | 'faq' | 'notice'
  /** 확인(삭제) 버튼 라벨 (기본: 삭제) */
  confirmLabel?: string
  /** 삭제 API 대기 중 */
  confirmLoading?: boolean
}

export function NoticeDeleteConfirmModal({
  open,
  onCancel,
  onConfirm,
  zIndex = 1100,
  title = '공지사항 삭제 안내',
  line1 = DEFAULT_LINE1,
  line2 = SIMPLE_DELETE_IRREVERSIBLE_LINE,
  width: widthProp,
  preset = 'default',
  confirmLabel = '삭제',
  confirmLoading = false,
}: NoticeDeleteConfirmModalProps) {
  const width = widthProp ?? DELETE_CONFIRM_MODAL_WIDTH

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
          <CmsButton variant="secondary" size="h40" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            size="h40"
            onClick={onConfirm}
            loading={confirmLoading}
            disabled={confirmLoading} >
            {confirmLabel}
          </CmsButton>
        </>
      }
    >
      {null}
    </ContentModal>
  )
}
