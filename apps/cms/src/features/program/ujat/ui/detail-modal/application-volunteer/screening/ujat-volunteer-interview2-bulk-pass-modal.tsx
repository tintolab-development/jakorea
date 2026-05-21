import { useEffect, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  UJAT_INTERVIEW2_BULK_PASS_TYPE_OPTIONS,
  type UjatInterview2BulkPassType,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import './ujat-volunteer-interview2-bulk-pass-modal.css'

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
  count: number
  onCancel: () => void
  onConfirm: (payload: UjatInterview2BulkPassConfirmPayload) => void
}

function nowManualNotifyAt(): Dayjs {
  return dayjs().second(0).millisecond(0)
}

export function UjatVolunteerInterview2BulkPassModal({
  open,
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

  useEffect(() => {
    if (!open) return
    setPassType(null)
    setPassTypeError('')
    setNotifyTiming('immediate')
    setManualNotifyAt(null)
    setDateTimePickerOpen(false)
    setNotifyError('')
  }, [open])

  const handleNotifyTimingChange = (next: UjatInterview2BulkPassNotifyTiming) => {
    setNotifyTiming(next)
    setNotifyError('')
    if (next === 'manual') {
      setManualNotifyAt(nowManualNotifyAt())
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
    setPassTypeError('')
    setNotifyError('')
    onConfirm({
      passType,
      notifyTiming,
      manualNotifyAt: notifyTiming === 'manual' ? manualNotifyAt ?? undefined : undefined,
    })
  }

  const canConfirm = passType != null

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="봉사자 일괄 합격 안내"
        width={600}
        className="ujat-volunteer-interview2-bulk-pass-modal"
        zIndex={MODAL_Z_INDEX}
        description={
          <div className="ujat-volunteer-interview2-bulk-pass-modal__description">
            <div>
              선택한 <strong>{count}</strong>개의 모든 봉사자의 면접 심사를 일괄 합격
              처리하시겠습니까?
            </div>
            <div>합격 시 봉사자에게 개별로 승인 알림이 발송됩니다.</div>
          </div>
        }
        footer={
          <div className="ujat-volunteer-interview2-bulk-pass-modal__footer">
            <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              합격
            </CmsButton>
          </div>
        }
      >
        <div ref={modalContentRef} className="ujat-volunteer-interview2-bulk-pass-modal__content">
          <div className="ujat-volunteer-interview2-bulk-pass-modal__field">
            <span className="ujat-volunteer-interview2-bulk-pass-modal__label">합격 유형</span>
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder="합격 유형을 선택해 주세요."
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
            <span className="ujat-volunteer-interview2-bulk-pass-modal__label">알림 발송</span>
            <CmsRadio.Group
              size="large"
              value={notifyTiming}
              onChange={e =>
                handleNotifyTimingChange(e.target.value as UjatInterview2BulkPassNotifyTiming)
              }
            >
              <CmsRadio value="immediate">즉시</CmsRadio>
              <CmsRadio value="on_announcement">발표일에 맞춰서</CmsRadio>
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
                    <span className="ujat-volunteer-interview2-bulk-pass-modal__manual-summary">
                      {' '}
                      ({manualNotifyAt.format('YYYY. MM. DD HH:mm')})
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
        value={manualNotifyAt ?? nowManualNotifyAt()}
        onChange={setManualNotifyAt}
        onApply={value => {
          setManualNotifyAt(value)
          setDateTimePickerOpen(false)
          setNotifyError('')
        }}
        zIndex={MODAL_Z_INDEX + DATE_TIME_PICKER_Z_OFFSET}
      />
    </>
  )
}
