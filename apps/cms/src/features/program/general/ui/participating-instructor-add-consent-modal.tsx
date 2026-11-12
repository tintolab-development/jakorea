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
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
} from '@jakorea/domain/shared/required-consent-alert'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import {
  PARTICIPATING_INSTRUCTOR_ADD_CONSENT_IDS,
  createGeneralInstitutionParticipatingInstructorAddConsentParagraphs,
  createParticipatingInstructorAddConsentParagraphs,
} from '@/features/program/general/lib/participating-instructor-add-consent-draft'
import { resolveVolunteerConsentHorizontalTableInteractionProps } from '@/features/program/shared/lib/volunteer-add-registration-consent-horizontal-table'
import '@/features/template/ui/form-editor/form-editor-horizontal-table.css'
import './participating-instructor-add-consent-modal.css'

/**
 * - `default` — 기존 동작(동의 기본 선택, 기존 문구). 1사1교·개인형 등 다른 호출부 기본값.
 * - `generalInstitution` — 일반 프로그램(기관형) Figma 03-2: 시안 문구, 동의 미선택 시작,
 *   제3자 「제공받는 곳」 입력, 미선택·미동의 시 필수 안내.
 */
export type ParticipatingInstructorAddConsentPreset = 'default' | 'generalInstitution'

export interface ParticipatingInstructorAddConsentModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  preset?: ParticipatingInstructorAddConsentPreset
}

function ConsentParagraphSection({
  paragraph,
  onChange,
  recipientEditable,
}: {
  paragraph: HorizontalTableParagraph
  onChange: (next: HorizontalTableParagraph) => void
  /** 제3자 표 「제공받는 곳」(0열) 입력 허용 — generalInstitution preset */
  recipientEditable: boolean
}) {
  const recipientInteraction = recipientEditable
    ? resolveVolunteerConsentHorizontalTableInteractionProps(
        paragraph.id,
        PARTICIPATING_INSTRUCTOR_ADD_CONSENT_IDS.thirdPartyConsent
      )
    : null
  return (
    <section className="participating-instructor-add-consent-modal__section">
      <FormParagraphSectionHeader
        title={paragraph.paragraphTitle}
        required={paragraph.requiredMark}
        surface="responseEntry"
        titleAligned
      />
      <div className="participating-instructor-add-consent-modal__template-block">
        {recipientInteraction ? (
          <HorizontalTableParagraphBody
            paragraph={paragraph}
            onChange={onChange}
            {...recipientInteraction}
          />
        ) : (
          <HorizontalTableParagraphBody
            paragraph={paragraph}
            onChange={onChange}
            isEditMode={false}
            tableCanvasInteractive={false}
            lockColumnHeaders
            bottomConsentPreviewInAuthoring
            paragraphInteractionMode="user"
          />
        )}
      </div>
    </section>
  )
}

export function ParticipatingInstructorAddConsentModal({
  open,
  onClose,
  onConfirm,
  preset = 'default',
}: ParticipatingInstructorAddConsentModalProps) {
  const { showAlert } = useCmsAlert()
  const isGeneralInstitution = preset === 'generalInstitution'
  const initialParagraphs = useMemo(
    () =>
      isGeneralInstitution
        ? createGeneralInstitutionParticipatingInstructorAddConsentParagraphs()
        : createParticipatingInstructorAddConsentParagraphs(),
    [isGeneralInstitution]
  )
  const [paragraphs, setParagraphs] = useState(initialParagraphs)

  useEffect(() => {
    if (!open) return
    // 모든 프리셋이 동의/미동의 미선택으로 시작 (약관·동의 정책, QA-0116). 기본 프리셋은 「모두 동의」 검사가 막는다.
    setParagraphs(initialParagraphs.map(paragraph => ({ ...paragraph, bottomConsent: undefined })))
  }, [open, initialParagraphs])

  const updateParagraph = (id: string, next: HorizontalTableParagraph) => {
    setParagraphs(prev => prev.map(paragraph => (paragraph.id === id ? next : paragraph)))
  }

  const handleConfirm = () => {
    if (isGeneralInstitution) {
      const unset = paragraphs.some(
        paragraph => paragraph.bottomConsent !== 'agree' && paragraph.bottomConsent !== 'disagree'
      )
      if (unset) {
        showAlert({
          title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
          content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
        })
        return
      }
      const disagreedLabels = paragraphs
        .filter(paragraph => paragraph.bottomConsent === 'disagree')
        .map(paragraph => paragraph.paragraphTitle)
      if (disagreedLabels.length > 0) {
        showAlert({
          title: REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
          content: buildRequiredConsentDisagreeAlertMessage(disagreedLabels),
        })
        return
      }
      onConfirm()
      return
    }
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
              recipientEditable={isGeneralInstitution}
            />
          ))}
        </div>
      </div>
    </ContentModal>
  )
}
