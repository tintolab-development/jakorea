import type { WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import { PFCheckbox, PFText } from '@/shared/ui'
import styles from './apply-ujat-institution-submit-confirmation.module.css'

type ApplyUjatInstitutionSubmitConfirmationProps = {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** UJAT 참여 기관 신청·협의된 일정 확인 시안은 라디오, 봉사자 신청은 체크 */
  control?: 'checkbox' | 'radio'
  /** 라디오 name — 기본은 협의된 일정 확인 화면 값 */
  radioName?: string
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

/** 시안 확인 단락 — 참여 기관 신청·협의된 일정 확인은 라디오, 봉사자 신청은 체크 */
export function ApplyUjatInstitutionSubmitConfirmation({
  label,
  checked,
  onCheckedChange,
  control = 'checkbox',
  radioName = 'ujat-progress-confirm-submit',
}: ApplyUjatInstitutionSubmitConfirmationProps) {
  if (control === 'radio') {
    return (
      <div className={styles.radioGroup} role="radiogroup" aria-label={label}>
        <label className={styles.radioOption}>
          <input
            type="radio"
            name={radioName}
            checked={checked}
            onClick={() => onCheckedChange(!checked)}
            onChange={() => onCheckedChange(true)}
          />
          <PFText as="span" typo="bd-lg-sb" color={checked ? 'primary-500' : 'black'}>
            {label}
          </PFText>
        </label>
      </div>
    )
  }

  return <PFCheckbox checked={checked} onCheckedChange={onCheckedChange} label={label} />
}
