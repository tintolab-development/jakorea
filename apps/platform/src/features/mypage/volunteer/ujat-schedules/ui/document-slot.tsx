import { EducationSessionGuideBlock } from '@/features/mypage/education/shared'
import { PFButton } from '@/shared/ui'
import type { UjatEducationDocumentKind, UjatEducationDocumentSlot } from '../lib/documents'
import type { UjatEducationDocumentTemplateSetup } from '../lib/documents'
import {
  canEnterUjatEducationDocumentRevise,
  canEnterUjatEducationDocumentWrite,
  canViewUjatEducationDocumentFeedback,
  canViewUjatEducationDocumentResponse,
  formatUjatEducationDocumentDeadline,
  ujatEducationDocumentGuideMessage,
  ujatEducationDocumentStatusLabel,
  ujatEducationDocumentStatusTone,
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
  const deadline = formatUjatEducationDocumentDeadline(slot)
  const submitted = slot.status === 'SUBMITTED' || slot.status === 'REVISED'
  const periodLabel = deadline ? `제출 기한 ${deadline}` : undefined

  return (
    <EducationSessionGuideBlock
      variant={submitted ? 'submitted' : 'default'}
      statusLabel={ujatEducationDocumentStatusLabel(slot.status)}
      statusTone={ujatEducationDocumentStatusTone(slot.status)}
      message={ujatEducationDocumentGuideMessage(kind, slot, setup)}
      description={periodLabel}
      actions={
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
              {title} 작성
            </PFButton>
          ) : null}
        </div>
      }
    />
  )
}
