/**
 * 참여 강사 추가 등록 — 개인정보 수집·이용 / 제3자 제공 동의 모달
 * 강사 선택 후 「추가 등록」 클릭 시 노출 (UJAT 추가 등록 폼 draft-paragraph 패턴 재사용)
 */

import { useEffect, useMemo, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/table/horizontal-table-paragraph-body'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { createParticipatingInstructorAddConsentParagraphs } from '@/features/program/general/lib/participating-instructor-add-consent-draft'
import '@/features/template/ui/form-editor/form-editor-horizontal-table.css'
import './participating-instructor-add-consent-modal.css'

export interface ParticipatingInstructorAddConsentModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

function ConsentParagraphSection({
  paragraph,
  onChange,
}: {
  paragraph: HorizontalTableParagraph
  onChange: (next: HorizontalTableParagraph) => void
}) {
  return (
    <section className="participating-instructor-add-consent-modal__section">
      <FormParagraphSectionHeader
        title={paragraph.paragraphTitle}
        required={paragraph.requiredMark}
        surface="responseEntry"
        titleAligned
      />
      <div className="participating-instructor-add-consent-modal__template-block">
        <HorizontalTableParagraphBody
          paragraph={paragraph}
          onChange={onChange}
          isEditMode={false}
          tableCanvasInteractive={false}
          bottomConsentPreviewInAuthoring
          paragraphInteractionMode="user"
        />
      </div>
    </section>
  )
}

export function ParticipatingInstructorAddConsentModal({
  open,
  onClose,
  onConfirm,
}: ParticipatingInstructorAddConsentModalProps) {
  const { showAlert } = useCmsAlert()
  const initialParagraphs = useMemo(() => createParticipatingInstructorAddConsentParagraphs(), [])
  const [paragraphs, setParagraphs] = useState(initialParagraphs)

  useEffect(() => {
    if (!open) return
    setParagraphs(initialParagraphs.map(paragraph => ({ ...paragraph, bottomConsent: 'agree' as const })))
  }, [open, initialParagraphs])

  const updateParagraph = (id: string, next: HorizontalTableParagraph) => {
    setParagraphs(prev => prev.map(paragraph => (paragraph.id === id ? next : paragraph)))
  }

  const handleConfirm = () => {
    const allAgreed = paragraphs.every(paragraph => paragraph.bottomConsent === 'agree')
    if (!allAgreed) {
      showAlert({
        title: '안내',
        content: '개인정보 수집·이용 및 제3자 정보 제공·이용에 모두 동의해 주세요.',
      })
      return
    }
    onConfirm()
  }

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={onClose}>
        닫기
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={handleConfirm}>
        추가 등록
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 추가 등록"
      width={1400}
      footer={footer}
      className="participating-instructor-add-consent-modal"
      zIndex={1100}
    >
      <div className="participating-instructor-add-consent-modal__scroll">
        <div className="participating-instructor-add-consent-modal__sections">
          {paragraphs.map(paragraph => (
            <ConsentParagraphSection
              key={paragraph.id}
              paragraph={paragraph}
              onChange={next => updateParagraph(paragraph.id, next)}
            />
          ))}
        </div>
      </div>
    </ContentModal>
  )
}
