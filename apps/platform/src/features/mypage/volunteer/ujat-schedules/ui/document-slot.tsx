import { EducationSessionGuideBlock } from '@/features/mypage/education/shared'
import { formatDisplayDate } from '@/shared/lib/format-display-date'
import { PFButton } from '@/shared/ui'
import type { UjatEducationDocumentKind, UjatEducationDocumentSlot } from '../lib/documents'
import type { UjatEducationDocumentTemplateSetup } from '../lib/documents'
import {
  canEnterUjatEducationDocumentRevise,
  canEnterUjatEducationDocumentWrite,
  canViewUjatEducationDocumentFeedback,
  canViewUjatEducationDocumentResponse,
  formatUjatEducationDocumentDeadline,
  isUjatEducationDocumentSlotSubmitted,
  resolveUjatEducationDocumentGuide,
  ujatEducationDocumentTitle,
} from '../lib/documents'
import styles from './document-slot.module.css'

export type UjatDocumentFillMode = 'write' | 'revise' | 'view'

type UjatEducationDocumentSlotBlockProps = {
  kind: UjatEducationDocumentKind
  slot: UjatEducationDocumentSlot
  setup: UjatEducationDocumentTemplateSetup | null
  onFill: (mode: UjatDocumentFillMode) => void
  onFeedback: () => void
}

function documentPeriodLabel(slot: UjatEducationDocumentSlot): string | undefined {
  if (slot.deadlineDate) {
    const formatted = formatDisplayDate(slot.deadlineDate)
    if (formatted) return formatted
  }
  return formatUjatEducationDocumentDeadline(slot) ?? undefined
}

export function UjatEducationDocumentSlotBlock({
  kind,
  slot,
  setup,
  onFill,
  onFeedback,
}: UjatEducationDocumentSlotBlockProps) {
  const title = ujatEducationDocumentTitle(kind)
  const canWrite = canEnterUjatEducationDocumentWrite(slot)
  const canRevise = canEnterUjatEducationDocumentRevise(slot)
  const canView = canViewUjatEducationDocumentResponse(slot)
  const canFeedback = canViewUjatEducationDocumentFeedback(slot)
  const submitted = isUjatEducationDocumentSlotSubmitted(slot.status)
  const guide = resolveUjatEducationDocumentGuide(kind, slot, setup)

  return (
    <EducationSessionGuideBlock
      // Figma 11005:341931 — 피드백이 있으면 연분홍(status/error/bg) 배경
      variant={canFeedback ? 'feedback' : submitted ? 'submitted' : 'default'}
      className={styles.block}
      statusLabel={guide.statusLabel}
      statusTone={guide.statusTone}
      message={guide.message}
      description={documentPeriodLabel(slot)}
      mobileStack
      actions={
        canFeedback || canView || canRevise || canWrite ? (
          <div className={styles.actions}>
            {canFeedback ? (
              <PFButton type="button" variant="tertiary" size="large" onClick={onFeedback}>
                피드백 확인
              </PFButton>
            ) : null}
            {canView ? (
              <PFButton type="button" variant="secondary" size="large" onClick={() => onFill('view')}>
                {title} 보기
              </PFButton>
            ) : null}
            {canRevise ? (
              <PFButton type="button" variant="primary" size="large" onClick={() => onFill('revise')}>
                수정 제출하기
              </PFButton>
            ) : canWrite ? (
              <PFButton type="button" variant="primary" size="large" onClick={() => onFill('write')}>
                {title} 제출
              </PFButton>
            ) : null}
          </div>
        ) : undefined
      }
    />
  )
}
