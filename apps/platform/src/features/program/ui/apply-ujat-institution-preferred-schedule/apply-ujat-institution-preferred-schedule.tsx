import type { UjatPreferredEducationScheduleOption } from '@/features/program/lib/ujat-preferred-education-schedule-options'
import {
  isUjatPreferredScheduleOptionSelected,
  isUjatPreferredScheduleSelectedId,
  resolveUjatPreferredScheduleSelectedOptions,
} from '@/features/program/lib/ujat-preferred-education-schedule-options'
import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineSeparatedFields,
  PFText,
} from '@/shared/ui'
import slotStyles from '../apply-instructor-available-schedule/apply-instructor-available-schedule.module.css'
import styles from './apply-ujat-institution-preferred-schedule.module.css'

export const UJAT_PREFERRED_EDUCATION_DATE_MAX = 10

type ApplyUjatInstitutionPreferredScheduleProps = {
  options: readonly UjatPreferredEducationScheduleOption[]
  selectedIds: string[]
  onChange: (nextIds: string[]) => void
  optionsReady?: boolean
}

export function findIncompleteUjatInstitutionPreferredScheduleMessage(
  selectedIds: readonly string[],
  options: readonly UjatPreferredEducationScheduleOption[],
): string | null {
  if (options.length === 0) return '선택 가능한 교육 일정이 없습니다.'
  if (selectedIds.length === 0) return '교육 진행 희망일을 선택해 주세요.'
  return null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function ujatInstitutionPreferredScheduleAnswerFromValues(
  selectedIds: readonly string[],
  options: readonly UjatPreferredEducationScheduleOption[],
): Record<string, unknown> {
  const selected = resolveUjatPreferredScheduleSelectedOptions(selectedIds, options).slice(
    0,
    UJAT_PREFERRED_EDUCATION_DATE_MAX,
  )
  const ids = selected.map(option => option.id)
  return {
    selectedIds: ids,
    dates: selected.map(option => option.date),
    ujatApplication: {
      preferredScheduleSelectedIds: ids,
    },
  }
}

export function ujatInstitutionPreferredScheduleValuesFromDraftAnswer(
  answer: unknown,
): string[] | null {
  if (Array.isArray(answer)) {
    return answer.map(value => String(value)).filter(Boolean)
  }
  const record = asRecord(answer)
  if (!record) return null
  const nested = asRecord(record.ujatApplication)
  const raw =
    nested?.preferredScheduleSelectedIds ??
    record['ujatApplication.preferredScheduleSelectedIds'] ??
    record.selectedIds ??
    record.dates
  if (!Array.isArray(raw)) return null
  return raw.map(value => String(value).trim()).filter(isUjatPreferredScheduleSelectedId)
}

export function ApplyUjatInstitutionPreferredSchedule({
  options,
  selectedIds,
  onChange,
  optionsReady = true,
}: ApplyUjatInstitutionPreferredScheduleProps) {
  const selected = resolveUjatPreferredScheduleSelectedOptions(selectedIds, options)
  const toggle = (id: string) => {
    const option = options.find(row => row.id === id)
    if (!option) return
    if (isUjatPreferredScheduleOptionSelected(option, selectedIds)) {
      onChange(selectedIds.filter(token => token !== option.id))
      return
    }
    if (selected.length >= UJAT_PREFERRED_EDUCATION_DATE_MAX) return
    onChange([...selected.map(row => row.id), option.id])
  }

  return (
    <div className={styles.root}>
      <div className={styles.grid} role="list">
        {!optionsReady ? null : options.length === 0 ? (
          <PFText as="p" typo="bd-md-md" color="neutral-cool-600" className={styles.empty}>
            선택 가능한 교육 일정이 없습니다.
          </PFText>
        ) : (
          options.map(option => {
            const active = isUjatPreferredScheduleOptionSelected(option, selectedIds)
            return (
              <button
                key={option.id}
                type="button"
                role="listitem"
                aria-pressed={active}
                className={[
                  slotStyles.slotCard,
                  slotStyles.slotCardInterview,
                  active ? slotStyles.slotCardActive : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => toggle(option.id)}
              >
                <span className={slotStyles.slotCardTitle}>{option.display}</span>
              </button>
            )
          })
        )}
      </div>
      <PFFormFieldTable>
        <PFFormFieldRow type="single">
          <PFFormField label="교육 진행 희망일" labelWidth="wider" fullWidth>
            {selected.length === 0 ? (
              <PFText as="span" typo="bd-md-md" color="black">
                -
              </PFText>
            ) : (
              <PFFormInlineSeparatedFields>
                {selected.map(option => (
                  <PFText key={option.id} as="span" typo="bd-md-md" color="black">
                    {option.display}
                  </PFText>
                ))}
              </PFFormInlineSeparatedFields>
            )}
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>
    </div>
  )
}
