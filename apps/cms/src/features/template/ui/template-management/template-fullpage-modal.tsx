import { CloseOutlined, DownloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInputIconClick } from '@/shared/ui/cms-input-iconclick'
import { FormParagraphSectionDescription } from '@/features/template/ui/shared/form-paragraph-section-description'
import './template-fullpage-modal.css'
import '../paragraph/shared/paragraph-card.css'

interface TemplateFullpageModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  templateTabType: 'writing' | 'issuance'
  onPreview?: () => void
  onSave?: () => void
  onDownloadDocument?: () => void
  /** true이면 문서 다운로드 버튼 비활성(중복 클릭 방지 등) */
  downloadDocumentLoading?: boolean
  leftContent: ReactNode
  rightNavigation: ReactNode
  className?: string
  /**
   * 문자열 제목일 때 상단 `CmsInputIconClick` 편집·연필 비활성화(프로그램 등록 등 템플릿 사용자 모드).
   */
  titleReadOnly?: boolean
  /**
   * 템플릿 등록 사용자 모드 — 미리보기와 동일 청록 헤더·회색 본문·상단 닫기/미리보기/임시저장.
   */
  registrationUserMode?: boolean
  /** 저장 버튼 라벨 (`registrationUserMode` 기본: 임시저장) */
  saveLabel?: string
  /** 우측 하단 CTA — 미전달 시 숨김 (단일, `footerActions`와 병용 시 배열 우선) */
  footerAction?: TemplateFullpageModalFooterAction
  /** 우측 하단 CTA 복수 — 등록 단계별 이전/다음 버튼 */
  footerActions?: TemplateFullpageModalFooterAction[]
  /** 청록 헤더와 본문 사이 영역(단계 탭 등) — 레거시·비등록 모드 */
  subHeader?: ReactNode
  /** `full-page-modal__body-header` 좌측(닫기·미리보기·임시저장과 동일 행) */
  bodyHeaderLeading?: ReactNode
  /** 프로그램 상세 등 다른 풀페이지 모달 위에 겹칠 때 스택 순서 */
  zIndex?: number
}

export type TemplateFullpageModalFooterAction = {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  /** primary CTA 우측 `>` — `true`일 때만 표시 */
  showArrow?: boolean
}

interface TemplateFullpageModalCardTitleProps {
  title: ReactNode
  required?: boolean
  /** `title-wrap` 루트 */
  className?: string
  /** `paragraph-card__title` span — placeholder 톤 등 */
  titleClassName?: string
}

interface TemplateFullpageModalCardDescriptionProps {
  children: ReactNode
  className?: string
}

export function TemplateFullpageModal({
  open,
  onClose,
  title,
  description,
  templateTabType,
  onPreview,
  onSave,
  onDownloadDocument,
  downloadDocumentLoading = false,
  leftContent,
  rightNavigation,
  className,
  titleReadOnly = false,
  registrationUserMode = false,
  saveLabel,
  footerAction,
  footerActions,
  subHeader,
  bodyHeaderLeading,
  zIndex,
}: TemplateFullpageModalProps) {
  const resolvedFooterActions =
    footerActions ?? (footerAction != null ? [footerAction] : undefined)
  const rootClassName = [
    'full-page-modal',
    registrationUserMode ? 'full-page-modal--registration-user-mode' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const iconMaskId = `full-page-modal-title-mask-${useId().replace(/:/g, '')}`
  const editableTitle = typeof title === 'string' ? title : null
  const [titleValue, setTitleValue] = useState(editableTitle ?? '')
  const [titleEditing, setTitleEditing] = useState(false)
  const resolvedTitleReadOnly = titleReadOnly || registrationUserMode
  const resolvedSaveLabel = saveLabel ?? (registrationUserMode ? '임시저장' : '저장')

  useEffect(() => {
    setTitleValue(editableTitle ?? '')
  }, [editableTitle])

  const headerActions =
    templateTabType === 'writing' ? (
      <>
        <CmsButton variant="secondary" onClick={onClose}>
          닫기
        </CmsButton>
        <CmsButton variant="secondary" onClick={onPreview}>
          미리보기
        </CmsButton>
        <CmsButton onClick={() => onSave?.()}>{resolvedSaveLabel}</CmsButton>
      </>
    ) : (
      <>
        <CmsButton
          variant="secondary"
          icon={<DownloadOutlined />}
          onClick={onDownloadDocument}
          className="full-page-modal__download-btn"
          disabled={downloadDocumentLoading}
          aria-busy={downloadDocumentLoading}
        >
          문서 다운로드
        </CmsButton>
        <CmsButton variant="secondary" onClick={onPreview}>
          미리보기
        </CmsButton>
        <CmsButton onClick={() => onSave?.()}>{resolvedSaveLabel}</CmsButton>
      </>
    )

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className={rootClassName}
      zIndex={zIndex}
    >
      <div className="full-page-modal__layout">
        <header className="full-page-modal__topbar">
          <div className="full-page-modal__title">
            {editableTitle != null ? (
              <CmsInputIconClick
                value={titleValue}
                editing={titleEditing}
                onChange={setTitleValue}
                onRequestEdit={() => setTitleEditing(true)}
                onCommitEdit={() => setTitleEditing(false)}
                restoreValueIfEmptyOnBlur={editableTitle}
                readOnly={resolvedTitleReadOnly}
                containerClassName="full-page-modal__title-edit-row"
                inputClassName="full-page-modal__title-input full-page-modal__title-input--editing"
                textClassName="full-page-modal__title-text"
                editButtonClassName="full-page-modal__title-edit-btn"
              />
            ) : (
              <>
                <span className="full-page-modal__title-text">{title}</span>
                <svg
                  className="full-page-modal__title-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  aria-hidden="true"
                >
                  <g opacity="0.4">
                    <mask
                      id={iconMaskId}
                      style={{ maskType: 'alpha' }}
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="28"
                      height="28"
                    >
                      <rect width="28" height="28" fill="#D9D9D9" />
                    </mask>
                    <g mask={`url(#${iconMaskId})`}>
                      <path
                        d="M4.08301 27.9997C3.60584 27.9997 3.19488 27.8292 2.85013 27.4881C2.50538 27.1471 2.33301 26.7343 2.33301 26.2497C2.33301 25.7725 2.50538 25.3616 2.85013 25.0168C3.19488 24.6721 3.60584 24.4997 4.08301 24.4997H23.9163C24.3935 24.4997 24.8045 24.6702 25.1492 25.0113C25.494 25.3523 25.6663 25.7651 25.6663 26.2497C25.6663 26.7269 25.494 27.1378 25.1492 27.4826C24.8045 27.8273 24.3935 27.9997 23.9163 27.9997H4.08301ZM6.99967 19.1488H8.44226L18.1256 9.48324L17.3921 8.73861L16.6652 8.02286L6.99967 17.7062V19.1488ZM5.24967 19.8441V17.4011C5.24967 17.2605 5.2732 17.1267 5.32026 16.9995C5.36751 16.8723 5.44567 16.7541 5.55476 16.6448L18.3277 3.90132C18.4967 3.73235 18.6885 3.6045 18.9032 3.51778C19.1176 3.43106 19.3393 3.3877 19.5682 3.3877C19.8046 3.3877 20.0294 3.43106 20.2425 3.51778C20.4556 3.6045 20.6527 3.73838 20.8337 3.9194L22.2358 5.33953C22.4168 5.5085 22.5476 5.70139 22.6283 5.9182C22.7092 6.1352 22.7497 6.36182 22.7497 6.59807C22.7497 6.81507 22.7092 7.03081 22.6283 7.24528C22.5476 7.45995 22.4168 7.65779 22.2358 7.83882L9.49226 20.5823C9.38298 20.6916 9.26486 20.7716 9.13788 20.8224C9.01072 20.8733 8.87684 20.8988 8.73626 20.8988H6.30434C6.00354 20.8988 5.75261 20.7982 5.55155 20.5969C5.3503 20.3958 5.24967 20.1449 5.24967 19.8441ZM18.1256 9.48324L17.3921 8.73861L16.6652 8.02286L18.1256 9.48324Z"
                        fill="#3D3D3D"
                      />
                    </g>
                  </g>
                </svg>
              </>
            )}
          </div>
          {!registrationUserMode ? (
            <button
              type="button"
              className="full-page-modal__close"
              onClick={onClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          ) : null}
        </header>

        {subHeader ? <div className="full-page-modal__sub-header">{subHeader}</div> : null}

        <div className="full-page-modal__body">
          <div className="full-page-modal__body-header">
            {bodyHeaderLeading != null ? (
              <div className="full-page-modal__body-header-leading">{bodyHeaderLeading}</div>
            ) : description && !registrationUserMode ? (
              <p className="full-page-modal__description">{description}</p>
            ) : (
              <span />
            )}
            <div className="full-page-modal__actions">{headerActions}</div>
          </div>

          <div className="full-page-modal__contents">
            <div className="full-page-modal__left">{leftContent}</div>
            <aside className="full-page-modal__right-wrap">
              <div className="full-page-modal__right">{rightNavigation}</div>
            </aside>
          </div>
          {resolvedFooterActions != null && resolvedFooterActions.length > 0 ? (
            <div
              className={[
                'full-page-modal__footer-cta',
                resolvedFooterActions.length > 1 ? 'full-page-modal__footer-cta--multi' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {resolvedFooterActions.map(action => (
                <CmsButton
                  key={action.label}
                  type="button"
                  size="large"
                  width={180}
                  variant={action.variant === 'secondary' ? 'secondary' : undefined}
                  className="full-page-modal__footer-cta-btn"
                  onClick={action.onClick}
                >
                  {action.variant === 'secondary' ? <LeftOutlined aria-hidden /> : null}
                  <span>{action.label}</span>
                  {action.variant !== 'secondary' && action.showArrow === true ? (
                    <RightOutlined aria-hidden />
                  ) : null}
                </CmsButton>
              ))}
            </div>
          ) : null}
          <div className="full-page-modal__body-bottom" aria-hidden="true" />
        </div>
      </div>
    </TealHeaderModal>
  )
}

export function TemplateFullpageModalCardTitle({
  title,
  required = false,
  className,
  titleClassName,
}: TemplateFullpageModalCardTitleProps) {
  return (
    <div className={['paragraph-card__title-wrap', className].filter(Boolean).join(' ')}>
      {required ? <span className="paragraph-card__required">*</span> : null}
      <span className={['paragraph-card__title', titleClassName].filter(Boolean).join(' ')}>
        {title}
      </span>
    </div>
  )
}

export function TemplateFullpageModalCardDescription({
  children,
  className,
}: TemplateFullpageModalCardDescriptionProps) {
  return (
    <FormParagraphSectionDescription
      surface="templateAuthoring"
      className={['paragraph-card__description', className].filter(Boolean).join(' ')}
    >
      {children}
    </FormParagraphSectionDescription>
  )
}

export {
  ParagraphCard,
  type ParagraphCardEditableHeading,
  type ParagraphCardProps,
} from '@/features/template/ui/paragraph/shared/paragraph-card'
