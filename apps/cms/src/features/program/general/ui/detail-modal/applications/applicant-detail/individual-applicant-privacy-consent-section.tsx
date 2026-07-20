/**
 * 개인 참여자 신청 상세 — 개인정보 수집·이용 / 제3자 제공 동의 (조회)
 */

import { useMemo } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { normalizeHorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  createProgramParticipantApplicationDraft,
  PROGRAM_PARTICIPANT_APPLICATION_IDS,
} from '@/features/template/model/program-application-form-individual-draft'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/table/horizontal-table-paragraph-body'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import '@/features/template/ui/form-editor/form-editor-horizontal-table.css'
import './individual-applicant-privacy-consent-section.css'

export type IndividualApplicantConsentValue = 'agree' | 'disagree'

function ConsentParagraphView({
  paragraph,
  consent,
}: {
  paragraph: HorizontalTableParagraph
  consent: IndividualApplicantConsentValue
}) {
  const normalized = useMemo(
    () =>
      normalizeHorizontalTableParagraph({
        ...paragraph,
        bottomConsent: consent,
      }),
    [paragraph, consent]
  )

  return (
    <section className="individual-applicant-privacy-consent-section">
      <FormParagraphSectionHeader
        title={normalized.paragraphTitle}
        required={normalized.requiredMark}
        surface="responseEntry"
        titleAligned
      />
      <div className="individual-applicant-privacy-consent-section__template-block">
        <HorizontalTableParagraphBody
          paragraph={normalized}
          onChange={() => {}}
          isEditMode={false}
          tableCanvasInteractive={false}
          bottomConsentPreviewInAuthoring
          paragraphInteractionMode="user"
        />
      </div>
    </section>
  )
}

export function IndividualApplicantPrivacyConsentSection({
  personalInfoConsent = 'agree',
  thirdPartyConsent = 'agree',
}: {
  personalInfoConsent?: IndividualApplicantConsentValue
  thirdPartyConsent?: IndividualApplicantConsentValue
}) {
  const paragraphs = useMemo(() => {
    const draft = createProgramParticipantApplicationDraft()
    return {
      personalInfo: draft.paragraphs.find(
        p => p.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection
      ),
      thirdParty: draft.paragraphs.find(
        p => p.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent
      ),
    }
  }, [])

  if (
    paragraphs.personalInfo?.variant !== 'horizontal_table' ||
    paragraphs.thirdParty?.variant !== 'horizontal_table'
  ) {
    return null
  }

  return (
    <div className="individual-applicant-privacy-consent-sections">
      <ConsentParagraphView
        paragraph={paragraphs.personalInfo}
        consent={personalInfoConsent}
      />
      <ConsentParagraphView paragraph={paragraphs.thirdParty} consent={thirdPartyConsent} />
    </div>
  )
}
