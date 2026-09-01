/**
 * 풀페이지 상세 모달 공통 셸 — LNB + 메인(타이틀·옵션 액션·닫기·스크롤 영역)
 */

import { CloseOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import './detail-fullpage-modal.css'

export interface DetailFullPageModalProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  /** 메인 헤더 1행: 타이틀과 닫기 사이 우측 영역 (예: 풀페이지 breadcrumb) */
  headerTrailing?: React.ReactNode
  /** 메인 헤더: 타이틀과 닫기 사이 (예: 회원 상세 액션 버튼) */
  headerExtra?: React.ReactNode
  /** 메인 컨텐츠 영역 추가 영역 (예: 회원 상세 액션 버튼) */
  contentExtra?: React.ReactNode
  /** 미지정 시 LNB 없이 메인만 풀폭 */
  sidebar?: React.ReactNode
  children?: React.ReactNode
  /** 상세 GET 첫 응답 전 — children 대신 공통 스피너 (캐시가 있으면 쓰지 말 것) */
  loading?: boolean
  /** 상세 GET 실패 — children 대신 에러. loading이 우선 */
  error?: React.ReactNode
  /** 닫기(X) 동작 — 미지정 시 onClose */
  onHeaderClose?: () => void
  /** ant-modal 루트에 추가 (예: program-detail-fullpage-modal) */
  className?: string
  closeAriaLabel?: string
  /** 다른 풀페이지·미리보기 모달과 스택 순서 조정 (기본 ant Modal 1000) */
  zIndex?: number
}

function DetailFullPageModalBody({
  loading,
  error,
  children,
}: {
  loading?: boolean
  error?: React.ReactNode
  children?: React.ReactNode
}) {
  if (loading) {
    return (
      <div className="detail-fullpage-modal__loading" role="status" aria-label="상세 불러오는 중">
        <Spin size="large" />
      </div>
    )
  }
  if (error != null && error !== '') {
    return (
      <div className="page-content-error" role="alert">
        {error}
      </div>
    )
  }
  return children
}

export function DetailFullPageModal({
  open,
  onClose,
  title,
  headerTrailing,
  headerExtra,
  contentExtra,
  sidebar,
  children,
  loading,
  error,
  onHeaderClose,
  className: classNameProp,
  closeAriaLabel = '닫기',
  zIndex,
}: DetailFullPageModalProps) {
  const handleClose = onHeaderClose ?? onClose
  const body = (
    <DetailFullPageModalBody loading={loading} error={error}>
      {children}
    </DetailFullPageModalBody>
  )
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
      onCancel={handleClose}
      title=""
      size="full"
      hideHeader
      className={rootClass}
      zIndex={zIndex}
    >
      <div className="detail-fullpage-modal__layout">
        {sidebar ?? null}
        <div className="detail-fullpage-modal__main">
          <header className="detail-fullpage-modal__header">
            <div className="detail-fullpage-modal__header-top">
              <h2 className="detail-fullpage-modal__title">{title}</h2>
              {headerTrailing ? (
                <div className="detail-fullpage-modal__header-trailing">{headerTrailing}</div>
              ) : null}
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
            {contentExtra && !loading && error == null ? (
              <div className="detail-fullpage-modal__content-actions-wrapper">
                <div className="detail-fullpage-modal__content-actions">{contentExtra}</div>
                <div>{body}</div>
              </div>
            ) : (
              body
            )}
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
