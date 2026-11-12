import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsInput } from '@/shared/ui/cms-input'
import { ContentModal } from '@/shared/ui/content-modal'
import { parseContentModalDescriptionLine } from '@/shared/ui/content-modal-description'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import {
  getDefaultManualNotifyAt,
  getMinimumManualNotifyAt,
  isFutureNotificationTime,
} from '@/shared/lib/notification-schedule'
import {
  NOTIFY_TIMING_CAPABILITY,
  UNSUPPORTED_NOTIFY_TIMING_ALERT_TITLE,
  getUnsupportedNotifyTimingMessage,
  type NotifyTimingCapability,
} from '@/shared/lib/notify-timing-capability'
import { formatYmdHmWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
import { useNotifyAnnouncementDisabled } from '@/shared/components/notify-announcement-context'
import {
  INSTRUCTOR_JA_FAULT_PARTY_HINT,
  INSTRUCTOR_JA_FAULT_PARTY_REQUIRED_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import './permission-modal.css'

/** 직접 설정 최초값 — 호출 시점의 현재 날짜·시간(초 이하 절삭) */
/** 풀페이지 상세 위 중첩 모달(antd 스택 ~2000)보다 위 */
const DEFAULT_PERMISSION_MODAL_Z = 2500
const DATE_TIME_PICKER_Z_OFFSET = 100

function PermissionModalFieldLabel({
  children,
  required,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <span className="permission-modal__label">
      {children}
      {required ? (
        <span className="permission-modal__required" aria-hidden="true">
          *
        </span>
      ) : null}
    </span>
  )
}

function parsePermissionModalMessageLine(line: string): ReactNode[] {
  return parseContentModalDescriptionLine(line)
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
  /** 강사 취소 귀책. `faultPartyRequired`일 때 USER | ADMIN */
  faultParty?: 'USER' | 'ADMIN'
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
  /** API 요청 중 확인 버튼 중복 클릭 방지 */
  confirmLoading?: boolean
  /** 상위 모달의 도메인 필수 조건이 충족되기 전 확인 버튼 비활성화 */
  confirmDisabled?: boolean
  /**
   * true면 사유 미입력이어도 확인 버튼을 활성으로 두고, 클릭 시 필수 항목 미입력 안내를 띄운다.
   * 기본 false — 기존 화면은 사유 입력 전 비활성 유지.
   */
  confirmEnabledWithoutReason?: boolean
  width?: number
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  reasonRequiredMessage?: string
  /** 사유 입력 maxLength. 기본 500. 강사 승인 취소 API는 1000 */
  reasonMaxLength?: number
  /** 사유 최소 글자 수(trim 기준). 미지정이면 검사하지 않는다. 신청 반려 API는 2자 이상 */
  reasonMinLength?: number
  /** reasonMinLength 미달 시 안내 문구 */
  reasonMinLengthMessage?: string
  showNotifyTiming?: boolean
  /** 기본 three — 즉시 / 발표일에 맞춰서 / 직접 설정 */
  notifyTimingOptions?: 'two' | 'three'
  /**
   * 연결된 API가 실제로 받는 시점.
   * 미지원 옵션은 라디오를 유지하되 확인을 막고 안내한다. 기본값은 세 옵션 모두 지원.
   */
  notifyTimingCapability?: NotifyTimingCapability
  /** 본문 메시지와 알림 발송 사이 안내 박스 (일괄 승인 등) */
  infoCallout?: ReactNode
  /** `permission-modal`에 추가로 붙는 클래스 (모달별 스타일 오버라이드) */
  className?: string
  /** true면 알림 발송 필드를 사유 입력 위에 표시 (기본: 사유 → 알림) */
  notifyBeforeReason?: boolean
  /** 강사 배정/승인 취소 — 취소 귀책 필수 선택 (기본값 없음) */
  faultPartyRequired?: boolean
  /**
   * 이 알림이 따르는 모집의 최종 발표일(ISO). 지났거나 null(미설정)이면 「발표일에 맞춰서」를 비활성한다.
   * 생략하면 `NotifyAnnouncementProvider` 값, Provider도 없으면 항상 선택 가능(기존 동작).
   */
  announcementAt?: string | null
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
    reasonPlaceholder: '반려 사유를 입력해 주세요',
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
  confirmLoading = false,
  confirmDisabled = false,
  confirmEnabledWithoutReason = false,
  width = 600,
  requireReason: requireReasonProp,
  reasonLabel: reasonLabelProp,
  reasonPlaceholder: reasonPlaceholderProp,
  reasonRequiredMessage: _reasonRequiredMessageProp,
  reasonMaxLength = 500,
  reasonMinLength,
  reasonMinLengthMessage,
  showNotifyTiming = true,
  notifyTimingOptions = 'three',
  notifyTimingCapability = NOTIFY_TIMING_CAPABILITY.full,
  infoCallout,
  className: classNameProp,
  notifyBeforeReason = false,
  faultPartyRequired = false,
  announcementAt,
}: PermissionModalProps) {
  const { showAlert } = useCmsAlert()
  const defaults = resolveVariantDefaults(variant)
  const confirmLabel = confirmLabelProp ?? defaults.confirmLabel
  const confirmVariant = confirmVariantProp ?? defaults.confirmVariant
  const requireReason = requireReasonProp ?? defaults.requireReason
  const reasonLabel = reasonLabelProp ?? defaults.reasonLabel
  const reasonPlaceholder = reasonPlaceholderProp ?? defaults.reasonPlaceholder

  const [reason, setReason] = useState('')
  const [faultParty, setFaultParty] = useState<'USER' | 'ADMIN' | undefined>(undefined)
  const [notifyTiming, setNotifyTiming] = useState<PermissionModalNotifyTiming>('immediate')
  const [manualNotifyAt, setManualNotifyAt] = useState<Dayjs | null>(null)
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setReason('')
    setFaultParty(undefined)
    setNotifyTiming('immediate')
    setManualNotifyAt(null)
    setDateTimePickerOpen(false)
  }, [open])

  /** 발표일 경과·미설정 — 「발표일에 맞춰서」 비활성. 이미 골라 둔 상태면 즉시로 되돌린다 */
  const announcementDisabled = useNotifyAnnouncementDisabled(announcementAt)
  useEffect(() => {
    if (!open || !announcementDisabled) return
    setNotifyTiming(prev => (prev === 'on_announcement' ? 'immediate' : prev))
  }, [open, announcementDisabled])

  const showIncompleteRequiredAlert = () => {
    showAlert({
      title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
      content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
    })
  }

  const handleConfirm = () => {
    const trimmed = reason.trim()
    if (requireReason && !trimmed) {
      showIncompleteRequiredAlert()
      return
    }
    if (requireReason && reasonMinLength != null && trimmed.length < reasonMinLength) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content:
          reasonMinLengthMessage ?? `${reasonLabel}을(를) ${reasonMinLength}자 이상 입력해 주세요.`,
      })
      return
    }
    if (faultPartyRequired && faultParty !== 'USER' && faultParty !== 'ADMIN') {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: INSTRUCTOR_JA_FAULT_PARTY_REQUIRED_MESSAGE,
      })
      return
    }
    if (showNotifyTiming && notifyTiming === 'manual' && !manualNotifyAt) {
      showIncompleteRequiredAlert()
      return
    }
    if (
      showNotifyTiming &&
      notifyTiming === 'manual' &&
      !isFutureNotificationTime(manualNotifyAt)
    ) {
      showAlert({
        title: '알림 발송 일시 확인',
        content: '현재 시각보다 최소 1분 이후의 시간을 선택해 주세요.',
      })
      return
    }
    const unsupportedNotify = showNotifyTiming
      ? getUnsupportedNotifyTimingMessage(notifyTiming, notifyTimingCapability)
      : null
    if (unsupportedNotify) {
      showAlert({
        title: UNSUPPORTED_NOTIFY_TIMING_ALERT_TITLE,
        content: unsupportedNotify,
      })
      return
    }
    onConfirm({
      reason: trimmed,
      notifyTiming,
      manualNotifyAt: notifyTiming === 'manual' ? manualNotifyAt : null,
      ...(faultPartyRequired && faultParty ? { faultParty } : {}),
    })
  }

  const handleNotifyTimingChange = (next: PermissionModalNotifyTiming) => {
    setNotifyTiming(next)
    if (next === 'manual') {
      setManualNotifyAt(getDefaultManualNotifyAt())
      setDateTimePickerOpen(true)
    } else {
      setDateTimePickerOpen(false)
    }
  }

  const resolvedModalZ = zIndex ?? DEFAULT_PERMISSION_MODAL_Z
  const dateTimePickerZ = resolvedModalZ + DATE_TIME_PICKER_Z_OFFSET
  const unsupportedNotifyMessage = showNotifyTiming
    ? getUnsupportedNotifyTimingMessage(notifyTiming, notifyTimingCapability)
    : null
  const notifyScheduleNotReady =
    showNotifyTiming &&
    notifyTiming === 'manual' &&
    (manualNotifyAt == null || !isFutureNotificationTime(manualNotifyAt))

  const notifyTimingField = (
    <div className="permission-modal__field">
      <PermissionModalFieldLabel required>알림 발송</PermissionModalFieldLabel>
      <CmsRadio.Group
        size="medium"
        value={notifyTiming}
        onChange={e => handleNotifyTimingChange(e.target.value as PermissionModalNotifyTiming)}
      >
        <CmsRadio value="immediate" size="medium">
          즉시
        </CmsRadio>
        {notifyTimingOptions === 'three' ? (
          <CmsRadio value="on_announcement" size="medium" disabled={announcementDisabled}>
            발표일에 맞춰서
          </CmsRadio>
        ) : null}
        <span ref={manualRadioAnchorRef} className="permission-modal__manual-anchor">
          <CmsRadio
            value="manual"
            size="medium"
            onClick={() => {
              if (notifyTiming === 'manual') {
                setManualNotifyAt(prev => prev ?? getDefaultManualNotifyAt())
                setDateTimePickerOpen(true)
              }
            }}
          >
            직접 설정
            {notifyTiming === 'manual' && manualNotifyAt != null ? (
              <span className="permission-modal__manual-summary">
                {' '}
                ({formatYmdHmWithKoreanWeekday(manualNotifyAt)})
              </span>
            ) : null}
          </CmsRadio>
        </span>
      </CmsRadio.Group>
      {unsupportedNotifyMessage ? (
        <p className="permission-modal__field-error" role="alert">
          {unsupportedNotifyMessage}
        </p>
      ) : null}
    </div>
  )

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
            <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton
              variant={confirmVariant}
              size="medium"
              type="button"
              loading={confirmLoading}
              disabled={
                confirmLoading ||
                confirmDisabled ||
                (requireReason && !confirmEnabledWithoutReason && !reason.trim()) ||
                Boolean(unsupportedNotifyMessage) ||
                notifyScheduleNotReady
              }
              onClick={handleConfirm} >
              {confirmLabel}
            </CmsButton>
          </div>
        }
      >
        <div ref={modalContentRef} className="permission-modal__content">
          {message ? <PermissionModalMessage text={message} /> : children}

          {infoCallout ? <div className="permission-modal__info-callout">{infoCallout}</div> : null}

          {faultPartyRequired ? (
            <div className="permission-modal__field">
              <PermissionModalFieldLabel required>취소 귀책</PermissionModalFieldLabel>
              <CmsRadio.Group
                size="medium"
                value={faultParty}
                onChange={e => {
                  const next = e.target.value
                  if (next === 'USER' || next === 'ADMIN') setFaultParty(next)
                }}
              >
                <CmsRadio value="USER" size="medium">
                  강사 사유
                </CmsRadio>
                <CmsRadio value="ADMIN" size="medium">
                  운영 사유
                </CmsRadio>
              </CmsRadio.Group>
              <p className="permission-modal__hint">{INSTRUCTOR_JA_FAULT_PARTY_HINT}</p>
            </div>
          ) : null}

          {notifyBeforeReason && showNotifyTiming ? notifyTimingField : null}

          {requireReason ? (
            <div className="permission-modal__field">
              <PermissionModalFieldLabel required>{reasonLabel}</PermissionModalFieldLabel>
              <CmsInput
                inputSize="large"
                width="100%"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                maxLength={reasonMaxLength}
              />
            </div>
          ) : null}

          {!notifyBeforeReason && showNotifyTiming ? notifyTimingField : null}
        </div>
      </ContentModal>

      {showNotifyTiming ? (
        <DateTimePickerPopover
          open={open && notifyTiming === 'manual' && dateTimePickerOpen}
          onClose={() => setDateTimePickerOpen(false)}
          anchorRef={manualRadioAnchorRef}
          dismissExcludeRef={modalContentRef}
          value={manualNotifyAt ?? getDefaultManualNotifyAt()}
          onChange={setManualNotifyAt}
          onApply={value => {
            setManualNotifyAt(value)
            setDateTimePickerOpen(false)
          }}
          minDateTime={getMinimumManualNotifyAt()}
          zIndex={dateTimePickerZ}
        />
      ) : null}
    </>
  )
}
