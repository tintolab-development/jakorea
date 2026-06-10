/**
 * 참여 봉사자 추가 등록 — 신청 폼 모달
 * 봉사자 선택 후 「추가 등록」 클릭 시 노출 (참여 강사 추가 등록 2단계 플로우와 동일)
 */

import { useEffect, useMemo, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/table/horizontal-table-paragraph-body'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { createParticipatingVolunteerAddRegistrationConsentParagraphs } from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import { ParticipatingVolunteerAddRegistrationBasicInfoSection } from './participating-volunteer-add-registration/basic-info-section'
import {
  ParticipatingVolunteerAddRegistrationJaExperienceSection,
  type JaVolunteerExperience,
} from './participating-volunteer-add-registration/ja-volunteer-experience-section'
import { ParticipatingVolunteerAddRegistrationPreviousJaProgramSection } from './participating-volunteer-add-registration/previous-ja-program-section'
import { ParticipatingVolunteerAddRegistrationFreeTextSection } from './participating-volunteer-add-registration/free-text-section'
import '@/features/template/ui/form-editor/form-editor-horizontal-table.css'
import './participating-volunteer-add-registration-modal.css'

export interface ParticipatingVolunteerAddRegistrationModalProps {
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
    <section className="participating-volunteer-add-registration-modal__section">
      <FormParagraphSectionHeader
        title={paragraph.paragraphTitle}
        required={paragraph.requiredMark}
        surface="responseEntry"
        titleAligned
      />
      <div className="participating-volunteer-add-registration-modal__template-block">
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

export function ParticipatingVolunteerAddRegistrationModal({
  open,
  onClose,
  onConfirm,
}: ParticipatingVolunteerAddRegistrationModalProps) {
  const { showAlert } = useCmsAlert()
  const initialParagraphs = useMemo(
    () => createParticipatingVolunteerAddRegistrationConsentParagraphs(),
    []
  )
  const [paragraphs, setParagraphs] = useState(initialParagraphs)
  const [jaVolunteerExperience, setJaVolunteerExperience] = useState<JaVolunteerExperience>(undefined)

  useEffect(() => {
    if (!open) return
    setParagraphs(
      initialParagraphs.map(paragraph => ({ ...paragraph, bottomConsent: 'agree' as const }))
    )
    setJaVolunteerExperience(undefined)
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
      title="봉사자 추가 등록"
      width={1400}
      footer={footer}
      className="participating-volunteer-add-registration-modal"
      zIndex={1100}
    >
      <div className="participating-volunteer-add-registration-modal__scroll">
        <div className="participating-volunteer-add-registration-modal__sections">
          {paragraphs.map(paragraph => (
            <ConsentParagraphSection
              key={paragraph.id}
              paragraph={paragraph}
              onChange={next => updateParagraph(paragraph.id, next)}
            />
          ))}
          <ParticipatingVolunteerAddRegistrationBasicInfoSection />
          <ParticipatingVolunteerAddRegistrationJaExperienceSection
            value={jaVolunteerExperience}
            onChange={setJaVolunteerExperience}
          />
          {jaVolunteerExperience === 'yes' ? (
            <ParticipatingVolunteerAddRegistrationPreviousJaProgramSection />
          ) : null}
          <ParticipatingVolunteerAddRegistrationFreeTextSection />
        </div>
      </div>
    </ContentModal>
  )
}
