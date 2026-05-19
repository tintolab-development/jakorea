import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsInput } from '@/shared/ui/cms-input'
import { ContentModal } from '@/shared/ui/content-modal'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import './permission-reject-modal.css'

/** 직접 설정 최초값 — 호출 시점의 현재 날짜·시간(초 이하 절삭) */
function nowManualNotifyAt(): Dayjs {
  return dayjs().second(0).millisecond(0)
}

/** 풀페이지 상세 위 중첩 모달(antd 스택 ~2000)보다 위 */
const DEFAULT_PERMISSION_REJECT_MODAL_Z = 2500
const DATE_TIME_PICKER_Z_OFFSET = 100

const MESSAGE_BOLD_PATTERN = /(\*\*[^*]+\*\*)/g

function parsePermissionRejectMessageLine(line: string): ReactNode[] {
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
export function PermissionRejectModalMessage({ text }: { text: string }) {
  const lines = text.split('\n').filter(line => line.length > 0)

  if (lines.length === 0) {
    return null
  }

  return (
    <p className="permission-reject-modal__message">
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {parsePermissionRejectMessageLine(line)}
        </Fragment>
      ))}
    </p>
  )
}

export type PermissionRejectNotifyTiming = 'immediate' | 'on_announcement' | 'manual'

export interface PermissionRejectPayload {
  rejectionReason: string
  notifyTiming: PermissionRejectNotifyTiming
  /** `notifyTiming === 'manual'` 일 때 확정된 일시 */
  manualNotifyAt?: Dayjs | null
}

export type PermissionRejectModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: PermissionRejectPayload) => void
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
}

export function PermissionRejectModal({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  children,
  zIndex,
  confirmLabel = '반려',
  confirmVariant = 'delete',
  width = 600,
  requireReason = true,
  reasonLabel = '반려 사유',
  reasonPlaceholder = '반려 사유를 입력해 주세요.',
  reasonRequiredMessage = '반려 사유를 입력해 주세요.',
  showNotifyTiming = true,
  notifyTimingOptions = 'three',
}: PermissionRejectModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [notifyTiming, setNotifyTiming] = useState<PermissionRejectNotifyTiming>('immediate')
  const [manualNotifyAt, setManualNotifyAt] = useState<Dayjs | null>(null)
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setRejectionReason('')
    setReasonError('')
    setNotifyTiming('immediate')
    setManualNotifyAt(null)
    setDateTimePickerOpen(false)
  }, [open])

  const hasRejectionReason = rejectionReason.trim().length > 0
  const canConfirm = requireReason ? hasRejectionReason : true

  const handleConfirm = () => {
    const reason = rejectionReason.trim()
    if (requireReason && !reason) {
      setReasonError(reasonRequiredMessage)
      return
    }
    setReasonError('')
    onConfirm({
      rejectionReason: reason,
      notifyTiming,
      manualNotifyAt: notifyTiming === 'manual' ? manualNotifyAt : null,
    })
  }

  const handleNotifyTimingChange = (next: PermissionRejectNotifyTiming) => {
    setNotifyTiming(next)
    if (next === 'manual') {
      setManualNotifyAt(nowManualNotifyAt())
      setDateTimePickerOpen(true)
    } else {
      setDateTimePickerOpen(false)
    }
  }

  const resolvedModalZ = zIndex ?? DEFAULT_PERMISSION_REJECT_MODAL_Z
  const dateTimePickerZ = resolvedModalZ + DATE_TIME_PICKER_Z_OFFSET

  return (
    <>
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={width}
      className="permission-reject-modal"
      zIndex={resolvedModalZ}
      footer={
        <div className="permission-reject-modal__footer">
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant={confirmVariant}
            size="medium"
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </CmsButton>
        </div>
      }
    >
      <div ref={modalContentRef} className="permission-reject-modal__content">
        {message ? <PermissionRejectModalMessage text={message} /> : children}

        {requireReason ? (
          <div className="permission-reject-modal__field">
            <span className="permission-reject-modal__label">{reasonLabel}</span>
            <CmsInput
              inputSize="large"
              width="100%"
              value={rejectionReason}
              onChange={e => {
                setRejectionReason(e.target.value)
                if (reasonError) setReasonError('')
              }}
              placeholder={reasonPlaceholder}
              maxLength={500}
            />
            {reasonError ? (
              <span className="permission-reject-modal__field-error" role="alert">
                {reasonError}
              </span>
            ) : null}
          </div>
        ) : null}

        {showNotifyTiming ? (
          <div className="permission-reject-modal__field">
            <span className="permission-reject-modal__label">알림 발송</span>
            <CmsRadio.Group
              style={{ marginTop: 12, paddingLeft: 8 }}
              size="large"
              value={notifyTiming}
              onChange={e =>
                handleNotifyTimingChange(e.target.value as PermissionRejectNotifyTiming)
              }
            >
              <CmsRadio value="immediate">즉시</CmsRadio>
              {notifyTimingOptions === 'three' ? (
                <CmsRadio value="on_announcement">발표일에 맞춰서</CmsRadio>
              ) : null}
              <span ref={manualRadioAnchorRef} className="permission-reject-modal__manual-anchor">
                <CmsRadio
                  value="manual"
                  onClick={() => {
                    if (notifyTiming === 'manual') {
                      setManualNotifyAt(prev => prev ?? nowManualNotifyAt())
                      setDateTimePickerOpen(true)
                    }
                  }}
                >
                  직접 설정
                  {notifyTiming === 'manual' && manualNotifyAt != null ? (
                    <span className="permission-reject-modal__manual-summary">
                      {' '}
                      ({manualNotifyAt.format('YYYY. MM. DD HH:mm')})
                    </span>
                  ) : null}
                </CmsRadio>
              </span>
            </CmsRadio.Group>
          </div>
        ) : null}
      </div>
    </ContentModal>

    {showNotifyTiming && notifyTimingOptions === 'three' ? (
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
        }}
        zIndex={dateTimePickerZ}
      />
    ) : null}
    </>
  )
}
