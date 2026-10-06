import { Fragment } from 'react'
import {
  PFCheckbox,
  PFFormField,
  PFFormFieldHintText,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormFieldValueText,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFText,
} from '@/shared/ui'
import styles from './apply-instructor-available-schedule.module.css'

export type ApplyInstructorScheduleSlot = {
  id: string
  label: string
}

export type ApplyInstructorAvailableScheduleValues = {
  selectedSlotIds: string[]
}

export function emptyInstructorAvailableSchedule(): ApplyInstructorAvailableScheduleValues {
  return { selectedSlotIds: [] }
}

export function buildInstructorApplyScheduleSlots(input: {
  educationScheduleLines?: readonly string[]
  educationSchedules?: readonly { label?: string; value?: string }[]
}): ApplyInstructorScheduleSlot[] {
  const lines = (input.educationScheduleLines ?? [])
    .map(line => line.trim())
    .filter(Boolean)
  if (lines.length > 0) {
    return lines.map((label, index) => ({ id: `line:${index}`, label }))
  }
  return (input.educationSchedules ?? [])
    .map((row, index) => {
      const label = [row.label?.trim(), row.value?.trim()].filter(Boolean).join(' · ')
      if (!label) return null
      return { id: `edu:${index}`, label }
    })
    .filter((row): row is ApplyInstructorScheduleSlot => row != null)
}

export function findIncompleteInstructorAvailableScheduleMessage(
  values: ApplyInstructorAvailableScheduleValues,
  slots: readonly ApplyInstructorScheduleSlot[],
): string | null {
  if (slots.length === 0) {
    return '선택 가능한 강의 일정이 없습니다. 관리자에게 문의해 주세요.'
  }
  if (values.selectedSlotIds.length === 0) {
    return '강의 진행이 가능한 일정을 하나 이상 선택해 주세요.'
  }
  return null
}

export function instructorAvailableScheduleAnswerFromValues(
  values: ApplyInstructorAvailableScheduleValues,
  slots: readonly ApplyInstructorScheduleSlot[],
): Record<string, unknown> {
  const selected = slots.filter(slot => values.selectedSlotIds.includes(slot.id))
  const selectedLabels = selected.map(slot => slot.label)
  return {
    selectedSlotIds: selected.map(slot => slot.id),
    selectedLabels,
    summary: selectedLabels.join(' / '),
  }
}

export function instructorAvailableScheduleValuesFromDraftAnswer(
  answer: unknown,
): ApplyInstructorAvailableScheduleValues | null {
  if (typeof answer === 'string' && answer.trim()) {
    return null
  }
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const ids = Array.isArray(row.selectedSlotIds)
    ? row.selectedSlotIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []
  if (ids.length === 0) return null
  return { selectedSlotIds: ids }
}

type ApplyInstructorAvailableScheduleProps = {
  slots: readonly ApplyInstructorScheduleSlot[]
  value: ApplyInstructorAvailableScheduleValues
  onChange: (next: ApplyInstructorAvailableScheduleValues) => void
}

export function ApplyInstructorAvailableSchedule({
  slots,
  value,
  onChange,
}: ApplyInstructorAvailableScheduleProps) {
  const selected = slots.filter(slot => value.selectedSlotIds.includes(slot.id))

  const toggle = (slotId: string, checked: boolean) => {
    const next = checked
      ? [...value.selectedSlotIds.filter(id => id !== slotId), slotId]
      : value.selectedSlotIds.filter(id => id !== slotId)
    onChange({ selectedSlotIds: next })
  }

  return (
    <div className={styles.root}>
      {slots.length === 0 ? (
        <PFText as="p" typo="bd-md-md" color="neutral-cool-600" className={styles.empty}>
          선택 가능한 강의 일정이 없습니다.
        </PFText>
      ) : (
        <div className={styles.slotList}>
          {slots.map(slot => (
            <PFCheckbox
              key={slot.id}
              className={styles.slotItem}
              size="large"
              checked={value.selectedSlotIds.includes(slot.id)}
              onCheckedChange={checked => toggle(slot.id, checked)}
            >
              {slot.label}
            </PFCheckbox>
          ))}
        </div>
      )}

      {/* CMS DetailInfoForm.Row type="single" + TdDivider 요약 */}
      <PFFormFieldTable className={styles.summary}>
        <PFFormFieldRow type="single">
          <PFFormField label="강의 진행 가능일">
            {selected.length === 0 ? (
              <PFFormFieldHintText as="p">선택한 일정이 여기에 표시됩니다.</PFFormFieldHintText>
            ) : (
              <PFFormInlineRow>
                {selected.map((slot, index) => (
                  <Fragment key={slot.id}>
                    {index > 0 ? <PFFormInlineSeparator /> : null}
                    <PFFormInlineSegment>
                      <PFFormFieldValueText>{slot.label}</PFFormFieldValueText>
                    </PFFormInlineSegment>
                  </Fragment>
                ))}
              </PFFormInlineRow>
            )}
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>
    </div>
  )
}
