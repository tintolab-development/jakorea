/**
 * 참여 봉사자 추가 등록 — 섹션 렌더러
 * draft 단락(가로표·객관식) + plugin 본문 통합 (UJAT 추가 등록과 동일)
 */

import type {
  HorizontalTableParagraph,
  MultipleChoiceParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { normalizeHorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/table/horizontal-table-paragraph-body'
import { MultipleChoice } from '@/features/template/ui/paragraph/single-item/multiple-choice'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS } from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import { resolveParticipatingVolunteerSeedSectionDescription } from './add-registration-section-header'
import {
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_PLUGIN_BODIES,
  type ParticipatingVolunteerAddRegistrationSectionContext,
  type ParticipatingVolunteerAddRegistrationSectionDefinition,
} from './add-registration-form-section-config'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

export type ParticipatingVolunteerAddRegistrationFormSectionRendererProps = {
  section: ParticipatingVolunteerAddRegistrationSectionDefinition
  paragraphs: WritingFormParagraph[]
  onParagraphChange: (id: string, next: WritingFormParagraph) => void
  sectionContext: ParticipatingVolunteerAddRegistrationSectionContext
}

function findParagraph(paragraphs: WritingFormParagraph[], paragraphId: string) {
  return paragraphs.find(p => p.id === paragraphId)
}

function resolveDescriptionFromParagraph(
  paragraph: WritingFormParagraph | undefined,
  fallback?: string
): string | undefined {
  if (
    paragraph?.variant === 'horizontal_table' ||
    paragraph?.variant === 'multiple_choice'
  ) {
    const fromDraft = resolveParticipatingVolunteerSeedSectionDescription(
      paragraph.paragraphDescription
    )
    if (fromDraft) return fromDraft
  }
  return fallback
}

function HorizontalTableDraftParagraphSection({
  paragraph,
  onChange,
}: {
  paragraph: HorizontalTableParagraph
  onChange: (next: HorizontalTableParagraph) => void
}) {
  const description = resolveParticipatingVolunteerSeedSectionDescription(paragraph.paragraphDescription)

  return (
    <section className="participating-volunteer-add-registration-modal__section">
      <FormParagraphSectionHeader
        title={paragraph.paragraphTitle}
        required={paragraph.requiredMark}
        description={description}
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

function MultipleChoiceDraftParagraphSection({
  paragraph,
  onChange,
}: {
  paragraph: MultipleChoiceParagraph
  onChange: (next: MultipleChoiceParagraph) => void
}) {
  const description = resolveParticipatingVolunteerSeedSectionDescription(paragraph.paragraphDescription)
  const isJaExperience =
    paragraph.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.jaVolunteerExperience

  return (
    <section
      className={[
        'participating-volunteer-add-registration-modal__section',
        isJaExperience
          ? 'participating-volunteer-add-registration-modal__section--multiple-choice-horizontal'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FormParagraphSectionHeader
        title={paragraph.paragraphTitle}
        required={paragraph.requiredMark}
        description={description}
        surface="responseEntry"
        titleAligned
      />
      <MultipleChoice
        paragraph={paragraph}
        onChange={onChange}
        isCardSelected={false}
        isBodyInteractive
        paragraphInteractionMode="user"
        itemsEditActive={false}
      />
    </section>
  )
}

export function ParticipatingVolunteerAddRegistrationFormSectionRenderer({
  section,
  paragraphs,
  onParagraphChange,
  sectionContext,
}: ParticipatingVolunteerAddRegistrationFormSectionRendererProps) {
  if (section.kind === 'plugin' && section.isVisible != null && !section.isVisible(sectionContext)) {
    return null
  }

  switch (section.kind) {
    case 'draft-paragraph': {
      const paragraph = findParagraph(paragraphs, section.paragraphId)
      if (!paragraph) return null

      if (paragraph.variant === 'horizontal_table') {
        const hp = normalizeHorizontalTableParagraph(paragraph)
        return (
          <HorizontalTableDraftParagraphSection
            paragraph={hp}
            onChange={next => onParagraphChange(section.paragraphId, next)}
          />
        )
      }

      if (paragraph.variant === 'multiple_choice') {
        return (
          <MultipleChoiceDraftParagraphSection
            paragraph={paragraph}
            onChange={next => onParagraphChange(section.paragraphId, next)}
          />
        )
      }

      return null
    }

    case 'plugin': {
      const PluginBody = PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_PLUGIN_BODIES[section.body]
      const paragraph =
        section.paragraphId != null ? findParagraph(paragraphs, section.paragraphId) : undefined
      const description =
        section.staticDescription ??
        resolveDescriptionFromParagraph(paragraph, section.fallbackDescription)

      return (
        <section
          className={[
            'participating-volunteer-add-registration-modal__section',
            section.body === 'basic-info'
              ? 'participating-volunteer-add-registration-modal__section--basic-info'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <FormParagraphSectionHeader
            title={section.title}
            required={section.required}
            description={description}
            surface="responseEntry"
            titleAligned
          />
          <PluginBody {...sectionContext} />
        </section>
      )
    }

    default:
      return null
  }
}
