import { useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { ContentModal, CmsButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import type { DateValue } from '@/types'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import {
  applyChangedRangesToEducationScheduleLines,
  EDUCATION_SCHEDULE_CHANGE_MODAL_DESCRIPTION,
  EDUCATION_SCHEDULE_CHANGE_MODAL_TITLE,
  formatEducationScheduleLineForChangeModal,
  isOutsideEducationOperationRange,
  padEducationScheduleChangeLabel,
  parseEducationScheduleLineToChangeRange,
  toEducationOperationDayjs,
} from '@/features/program/shared/lib/education-schedule-change'
import './education-schedule-change-modal.css'

export function EducationScheduleChangeModal({
  open,
  scheduleLines,
  scheduleRowLabels,
  educationScheduleMode = 'date',
  operationStart,
  operationEnd,
  submitting = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  scheduleLines: readonly string[]
  /** 있으면 `기존 일정 01` 대신 `{라벨} 기존 일정`으로 표시한다. */
  scheduleRowLabels?: readonly string[]
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  operationStart?: DateValue | null
  operationEnd?: DateValue | null
  submitting?: boolean
  onCancel: () => void
  onConfirm: (nextLines: string[]) => void | Promise<void>
}) {
  const [changedRanges, setChangedRanges] = useState<Record<number, [Dayjs, Dayjs] | null>>({})
  const [confirming, setConfirming] = useState(false)
  const rangeStart = useMemo(() => toEducationOperationDayjs(operationStart), [operationStart])
  const rangeEnd = useMemo(() => toEducationOperationDayjs(operationEnd), [operationEnd])
  const isPeriodMode = educationScheduleMode === 'period'
  const busy = submitting || confirming

  useEffect(() => {
    if (open) {
      setChangedRanges({})
      setConfirming(false)
    }
  }, [open])

  const selectedCount = Object.values(changedRanges).filter(Boolean).length

  return (
    <ContentModal
      open={open}
      onCancel={busy ? () => undefined : onCancel}
      title={EDUCATION_SCHEDULE_CHANGE_MODAL_TITLE}
      description={EDUCATION_SCHEDULE_CHANGE_MODAL_DESCRIPTION}
      size="medium"
      className="education-schedule-change-modal"
      footer={
        <div className="education-schedule-change-modal__footer">
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            disabled={busy}
            onClick={onCancel}
          >
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={selectedCount === 0 || busy}
            onClick={() => {
              const nextLines = applyChangedRangesToEducationScheduleLines(
                scheduleLines,
                changedRanges
              )
              setConfirming(true)
              void Promise.resolve(onConfirm(nextLines)).finally(() => {
                setConfirming(false)
              })
            }}
          >
            일정 변경
          </CmsButton>
        </div>
      }
    >
      <DetailInfoForm title={EDUCATION_SCHEDULE_CHANGE_MODAL_TITLE} hideHeader mode="edit">
        {scheduleLines.map((line, index) => {
          const order = padEducationScheduleChangeLabel(index)
          const rowLabel = scheduleRowLabels?.[index]
          const originalRange = parseEducationScheduleLineToChangeRange(line)
          const selectedRange = changedRanges[index] ?? null
          return (
            <DetailInfoForm.Row key={`${line}-${index}`} type="double">
              <DetailInfoForm.Field
                label={rowLabel ? `${rowLabel} 기존 일정` : `기존 일정 ${order}`}
                readOnlyDisplay
                view={formatEducationScheduleLineForChangeModal(line)}
              />
              <DetailInfoForm.Field
                label={rowLabel ? `${rowLabel} 변경 일정` : `변경 일정 ${order}`}
                view="-"
                edit={
                  <ParagraphDatePicker
                    key={`${open}-${index}-${line}`}
                    mode="single"
                    presetMode={isPeriodMode ? 'period' : 'schedule'}
                    customizable={false}
                    showPeriodToggle={false}
                    showTimeToggle={false}
                    lockPeriodToggleOn={isPeriodMode}
                    suppressAutoTodayWhenEmpty
                    value={selectedRange?.[0] ?? null}
                    appliedSurfaceRange={selectedRange}
                    appliedSurfaceWithTime={false}
                    initialPopoverRange={originalRange}
                    placeholder="변경 일정을 선택해 주세요"
                    width={isPeriodMode ? 360 : 240}
                    disabled={busy}
                    disabledDate={date => {
                      if (
                        originalRange != null &&
                        (date.isSame(originalRange[0], 'day') ||
                          date.isSame(originalRange[1], 'day'))
                      ) {
                        return false
                      }
                      return isOutsideEducationOperationRange(date, rangeStart, rangeEnd)
                    }}
                    onChange={next => {
                      if (next) return
                      setChangedRanges(prev => ({
                        ...prev,
                        [index]: null,
                      }))
                    }}
                    onRangeChange={range =>
                      setChangedRanges(prev => ({
                        ...prev,
                        [index]: range,
                      }))
                    }
                  />
                }
              />
            </DetailInfoForm.Row>
          )
        })}
      </DetailInfoForm>
    </ContentModal>
  )
}
