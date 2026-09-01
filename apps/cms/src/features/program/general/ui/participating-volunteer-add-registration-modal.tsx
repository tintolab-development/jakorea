/**
 * 참여 봉사자 추가 등록 — 신청 폼 모달
 * 봉사자 선택 후 「추가 등록」 클릭 시 노출 (UJAT 추가 등록 draft-paragraph + plugin 패턴)
 */

import { useEffect, useMemo, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { HorizontalTableParagraph, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  createParticipatingVolunteerAddRegistrationDraft,
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS,
  resolveJaVolunteerExperienceFromParagraph,
} from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import { PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_SECTIONS } from './participating-volunteer-add-registration/add-registration-form-section-config'
import { ParticipatingVolunteerAddRegistrationFormSectionRenderer } from './participating-volunteer-add-registration/add-registration-form-section-renderer'
import '@/features/template/ui/form-editor/form-editor-horizontal-table.css'
import './participating-volunteer-add-registration-modal.css'

export interface ParticipatingVolunteerAddRegistrationModalProps {
  open: boolean
  /** true — 선택한 회원에 1365 ID가 이미 등록됨(기본 정보 단락 숨김) */
  hideBasicInfoSection?: boolean
  onClose: () => void
  onConfirm: () => void
}

const CONSENT_PARAGRAPH_IDS = new Set<string>([
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.personalInfoCollection,
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.thirdPartyConsent,
])

export function ParticipatingVolunteerAddRegistrationModal({
  open,
  hideBasicInfoSection = false,
  onClose,
  onConfirm,
}: ParticipatingVolunteerAddRegistrationModalProps) {
  const { showAlert } = useCmsAlert()
  const initialDraft = useMemo(() => createParticipatingVolunteerAddRegistrationDraft(), [])
  const [paragraphs, setParagraphs] = useState(initialDraft.paragraphs)

  useEffect(() => {
    if (!open) return
    setParagraphs(
      initialDraft.paragraphs.map(paragraph => {
        if (paragraph.variant === 'horizontal_table' && CONSENT_PARAGRAPH_IDS.has(paragraph.id)) {
          return { ...paragraph, bottomConsent: 'agree' as const }
        }
        if (
          paragraph.variant === 'multiple_choice' &&
          paragraph.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.jaVolunteerExperience
        ) {
          return { ...paragraph, selectedPreviewSingleId: null, selectedPreviewMultipleIds: [] }
        }
        return paragraph
      })
    )
  }, [open, initialDraft.paragraphs])

  const updateParagraph = (id: string, next: WritingFormParagraph) => {
    setParagraphs(prev => prev.map(paragraph => (paragraph.id === id ? next : paragraph)))
  }

  const jaVolunteerExperience = useMemo(() => {
    const paragraph = paragraphs.find(
      p => p.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.jaVolunteerExperience
    )
    return resolveJaVolunteerExperienceFromParagraph(paragraph)
  }, [paragraphs])

  const handleConfirm = () => {
    const consentParagraphs = paragraphs.filter(
      (p): p is HorizontalTableParagraph =>
        p.variant === 'horizontal_table' && CONSENT_PARAGRAPH_IDS.has(p.id)
    )
    const allAgreed = consentParagraphs.every(paragraph => paragraph.bottomConsent === 'agree')
    if (!allAgreed) {
      showAlert({
        title: '안내',
        content: '개인정보 수집·이용 및 제3자 정보 제공·이용에 모두 동의해 주세요.',
      })
      return
    }
    onConfirm()
  }

  const sectionContext = useMemo(
    () => ({
      jaVolunteerExperience,
      hideBasicInfoSection,
    }),
    [jaVolunteerExperience, hideBasicInfoSection]
  )

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
          {PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_SECTIONS.map(section => (
            <ParticipatingVolunteerAddRegistrationFormSectionRenderer
              key={section.key}
              section={section}
              paragraphs={paragraphs}
              onParagraphChange={updateParagraph}
              sectionContext={sectionContext}
            />
          ))}
        </div>
      </div>
    </ContentModal>
  )
}
