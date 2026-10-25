import { useEffect, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsDatePicker, CmsInput, CmsTextArea } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  getApiErrorCode,
  getApiErrorHttpStatus,
  readApiErrorAlertMessage,
} from '@/shared/lib/extract-api-error-message'
import { extendBusinessPeriod } from '@/features/program/shared/api/business-period-api'
import {
  BUSINESS_PERIOD_EXTEND_FORBIDDEN_MESSAGE,
  BUSINESS_PERIOD_EXTEND_INVALID_DATE_MESSAGE,
  BUSINESS_PERIOD_EXTEND_SHORTEN_NOT_ALLOWED_MESSAGE,
  BUSINESS_PERIOD_EXTEND_SUCCESS_ALERT,
  businessPeriodExtendConfirmCopy,
  getBusinessPeriodExtendMinDate,
  seoulCalendarDateKey,
} from '@/features/program/shared/lib/business-period-extend'
import './business-period-extend-modal.css'

const REASON_MAX_LENGTH = 500

export interface BusinessPeriodExtendModalProps {
  open: boolean
  programId: string
  currentEndDate: string | Date | null | undefined
  onCancel: () => void
  onSuccess: () => void | Promise<void>
}

export function BusinessPeriodExtendModal({
  open,
  programId,
  currentEndDate,
  onCancel,
  onSuccess,
}: BusinessPeriodExtendModalProps) {
  const { showAlert } = useCmsAlert()
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [nextEnd, setNextEnd] = useState<Dayjs | null>(null)
  const [reason, setReason] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)

  const minDate = getBusinessPeriodExtendMinDate(currentEndDate)
  const minDay = minDate ? dayjs(minDate) : null
  const selectedYmd = nextEnd ? nextEnd.format('YYYY-MM-DD') : null

  useEffect(() => {
    if (!open) return
    submittingRef.current = false
    setSubmitting(false)
    setNextEnd(minDate ? dayjs(minDate) : null)
    setReason('')
    setDateError(null)
  }, [open, minDate])

  const canSubmit = Boolean(selectedYmd && !submitting)

  const handleCancel = () => {
    if (submitting) return
    onCancel()
  }

  const handleSubmit = async () => {
    if (!selectedYmd || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setDateError(null)
    try {
      await extendBusinessPeriod(programId, {
        businessEndDate: selectedYmd,
        reason,
      })
      onCancel()
      showAlert({
        title: '안내',
        content: BUSINESS_PERIOD_EXTEND_SUCCESS_ALERT,
      })
      await onSuccess()
    } catch (error) {
      const status = getApiErrorHttpStatus(error)
      const code = getApiErrorCode(error)
      if (code === 'PROGRAM_BUSINESS_END_DATE_INVALID') {
        setDateError(BUSINESS_PERIOD_EXTEND_INVALID_DATE_MESSAGE)
      } else if (code === 'PROGRAM_BUSINESS_END_DATE_SHORTEN_NOT_ALLOWED') {
        setDateError(BUSINESS_PERIOD_EXTEND_SHORTEN_NOT_ALLOWED_MESSAGE)
      } else if (status === 403) {
        showAlert({
          title: '안내',
          content: BUSINESS_PERIOD_EXTEND_FORBIDDEN_MESSAGE,
        })
      } else {
        showAlert({
          title: '안내',
          content: readApiErrorAlertMessage(error, '사업 기간을 연장하지 못했습니다.'),
        })
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="사업 기간 연장"
      width={600}
      className="business-period-extend-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={handleCancel} disabled={submitting}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            loading={submitting}
            disabled={!canSubmit}
            onClick={() => {
              void handleSubmit()
            }}
          >
            연장
          </CmsButton>
        </>
      }
    >
      <div className="business-period-extend-modal__body">
        <p className="business-period-extend-modal__confirm">
          {selectedYmd ? businessPeriodExtendConfirmCopy(selectedYmd) : null}
        </p>
        <CmsInput
          label="현재 종료일"
          inputSize="large"
          width="100%"
          value={seoulCalendarDateKey(currentEndDate) ?? '-'}
          disabled
          readOnly
          allowClear={false}
        />
        <CmsDatePicker
          label="새 종료일"
          required
          inputSize="large"
          width="100%"
          value={nextEnd}
          allowClear={false}
          disabledDate={current => {
            if (!minDay || !current) return false
            return current.startOf('day').isBefore(minDay, 'day')
          }}
          disabled={submitting}
          error={Boolean(dateError)}
          message={dateError ?? undefined}
          onChange={value => {
            setDateError(null)
            setNextEnd(value)
          }}
        />
        <CmsTextArea
          label="사유"
          inputSize="large"
          width="100%"
          value={reason}
          maxLength={REASON_MAX_LENGTH}
          rows={4}
          disabled={submitting}
          onChange={event => setReason(event.target.value.slice(0, REASON_MAX_LENGTH))}
        />
      </div>
    </ContentModal>
  )
}
