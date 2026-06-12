import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsInput } from '@/shared/ui/cms-input'
import { ContentModal } from '@/shared/ui/content-modal'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import './permission-modal.css'

/** 직접 설정 최초값 — 호출 시점의 현재 날짜·시간(초 이하 절삭) */
function nowManualNotifyAt(): Dayjs {
  return dayjs().second(0).millisecond(0)
}

/** 풀페이지 상세 위 중첩 모달(antd 스택 ~2000)보다 위 */
const DEFAULT_PERMISSION_MODAL_Z = 2500
const DATE_TIME_PICKER_Z_OFFSET = 100

const MESSAGE_BOLD_PATTERN = /(\*\*[^*]+\*\*)/g

function parsePermissionModalMessageLine(line: string): ReactNode[] {
  return line
    .split(MESSAGE_BOLD_PATTERN)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return <Fragment key={index}>{part}</Fragment>
    })
}

/** `\n`으로 줄바꿈. `**텍스트**`는 굵게 표시 */
export function PermissionModalMessage({ text }: { text: string }) {
  const lines = text.split('\n').filter(line => line.length > 0)

  if (lines.length === 0) {
    return null
  }

  return (
    <p className="permission-modal__message">
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {parsePermissionModalMessageLine(line)}
        </Fragment>
      ))}
    </p>
  )
}

export type PermissionModalNotifyTiming = 'immediate' | 'on_announcement' | 'manual'

export interface PermissionModalPayload {
  /** 반려·취소 등 사유. 승인(`variant="approve"`) 시 빈 문자열 */
  reason: string
  notifyTiming: PermissionModalNotifyTiming
  /** `notifyTiming === 'manual'` 일 때 확정된 일시 */
  manualNotifyAt?: Dayjs | null
}

export type PermissionModalVariant = 'reject' | 'approve'

export type PermissionModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  /** reject: 사유 필수·반려 버튼 / approve: 사유 없음·승인 버튼 (props로 개별 override 가능) */
  variant?: PermissionModalVariant
  title: string
  /** `\n` 개행. `message`가 있으면 `children` 대신 사용 */
  message?: string
  children?: ReactNode
  zIndex?: number
  confirmLabel?: string
  confirmVariant?: 'delete' | 'primary'
  width?: number
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  reasonRequiredMessage?: string
  showNotifyTiming?: boolean
  /** 기본 three — 즉시 / 발표일에 맞춰서 / 직접 설정 */
  notifyTimingOptions?: 'two' | 'three'
  /** 본문 메시지와 알림 발송 사이 안내 박스 (일괄 승인 등) */
  infoCallout?: ReactNode
  /** `permission-modal`에 추가로 붙는 클래스 (모달별 스타일 오버라이드) */
  className?: string
  /** true면 알림 발송 필드를 사유 입력 위에 표시 (기본: 사유 → 알림) */
  notifyBeforeReason?: boolean
}

function resolveVariantDefaults(variant: PermissionModalVariant): {
  requireReason: boolean
  confirmLabel: string
  confirmVariant: 'delete' | 'primary'
  reasonLabel: string
  reasonPlaceholder: string
  reasonRequiredMessage: string
} {
  if (variant === 'approve') {
    return {
      requireReason: false,
      confirmLabel: '승인',
      confirmVariant: 'primary',
      reasonLabel: '사유',
      reasonPlaceholder: '',
      reasonRequiredMessage: '',
    }
  }
  return {
    requireReason: true,
    confirmLabel: '반려',
    confirmVariant: 'delete',
    reasonLabel: '반려 사유',
    reasonPlaceholder: '반려 사유를 입력해 주세요.',
    reasonRequiredMessage: '반려 사유를 입력해 주세요.',
  }
}

export function PermissionModal({
  open,
  onCancel,
  onConfirm,
  variant = 'reject',
  title,
  message,
  children,
  zIndex,
  confirmLabel: confirmLabelProp,
  confirmVariant: confirmVariantProp,
  width = 600,
  requireReason: requireReasonProp,
  reasonLabel: reasonLabelProp,
  reasonPlaceholder: reasonPlaceholderProp,
  reasonRequiredMessage: reasonRequiredMessageProp,
  showNotifyTiming = true,
  notifyTimingOptions = 'three',
  infoCallout,
  className: classNameProp,
  notifyBeforeReason = false,
}: PermissionModalProps) {
  const defaults = resolveVariantDefaults(variant)
  const confirmLabel = confirmLabelProp ?? defaults.confirmLabel
  const confirmVariant = confirmVariantProp ?? defaults.confirmVariant
  const requireReason = requireReasonProp ?? defaults.requireReason
  const reasonLabel = reasonLabelProp ?? defaults.reasonLabel
  const reasonPlaceholder = reasonPlaceholderProp ?? defaults.reasonPlaceholder
  const reasonRequiredMessage = reasonRequiredMessageProp ?? defaults.reasonRequiredMessage

  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [notifyTiming, setNotifyTiming] = useState<PermissionModalNotifyTiming>('immediate')
  const [manualNotifyAt, setManualNotifyAt] = useState<Dayjs | null>(null)
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)
  const [notifyError, setNotifyError] = useState('')
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setReason('')
    setReasonError('')
    setNotifyTiming('immediate')
    setManualNotifyAt(null)
    setDateTimePickerOpen(false)
    setNotifyError('')
  }, [open])

  const hasReason = reason.trim().length > 0
  const canConfirm = requireReason ? hasReason : true

  const handleConfirm = () => {
    const trimmed = reason.trim()
    if (requireReason && !trimmed) {
      setReasonError(reasonRequiredMessage)
      return
    }
    if (showNotifyTiming && notifyTiming === 'manual' && !manualNotifyAt) {
      setNotifyError('알림 발송 일시를 설정해 주세요.')
      return
    }
    setReasonError('')
    setNotifyError('')
    onConfirm({
      reason: trimmed,
      notifyTiming,
      manualNotifyAt: notifyTiming === 'manual' ? manualNotifyAt : null,
    })
  }

  const handleNotifyTimingChange = (next: PermissionModalNotifyTiming) => {
    setNotifyTiming(next)
    setNotifyError('')
    if (next === 'manual') {
      setManualNotifyAt(nowManualNotifyAt())
      setDateTimePickerOpen(true)
    } else {
      setDateTimePickerOpen(false)
    }
  }

  const resolvedModalZ = zIndex ?? DEFAULT_PERMISSION_MODAL_Z
  const dateTimePickerZ = resolvedModalZ + DATE_TIME_PICKER_Z_OFFSET

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={title}
        width={width}
        className={['permission-modal', classNameProp].filter(Boolean).join(' ')}
        zIndex={resolvedModalZ}
        footer={
          <div className="permission-modal__footer">
            <CmsButton
              variant="secondary"
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              type="button"
              onClick={onCancel}
            >
              취소
            </CmsButton>
            <CmsButton
              variant={confirmVariant}
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </CmsButton>
          </div>
        }
      >
        <div ref={modalContentRef} className="permission-modal__content">
          {message ? <PermissionModalMessage text={message} /> : children}

          {infoCallout ? <div className="permission-modal__info-callout">{infoCallout}</div> : null}

          {notifyBeforeReason && showNotifyTiming ? (
            <div className="permission-modal__field">
              <span className="permission-modal__label">알림 발송</span>
              <CmsRadio.Group
                size="large"
                value={notifyTiming}
                onChange={e =>
                  handleNotifyTimingChange(e.target.value as PermissionModalNotifyTiming)
                }
              >
                <CmsRadio value="immediate" size="large">
                  즉시
                </CmsRadio>
                {notifyTimingOptions === 'three' ? (
                  <CmsRadio value="on_announcement" size="large">
                    발표일에 맞춰서
                  </CmsRadio>
                ) : null}
                <span ref={manualRadioAnchorRef} className="permission-modal__manual-anchor">
                  <CmsRadio
                    value="manual"
                    size="large"
                    onClick={() => {
                      if (notifyTiming === 'manual') {
                        setManualNotifyAt(prev => prev ?? nowManualNotifyAt())
                        setDateTimePickerOpen(true)
                      }
                    }}
                  >
                    직접 설정
                    {notifyTiming === 'manual' && manualNotifyAt != null ? (
                      <span className="permission-modal__manual-summary">
                        {' '}
                        ({manualNotifyAt.format('YYYY. MM. DD HH:mm')})
                      </span>
                    ) : null}
                  </CmsRadio>
                </span>
              </CmsRadio.Group>
              {notifyError ? (
                <span className="permission-modal__field-error" role="alert">
                  {notifyError}
                </span>
              ) : null}
            </div>
          ) : null}

          {requireReason ? (
            <div className="permission-modal__field">
              <span className="permission-modal__label">{reasonLabel}</span>
              <CmsInput
                inputSize="large"
                width="100%"
                value={reason}
                onChange={e => {
                  setReason(e.target.value)
                  if (reasonError) setReasonError('')
                }}
                placeholder={reasonPlaceholder}
                maxLength={500}
              />
              {reasonError ? (
                <span className="permission-modal__field-error" role="alert">
                  {reasonError}
                </span>
              ) : null}
            </div>
          ) : null}

          {!notifyBeforeReason && showNotifyTiming ? (
            <div className="permission-modal__field">
              <span className="permission-modal__label">알림 발송</span>
              <CmsRadio.Group
                size="large"
                value={notifyTiming}
                onChange={e =>
                  handleNotifyTimingChange(e.target.value as PermissionModalNotifyTiming)
                }
              >
                <CmsRadio value="immediate" size="large">
                  즉시
                </CmsRadio>
                {notifyTimingOptions === 'three' ? (
                  <CmsRadio value="on_announcement" size="large">
                    발표일에 맞춰서
                  </CmsRadio>
                ) : null}
                <span ref={manualRadioAnchorRef} className="permission-modal__manual-anchor">
                  <CmsRadio
                    value="manual"
                    size="large"
                    onClick={() => {
                      if (notifyTiming === 'manual') {
                        setManualNotifyAt(prev => prev ?? nowManualNotifyAt())
                        setDateTimePickerOpen(true)
                      }
                    }}
                  >
                    직접 설정
                    {notifyTiming === 'manual' && manualNotifyAt != null ? (
                      <span className="permission-modal__manual-summary">
                        {' '}
                        ({manualNotifyAt.format('YYYY. MM. DD HH:mm')})
                      </span>
                    ) : null}
                  </CmsRadio>
                </span>
              </CmsRadio.Group>
              {notifyError ? (
                <span className="permission-modal__field-error" role="alert">
                  {notifyError}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </ContentModal>

      {showNotifyTiming ? (
        <DateTimePickerPopover
          open={open && notifyTiming === 'manual' && dateTimePickerOpen}
          onClose={() => setDateTimePickerOpen(false)}
          anchorRef={manualRadioAnchorRef}
          dismissExcludeRef={modalContentRef}
          value={manualNotifyAt ?? nowManualNotifyAt()}
          onChange={setManualNotifyAt}
          onApply={value => {
            setManualNotifyAt(value)
            setDateTimePickerOpen(false)
            setNotifyError('')
          }}
          zIndex={dateTimePickerZ}
        />
      ) : null}
    </>
  )
}

/** @deprecated `PermissionModal` 사용 */
export const PermissionRejectModal = PermissionModal
/** @deprecated `PermissionModalMessage` 사용 */
export const PermissionRejectModalMessage = PermissionModalMessage
/** @deprecated `PermissionModalPayload` 사용 */
export type PermissionRejectPayload = PermissionModalPayload
/** @deprecated `PermissionModalNotifyTiming` 사용 */
export type PermissionRejectNotifyTiming = PermissionModalNotifyTiming
/** @deprecated `PermissionModalProps` 사용 */
export type PermissionRejectModalProps = PermissionModalProps
