/**
 * 교육 진행 > 참여 봉사자 — 추가 등록 폼 섹션 렌더러 (로컬)
 */

import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { normalizeHorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/table/horizontal-table-paragraph-body'
import { resolveVolunteerConsentHorizontalTableInteractionProps } from '@/features/program/shared/lib/volunteer-add-registration-consent-horizontal-table'
import { UjatEducationProgressVolunteerBasicInfoSection } from './basic-info-section'
import {
  UjatVolunteerAddRegistrationSectionHeader,
  resolveUjatVolunteerSeedSectionDescription,
} from './add-registration-section-header'
import {
  UjatEducationProgressVolunteerTermsConsentSection,
  type UjatVolunteerAddRegistrationConsentState,
} from './terms-consent-section'
import { UjatEducationProgressVolunteerActivityTermSection } from './activity-term-section'
import {
  findVolunteerAddRegistrationParagraph,
  UJAT_VOLUNTEER_ADD_REGISTRATION_PLUGIN_BODIES,
  type UjatVolunteerAddRegistrationSectionDefinition,
} from './add-registration-form-section-config'

export type UjatVolunteerAddRegistrationFormSectionRendererProps = {
  section: UjatVolunteerAddRegistrationSectionDefinition
  vm: ProgramParticipantApplicationEditorViewModel
  memberId: string
  programId?: string | number | null
  consents: UjatVolunteerAddRegistrationConsentState
  onConsentsChange: (next: UjatVolunteerAddRegistrationConsentState) => void
}

function DraftParagraphSection({
  paragraph,
  vm,
}: {
  paragraph: WritingFormParagraph
  vm: ProgramParticipantApplicationEditorViewModel
}) {
  if (paragraph.variant !== 'horizontal_table') return null

  const hp = normalizeHorizontalTableParagraph(paragraph)
  const description = resolveUjatVolunteerSeedSectionDescription(hp.paragraphDescription)
  const tableInteraction = resolveVolunteerConsentHorizontalTableInteractionProps(
    hp.id,
    UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent
  )

  return (
    <section className="ujat-volunteer-add-registration__section">
      <UjatVolunteerAddRegistrationSectionHeader
        title={hp.paragraphTitle}
        required={hp.requiredMark}
        description={description}
      />
      <div className="ujat-volunteer-add-registration__template-block">
        <HorizontalTableParagraphBody
          paragraph={hp}
          onChange={next => vm.updateParagraph(hp.id, () => next)}
          {...tableInteraction}
        />
      </div>
    </section>
  )
}

function resolveDescriptionFromParagraph(
  paragraph: WritingFormParagraph | undefined,
  fallback?: string
): string | undefined {
  if (paragraph?.variant === 'horizontal_table') {
    const fromDraft = resolveUjatVolunteerSeedSectionDescription(paragraph.paragraphDescription)
    if (fromDraft) return fromDraft
  }
  return fallback
}

export function UjatVolunteerAddRegistrationFormSectionRenderer({
  section,
  vm,
  memberId,
  programId,
  consents,
  onConsentsChange,
}: UjatVolunteerAddRegistrationFormSectionRendererProps) {
  if (section.kind === 'plugin' && section.isVisible != null && !section.isVisible(vm)) {
    return null
  }

  switch (section.kind) {
    case 'basic-info': {
      const paragraph = findVolunteerAddRegistrationParagraph(vm, section.paragraphId)
      const description = resolveDescriptionFromParagraph(paragraph, section.fallbackDescription)
      return (
        <UjatEducationProgressVolunteerBasicInfoSection
          description={description}
          applicationType={vm.ujatVolunteerApplicationType}
          onApplicationTypeChange={vm.setUjatVolunteerApplicationType}
        />
      )
    }

    case 'draft-paragraph': {
      const paragraph = findVolunteerAddRegistrationParagraph(vm, section.paragraphId)
      if (!paragraph) return null
      return <DraftParagraphSection paragraph={paragraph} vm={vm} />
    }

    case 'terms-consent':
      return (
        <UjatEducationProgressVolunteerTermsConsentSection
          memberId={memberId}
          programId={programId}
          consents={consents}
          onConsentsChange={onConsentsChange}
        />
      )

    case 'plugin': {
      const PluginBody = UJAT_VOLUNTEER_ADD_REGISTRATION_PLUGIN_BODIES[section.body]
      const paragraph =
        section.paragraphId != null
          ? findVolunteerAddRegistrationParagraph(vm, section.paragraphId)
          : undefined
      const description =
        section.staticDescription ??
        resolveDescriptionFromParagraph(paragraph, section.fallbackDescription)

      return (
        <section className="ujat-volunteer-add-registration__section">
          <UjatVolunteerAddRegistrationSectionHeader
            title={section.title}
            required={section.required}
            description={description}
          />
          <PluginBody programId={programId} />
        </section>
      )
    }

    case 'activity-term':
      return <UjatEducationProgressVolunteerActivityTermSection />

    default:
      return null
  }
}
