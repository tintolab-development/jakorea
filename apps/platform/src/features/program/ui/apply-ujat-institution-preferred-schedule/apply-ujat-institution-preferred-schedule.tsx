import { Fragment } from 'react'
import { DetailInfoForm } from '@/features/form-template'
import type { UjatPreferredEducationScheduleOption } from '@/features/program/lib/ujat-preferred-education-schedule-options'
import { PFText } from '@/shared/ui'
import slotStyles from '../apply-instructor-available-schedule/apply-instructor-available-schedule.module.css'
import styles from './apply-ujat-institution-preferred-schedule.module.css'

export const UJAT_PREFERRED_EDUCATION_DATE_MAX = 10

type ApplyUjatInstitutionPreferredScheduleProps = {
  options: readonly UjatPreferredEducationScheduleOption[]
  selectedIds: string[]
  onChange: (nextIds: string[]) => void
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
  const allowed = new Set(options.map(option => option.id))
  const selected = selectedIds
    .filter(id => allowed.has(id))
    .slice(0, UJAT_PREFERRED_EDUCATION_DATE_MAX)
    .flatMap(id => {
      const option = options.find(row => row.id === id)
      return option ? [option] : []
    })
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
  return raw.map(value => String(value)).filter(Boolean)
}

export function ApplyUjatInstitutionPreferredSchedule({
  options,
  selectedIds,
  onChange,
}: ApplyUjatInstitutionPreferredScheduleProps) {
  const selected = options.filter(option => selectedIds.includes(option.id))
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id))
      return
    }
    if (selectedIds.length >= UJAT_PREFERRED_EDUCATION_DATE_MAX) return
    onChange([...selectedIds, id])
  }

  return (
    <div className={styles.gridWrap}>
      <div className={styles.grid} role="list">
        {options.length === 0 ? (
          <PFText as="p" typo="bd-md-md" color="neutral-cool-600" className={styles.empty}>
            선택 가능한 교육 일정이 없습니다.
          </PFText>
        ) : (
          options.map(option => {
            const active = selectedIds.includes(option.id)
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
      <DetailInfoForm title="진행 희망 교육 일정" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 희망일"
            fullRow
            view="-"
            edit={
              selected.length === 0 ? (
                <span className="form-editor-template-field-hint-text">
                  선택된 일정이 없습니다.
                </span>
              ) : (
                <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
                  {selected.map((option, index) => (
                    <Fragment key={option.id}>
                      {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
                      <span>{option.display}</span>
                    </Fragment>
                  ))}
                </div>
              )
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
