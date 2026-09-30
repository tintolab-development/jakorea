import { useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { ContentModal, CmsButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import type { DateValue } from '@/types'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { educationScheduleRangeHasClock } from '@/features/template/lib/format-education-schedule-line'
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
  educationScheduleMode = 'date',
  operationStart,
  operationEnd,
  onCancel,
  onConfirm,
}: {
  open: boolean
  scheduleLines: readonly string[]
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  operationStart?: DateValue | null
  operationEnd?: DateValue | null
  onCancel: () => void
  onConfirm: (nextLines: string[]) => void
}) {
  const [changedRanges, setChangedRanges] = useState<Record<number, [Dayjs, Dayjs] | null>>({})
  const rangeStart = useMemo(() => toEducationOperationDayjs(operationStart), [operationStart])
  const rangeEnd = useMemo(() => toEducationOperationDayjs(operationEnd), [operationEnd])
  const isPeriodMode = educationScheduleMode === 'period'

  useEffect(() => {
    if (open) setChangedRanges({})
  }, [open])

  const selectedCount = Object.values(changedRanges).filter(Boolean).length

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={EDUCATION_SCHEDULE_CHANGE_MODAL_TITLE}
      description={EDUCATION_SCHEDULE_CHANGE_MODAL_DESCRIPTION}
      size="medium"
      className="education-schedule-change-modal"
      footer={
        <div className="education-schedule-change-modal__footer">
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={selectedCount === 0}
            onClick={() =>
              onConfirm(applyChangedRangesToEducationScheduleLines(scheduleLines, changedRanges))
            }
          >
            일정 변경
          </CmsButton>
        </div>
      }
    >
      <DetailInfoForm title={EDUCATION_SCHEDULE_CHANGE_MODAL_TITLE} hideHeader mode="edit">
        {scheduleLines.map((line, index) => {
          const order = padEducationScheduleChangeLabel(index)
          const originalRange = parseEducationScheduleLineToChangeRange(line)
          const selectedRange = changedRanges[index] ?? null
          return (
            <DetailInfoForm.Row key={`${line}-${index}`} type="double">
              <DetailInfoForm.Field
                label={`기존 일정 ${order}`}
                readOnlyDisplay
                view={formatEducationScheduleLineForChangeModal(line)}
              />
              <DetailInfoForm.Field
                label={`변경 일정 ${order}`}
                view="-"
                edit={
                  <ParagraphDatePicker
                    key={`${open}-${index}-${line}`}
                    mode="single"
                    presetMode={isPeriodMode ? 'period' : 'schedule'}
                    customizable={false}
                    showPeriodToggle={false}
                    showTimeToggle={!isPeriodMode}
                    lockTimeToggleOn={!isPeriodMode}
                    lockPeriodToggleOn={isPeriodMode}
                    suppressAutoTodayWhenEmpty
                    value={selectedRange?.[0] ?? null}
                    appliedSurfaceRange={selectedRange}
                    appliedSurfaceWithTime={
                      selectedRange != null && educationScheduleRangeHasClock(selectedRange)
                    }
                    initialPopoverRange={originalRange}
                    placeholder="변경 일정을 선택해 주세요"
                    width={isPeriodMode ? 360 : 240}
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
