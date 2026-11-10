/**
 * 참여 봉사자 추가 등록 — 신청 폼 모달
 * 봉사자 선택 후 「추가 등록」 클릭 시 노출 (UJAT 추가 등록 draft-paragraph + plugin 패턴)
 */

import { useEffect, useMemo, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
} from '@jakorea/domain/shared/required-consent-alert'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  createParticipatingVolunteerAddRegistrationDraft,
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS,
  resolveJaVolunteerExperienceFromParagraph,
  type ParticipatingVolunteerAddRegistrationDraftPreset,
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
  /**
   * 생략(`default`) — 기존 동작(동의 기본 선택, 경험 여부 기존 라벨). UJAT 추가 등록 기본값.
   * `generalInstitution` — 일반 프로그램(기관형) Figma: 동의 미선택 시작, 경험 여부 「있음 / 없음」, 미동의 시 필수 동의 안내.
   */
  preset?: ParticipatingVolunteerAddRegistrationDraftPreset
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
  preset = 'default',
  onClose,
  onConfirm,
}: ParticipatingVolunteerAddRegistrationModalProps) {
  const isGeneralInstitution = preset === 'generalInstitution'
  const { showAlert } = useCmsAlert()
  const { values: pluginValues, reset: resetPluginValues } =
    useParticipatingVolunteerAddRegistrationPluginState()
  const initialDraft = useMemo(
    () => createParticipatingVolunteerAddRegistrationDraft(preset),
    [preset]
  )
  const [paragraphs, setParagraphs] = useState(initialDraft.paragraphs)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    resetPluginValues()
    setParagraphs(
      initialDraft.paragraphs.map(paragraph => {
        if (paragraph.variant === 'horizontal_table' && CONSENT_PARAGRAPH_IDS.has(paragraph.id)) {
          // generalInstitution: 동의/미동의 미선택으로 시작 (약관·동의 정책)
          return {
            ...paragraph,
            bottomConsent: isGeneralInstitution ? undefined : ('agree' as const),
          }
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
  }, [open, initialDraft.paragraphs, isGeneralInstitution, resetPluginValues])

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

    if (isGeneralInstitution) {
      const disagreedLabels = paragraphs
        .filter(
          paragraph =>
            paragraph.variant === 'horizontal_table' &&
            CONSENT_PARAGRAPH_IDS.has(paragraph.id) &&
            paragraph.bottomConsent === 'disagree'
        )
        .map(paragraph => paragraph.paragraphTitle)
      if (disagreedLabels.length > 0) {
        showAlert({
          title: REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
          content: buildRequiredConsentDisagreeAlertMessage(disagreedLabels),
        })
        return
      }
    }

    const built = buildVolunteerParticipantRegisterRequest({
      memberId: numericMemberId,
      paragraphs,
      pluginValues,
      hideBasicInfoSection: hideBasicInfoSection ?? false,
    })
    if (!built.ok) {
      // 필수 항목 미입력은 공통 「필수 항목 입력 안내」 모달로 통일. 길이 등 형식 오류만 개별 문구.
      showAlert(
        built.kind === 'required'
          ? {
              title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
              content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
            }
          : { title: '안내', content: built.message }
      )
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
