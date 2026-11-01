import { useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ContentModal, CmsButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import type { DateValue } from '@/types'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { getEducationScheduleSelectionDatePickerProps } from '@/features/program/general/lib/schedule-detail-form'
import {
  applyChangedRangesToEducationScheduleLines,
  EDUCATION_SCHEDULE_CHANGE_MODAL_DESCRIPTION,
  EDUCATION_SCHEDULE_CHANGE_MODAL_TITLE,
  formatEducationScheduleLineForChangeModal,
  isEducationScheduleLinePast,
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
  educationStructure,
  participantOrganization = false,
  sessionRound = 'single',
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
  /**
   * 있으면 「교육 진행 일정 선택」과 같은 데이트피커(기간·시간 입력)를 쓴다.
   * 없으면 기존처럼 날짜(기간형은 기간)만 고른다.
   */
  educationStructure?: 'curriculum' | 'schedule'
  participantOrganization?: boolean
  sessionRound?: 'single' | 'multi'
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
  const selectionPickerProps =
    educationStructure != null
      ? getEducationScheduleSelectionDatePickerProps({
          educationStructure,
          participantOrganization,
          sessionRound,
          scheduleMode: isPeriodMode ? 'period' : 'date',
        })
      : null
  const pickerConfig = selectionPickerProps ?? {
    presetMode: isPeriodMode ? ('period' as const) : ('schedule' as const),
    lockPeriodToggleOn: isPeriodMode,
  }
  const pickerWithTime =
    selectionPickerProps != null &&
    selectionPickerProps.lockTimeToggleOn &&
    !selectionPickerProps.disableTimeInputs
  const busy = submitting || confirming

  useEffect(() => {
    if (open) {
      setChangedRanges({})
      setConfirming(false)
    }
  }, [open])

  /** 이미 지나간 일정은 수정 대상에서 제외 — 화면에 노출하지 않는다. (원본 index 유지) */
  const editableRows = useMemo(() => {
    if (!open) return []
    const now = dayjs()
    return scheduleLines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => !isEducationScheduleLinePast(line, now))
  }, [open, scheduleLines])
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
            onClick={onCancel} >
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
                changedRanges,
                { keepOriginalTimeWhenDateOnly: !pickerWithTime }
              )
              setConfirming(true)
              void Promise.resolve(onConfirm(nextLines)).finally(() => {
                setConfirming(false)
              })
            }} >
            일정 변경
          </CmsButton>
        </div>
      }
    >
      <DetailInfoForm title={EDUCATION_SCHEDULE_CHANGE_MODAL_TITLE} hideHeader mode="edit">
        {editableRows.length === 0 ? (
          <p className="education-schedule-change-modal__empty">
            변경할 수 있는 예정 일정이 없습니다. 이미 지난 일정은 변경할 수 없습니다.
          </p>
        ) : null}
        {editableRows.map(({ line, index }, visibleIndex) => {
          const order = padEducationScheduleChangeLabel(visibleIndex)
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
                    inputSize="small"
                    key={`${open}-${index}-${line}`}
                    mode="single"
                    customizable={false}
                    showPeriodToggle={false}
                    showTimeToggle={false}
                    {...pickerConfig}
                    suppressAutoTodayWhenEmpty
                    value={selectedRange?.[0] ?? null}
                    appliedSurfaceRange={selectedRange}
                    appliedSurfaceWithTime={pickerWithTime}
                    initialPopoverRange={originalRange}
                    placeholder="변경 일정을 선택해 주세요"
                    width={isPeriodMode ? 360 : 240}
                    disabled={busy}
                    disabledDate={date => {
                      if (date.isBefore(dayjs(), 'day')) return true
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
