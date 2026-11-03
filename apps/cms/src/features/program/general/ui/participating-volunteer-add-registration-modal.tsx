/**
 * 참여 봉사자 추가 등록 — 신청 폼 모달
 * 봉사자 선택 후 「추가 등록」 클릭 시 노출 (UJAT 추가 등록 draft-paragraph + plugin 패턴)
 */

import { useEffect, useMemo, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  createParticipatingVolunteerAddRegistrationDraft,
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS,
  resolveJaVolunteerExperienceFromParagraph,
} from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import { ParticipatingVolunteerAddRegistrationPluginProvider, useParticipatingVolunteerAddRegistrationPluginState } from '@/features/program/general/lib/participating-volunteer-add-registration-plugin-state'
import { buildVolunteerParticipantRegisterRequest } from '@/features/program/general/lib/participating-volunteer-participant-register-request'
import type { VolunteerParticipantRegisterRequest } from '@/features/program/general/api/program-progress-api-client'
import { PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_SECTIONS } from './participating-volunteer-add-registration/add-registration-form-section-config'
import { ParticipatingVolunteerAddRegistrationFormSectionRenderer } from './participating-volunteer-add-registration/add-registration-form-section-renderer'
import '@/features/template/ui/form-editor/form-editor-horizontal-table.css'
import './participating-volunteer-add-registration-modal.css'

export interface ParticipatingVolunteerAddRegistrationModalProps {
  open: boolean
  memberId: string | null
  programId?: string | number | null
  /** true — 선택한 회원에 1365 ID가 이미 등록됨(기본 정보 단락 숨김) */
  hideBasicInfoSection?: boolean
  zIndex?: number
  onClose: () => void
  onConfirm: (payload: VolunteerParticipantRegisterRequest) => void | Promise<void>
}

const CONSENT_PARAGRAPH_IDS = new Set<string>([
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.personalInfoCollection,
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.thirdPartyConsent,
])

function ParticipatingVolunteerAddRegistrationModalBody({
  open,
  memberId,
  programId,
  hideBasicInfoSection,
  zIndex = 1100,
  onClose,
  onConfirm,
}: ParticipatingVolunteerAddRegistrationModalProps) {
  const { showAlert } = useCmsAlert()
  const { values: pluginValues, reset: resetPluginValues } =
    useParticipatingVolunteerAddRegistrationPluginState()
  const initialDraft = useMemo(() => createParticipatingVolunteerAddRegistrationDraft(), [])
  const [paragraphs, setParagraphs] = useState(initialDraft.paragraphs)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    resetPluginValues()
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
  }, [open, initialDraft.paragraphs, resetPluginValues])

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
    const numericMemberId = Number(memberId)
    if (!memberId || !Number.isFinite(numericMemberId) || numericMemberId <= 0) {
      showAlert({ title: '안내', content: '등록할 봉사자를 다시 선택해 주세요.' })
      return
    }

    const built = buildVolunteerParticipantRegisterRequest({
      memberId: numericMemberId,
      paragraphs,
      pluginValues,
      hideBasicInfoSection: hideBasicInfoSection ?? false,
    })
    if (!built.ok) {
      showAlert({ title: '안내', content: built.message })
      return
    }

    setSubmitting(true)
    void Promise.resolve(onConfirm(built.request))
      .then(() => {
        onClose()
      })
      .catch(() => {
        // 호출부에서 alert 처리
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const sectionContext = useMemo(
    () => ({
      jaVolunteerExperience,
      hideBasicInfoSection: hideBasicInfoSection ?? false,
      programId,
    }),
    [jaVolunteerExperience, hideBasicInfoSection, programId]
  )

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={onClose} disabled={submitting}>
        닫기
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={handleConfirm} disabled={submitting}>
        추가 등록
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="봉사자 추가 등록"
      width={1200}
      footer={footer}
      titleBodyGap="none"
      className="participating-volunteer-add-registration-modal"
      zIndex={zIndex}
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

export function ParticipatingVolunteerAddRegistrationModal(props: ParticipatingVolunteerAddRegistrationModalProps) {
  if (!props.open) return null

  return (
    <ParticipatingVolunteerAddRegistrationPluginProvider>
      <ParticipatingVolunteerAddRegistrationModalBody {...props} />
    </ParticipatingVolunteerAddRegistrationPluginProvider>
  )
}
