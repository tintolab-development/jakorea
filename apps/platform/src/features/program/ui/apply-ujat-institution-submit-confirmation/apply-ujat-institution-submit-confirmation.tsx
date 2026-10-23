import type { WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import { PFCheckbox, PFText } from '@/shared/ui'
import styles from './apply-ujat-institution-submit-confirmation.module.css'

type ApplyUjatInstitutionSubmitConfirmationProps = {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** 신청 양식은 체크, 협의된 일정 확인 시안은 라디오 */
  control?: 'checkbox' | 'radio'
}

export function readUjatSubmitConfirmationItem(
  paragraph: WritingFormParagraph,
): { id: string; label: string } | null {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') return null
  const item = paragraph.items[0]
  if (!item?.id) return null
  const label = item.label.trim()
  if (!label) return null
  return { id: item.id, label }
}

export function isUjatSubmitConfirmationChecked(paragraph: WritingFormParagraph): boolean {
  const item = readUjatSubmitConfirmationItem(paragraph)
  if (!item) return false
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') return false
  return paragraph.selectedPreviewSingleId === item.id
}

/** 시안 확인 단락 — 신청은 체크, 협의된 일정 확인은 라디오 */
export function ApplyUjatInstitutionSubmitConfirmation({
  label,
  checked,
  onCheckedChange,
  control = 'checkbox',
}: ApplyUjatInstitutionSubmitConfirmationProps) {
  if (control === 'radio') {
    return (
      <div className={styles.radioGroup} role="radiogroup" aria-label={label}>
        <label className={styles.radioOption}>
          <input
            type="radio"
            name="ujat-progress-confirm-submit"
            checked={checked}
            onClick={() => onCheckedChange(!checked)}
            onChange={() => onCheckedChange(true)}
          />
          <PFText as="span" typo="bd-md-rg" color={checked ? 'primary-500' : 'black'}>
            {label}
          </PFText>
        </label>
      </div>
    )
  }

  return <PFCheckbox checked={checked} onCheckedChange={onCheckedChange} label={label} />
}
