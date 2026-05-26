/**
 * 교육 진행 > 참여 봉사자 — 추가 등록 폼 섹션 렌더러 (로컬)
 * draft 단락 본문(`renderFormParagraphBody`) + 전용 plugin·custom 섹션 통합
 */

import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { normalizeHorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { renderFormParagraphBody } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { UjatEducationProgressVolunteerBasicInfoSection } from './basic-info-section'
import {
  UjatVolunteerAddRegistrationSectionHeader,
  resolveUjatVolunteerSeedSectionDescription,
} from './add-registration-section-header'
import { UjatEducationProgressVolunteerTermsConsentSection } from './terms-consent-section'
import { UjatEducationProgressVolunteerActivityTermSection } from './activity-term-section'
import {
  findVolunteerAddRegistrationParagraph,
  UJAT_VOLUNTEER_ADD_REGISTRATION_PLUGIN_BODIES,
  type UjatVolunteerAddRegistrationSectionDefinition,
} from './add-registration-form-section-config'

export type UjatVolunteerAddRegistrationFormSectionRendererProps = {
  section: UjatVolunteerAddRegistrationSectionDefinition
  vm: ProgramParticipantApplicationEditorViewModel
}

function buildRenderParagraphBodyOptions(vm: ProgramParticipantApplicationEditorViewModel) {
  return {
    structureLockedParagraphIds: vm.structureLockedParagraphIds,
    structureLockedAuthoringChoicePreview: true as const,
    paragraphInteractionMode: 'user' as const,
    ujatProgramApplicationFormVolunteer: {
      enabled: true,
      applicationType: vm.ujatVolunteerApplicationType,
      onApplicationTypeChange: vm.setUjatVolunteerApplicationType,
    },
    hiddenParagraphIds: vm.ujatVolunteerApplicationType === 'new' ? new Set<string>() : undefined,
  }
}

function renderDraftParagraphBody(
  paragraph: WritingFormParagraph,
  vm: ProgramParticipantApplicationEditorViewModel
) {
  return renderFormParagraphBody(paragraph, vm.updateParagraph, true, 'horizontal_table', {
    ...buildRenderParagraphBodyOptions(vm),
  })
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
  const body = renderDraftParagraphBody(paragraph, vm)

  return (
    <section className="ujat-volunteer-add-registration__section">
      <UjatVolunteerAddRegistrationSectionHeader
        title={hp.paragraphTitle}
        required={hp.requiredMark}
        description={description}
      />
      <div className="ujat-volunteer-add-registration__template-block">{body}</div>
    </section>
  )
}

export function UjatVolunteerAddRegistrationFormSectionRenderer({
  section,
  vm,
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
      return <UjatEducationProgressVolunteerTermsConsentSection />

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
          <PluginBody />
        </section>
      )
    }

    case 'activity-term':
      return <UjatEducationProgressVolunteerActivityTermSection />

    default:
      return null
  }
}
