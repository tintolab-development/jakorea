import type { WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import { PFCheckbox } from '@/shared/ui'

type ApplyUjatInstitutionSubmitConfirmationProps = {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
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

/** 시안 확인 단락 — 단일 선택지를 PF 체크로 표시 (신청·교육 진행 정보 확인 공통) */
export function ApplyUjatInstitutionSubmitConfirmation({
  label,
  checked,
  onCheckedChange,
}: ApplyUjatInstitutionSubmitConfirmationProps) {
  return <PFCheckbox checked={checked} onCheckedChange={onCheckedChange} label={label} />
}
