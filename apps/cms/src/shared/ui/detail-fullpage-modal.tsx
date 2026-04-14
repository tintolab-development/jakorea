/**
 * 풀페이지 상세 모달 공통 셸 — LNB + 메인(타이틀·옵션 액션·닫기·스크롤 영역)
 */

import { CloseOutlined } from '@ant-design/icons'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import './detail-fullpage-modal.css'

export interface DetailFullPageModalProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  /** 메인 헤더: 타이틀과 닫기 사이 (예: 회원 상세 액션 버튼) */
  headerExtra?: React.ReactNode
  /** 메인 컨텐츠 영역 추가 영역 (예: 회원 상세 액션 버튼) */
  contentExtra?: React.ReactNode
  /** 미지정 시 LNB 없이 메인만 풀폭 */
  sidebar?: React.ReactNode
  children: React.ReactNode
  /** 닫기(X) 동작 — 미지정 시 onClose */
  onHeaderClose?: () => void
  /** ant-modal 루트에 추가 (예: program-detail-fullpage-modal) */
  className?: string
  closeAriaLabel?: string
}

export function DetailFullPageModal({
  open,
  onClose,
  title,
  headerExtra,
  contentExtra,
  sidebar,
  children,
  onHeaderClose,
  className: classNameProp,
  closeAriaLabel = '닫기',
}: DetailFullPageModalProps) {
  const handleClose = onHeaderClose ?? onClose
  const rootClass = [
    'detail-fullpage-modal',
    sidebar == null ? 'detail-fullpage-modal--no-sidebar' : '',
    classNameProp,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className={rootClass}
    >
      <div className="detail-fullpage-modal__layout">
        {sidebar ?? null}
        <div className="detail-fullpage-modal__main">
          <header className="detail-fullpage-modal__header">
            <div className="detail-fullpage-modal__header-top">
              <h2 className="detail-fullpage-modal__title">{title}</h2>
              <button
                type="button"
                className="detail-fullpage-modal__close"
                onClick={handleClose}
                aria-label={closeAriaLabel}
              >
                <CloseOutlined />
              </button>
            </div>
            {headerExtra ? <>{headerExtra}</> : null}
          </header>
          <div className="detail-fullpage-modal__content">
            {contentExtra ? (
              <div className="detail-fullpage-modal__content-actions-wrapper">
                <div className="detail-fullpage-modal__content-actions">{contentExtra}</div>
                <div>{children}</div>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
