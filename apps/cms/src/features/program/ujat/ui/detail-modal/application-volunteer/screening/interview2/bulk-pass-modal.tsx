import { useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import {
  UJAT_INTERVIEW2_BULK_PASS_TYPE_OPTIONS,
  type UjatInterview2BulkPassType,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import { useNotifyAnnouncementPassed } from '@/shared/components/notify-announcement-context'
import {
  getDefaultManualNotifyAt,
  getMinimumManualNotifyAt,
  isFutureNotificationTime,
} from '@/shared/lib/notification-schedule'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import './bulk-pass-modal.css'

const MODAL_Z_INDEX = 2500
const DATE_TIME_PICKER_Z_OFFSET = 100

export type UjatInterview2BulkPassNotifyTiming = 'immediate' | 'on_announcement' | 'manual'

export type UjatInterview2BulkPassConfirmPayload = {
  passType: UjatInterview2BulkPassType
  notifyTiming: UjatInterview2BulkPassNotifyTiming
  manualNotifyAt?: Dayjs
}

export type UjatVolunteerInterview2BulkPassModalProps = {
  open: boolean
  subjectName: string
  count: number
  onCancel: () => void
  onConfirm: (payload: UjatInterview2BulkPassConfirmPayload) => void
}

/** 시안 10014:39937 — `[이름] 님 외 N명` 카피 */
export function buildUjatVolunteerInterview2BulkPassCopy({
  subjectName,
  selectionCount,
}: {
  subjectName: string
  selectionCount: number
}): { title: string; description: string } {
  const name = subjectName.trim() || '회원'
  const rest = Math.max(0, selectionCount - 1)
  return {
    title: '면접 일괄 합격 안내',
    description: `**[${name}] 님 외 ${rest}명**의 면접 결과를 합격 처리하시겠습니까?\n합격 시 회원에게 합격 알림이 발송됩니다.`,
  }
}

function formatManualNotifySummary(value: Dayjs): string {
  return value.format('YYYY.MM.DD HH:mm')
}

export function UjatVolunteerInterview2BulkPassModal({
  open,
  subjectName,
  count,
  onCancel,
  onConfirm,
}: UjatVolunteerInterview2BulkPassModalProps) {
  const [passType, setPassType] = useState<UjatInterview2BulkPassType | null>(null)
  const [passTypeError, setPassTypeError] = useState('')
  const [notifyTiming, setNotifyTiming] = useState<UjatInterview2BulkPassNotifyTiming>('immediate')
  const [manualNotifyAt, setManualNotifyAt] = useState<Dayjs | null>(null)
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)
  const [notifyError, setNotifyError] = useState('')

  const modalContentRef = useRef<HTMLDivElement>(null)
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)

  const copy = buildUjatVolunteerInterview2BulkPassCopy({
    subjectName,
    selectionCount: count,
  })

  useEffect(() => {
    if (!open) return
    setPassType(null)
    setPassTypeError('')
    setNotifyTiming('immediate')
    setManualNotifyAt(null)
    setDateTimePickerOpen(false)
    setNotifyError('')
  }, [open])

  /** 봉사자 모집 발표일 경과 — 「발표일에 맞춰서」 비활성, 골라 둔 상태면 즉시로 되돌린다 */
  const announcementPassed = useNotifyAnnouncementPassed()
  useEffect(() => {
    if (!open || !announcementPassed) return
    setNotifyTiming(prev => (prev === 'on_announcement' ? 'immediate' : prev))
  }, [open, announcementPassed])

  const handleNotifyTimingChange = (next: UjatInterview2BulkPassNotifyTiming) => {
    setNotifyTiming(next)
    setNotifyError('')
    if (next === 'manual') {
      setManualNotifyAt(getDefaultManualNotifyAt())
      setDateTimePickerOpen(true)
    } else {
      setDateTimePickerOpen(false)
    }
  }

  const handleConfirm = () => {
    if (!passType) {
      setPassTypeError('합격 유형을 선택해 주세요.')
      return
    }
    if (notifyTiming === 'manual' && !manualNotifyAt) {
      setNotifyError('알림 발송 일시를 설정해 주세요.')
      return
    }
    if (notifyTiming === 'manual' && !isFutureNotificationTime(manualNotifyAt)) {
      setNotifyError('현재 시각보다 최소 1분 이후의 시간을 선택해 주세요.')
      return
    }
    setPassTypeError('')
    setNotifyError('')
    onConfirm({
      passType,
      notifyTiming,
      manualNotifyAt: notifyTiming === 'manual' ? (manualNotifyAt ?? undefined) : undefined,
    })
  }

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={copy.title}
        width={600}
        className="ujat-volunteer-interview2-bulk-pass-modal"
        zIndex={MODAL_Z_INDEX}
        description={copy.description}
        footer={
          <div className="ujat-volunteer-interview2-bulk-pass-modal__footer">
            <CmsButton variant="secondary" size="h40" type="button" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="h40" type="button" onClick={handleConfirm}>
              합격
            </CmsButton>
          </div>
        }
      >
        <div ref={modalContentRef} className="ujat-volunteer-interview2-bulk-pass-modal__content">
          <div className="ujat-volunteer-interview2-bulk-pass-modal__field">
            <span className="ujat-volunteer-interview2-bulk-pass-modal__label">
              합격 유형
              <span className="ujat-volunteer-interview2-bulk-pass-modal__required" aria-hidden="true">
                *
              </span>
            </span>
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder="합격 유형을 선택해 주세요"
              value={passType ?? undefined}
              options={[...UJAT_INTERVIEW2_BULK_PASS_TYPE_OPTIONS]}
              onChange={value => {
                setPassType(value as UjatInterview2BulkPassType)
                if (passTypeError) setPassTypeError('')
              }}
            />
            {passTypeError ? (
              <span className="ujat-volunteer-interview2-bulk-pass-modal__field-error" role="alert">
                {passTypeError}
              </span>
            ) : null}
          </div>

          <div className="ujat-volunteer-interview2-bulk-pass-modal__notify-field">
            <span className="ujat-volunteer-interview2-bulk-pass-modal__label">
              알림 발송
              <span className="ujat-volunteer-interview2-bulk-pass-modal__required" aria-hidden="true">
                *
              </span>
            </span>
            <CmsRadio.Group
              size="large"
              value={notifyTiming}
              onChange={e =>
                handleNotifyTimingChange(e.target.value as UjatInterview2BulkPassNotifyTiming)
              }
            >
              <CmsRadio value="immediate">즉시</CmsRadio>
              <CmsRadio value="on_announcement" disabled={announcementPassed}>
                발표일에 맞춰서
              </CmsRadio>
              <span ref={manualRadioAnchorRef} className="ujat-volunteer-interview2-bulk-pass-modal__manual-anchor">
                <CmsRadio
                  value="manual"
                  onClick={() => {
                    if (notifyTiming === 'manual') {
                      setManualNotifyAt(prev => prev ?? getDefaultManualNotifyAt())
                      setDateTimePickerOpen(true)
                    }
                  }}
                >
                  직접 설정
                  {notifyTiming === 'manual' && manualNotifyAt != null ? (
                    <span className="ujat-volunteer-interview2-bulk-pass-modal__manual-summary">
                      {' '}
                      ({formatManualNotifySummary(manualNotifyAt)})
                    </span>
                  ) : null}
                </CmsRadio>
              </span>
            </CmsRadio.Group>
            {notifyError ? (
              <span className="ujat-volunteer-interview2-bulk-pass-modal__field-error" role="alert">
                {notifyError}
              </span>
            ) : null}
          </div>
        </div>
      </ContentModal>

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
          setNotifyError('')
        }}
        minDateTime={getMinimumManualNotifyAt()}
        zIndex={MODAL_Z_INDEX + DATE_TIME_PICKER_Z_OFFSET}
      />
    </>
  )
}
