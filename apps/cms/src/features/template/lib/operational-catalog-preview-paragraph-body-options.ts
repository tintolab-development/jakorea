import type { ProgramParticipantApplicationEditorVariant } from '@jakorea/form-schema/template-registry'
import { EMPTY_WRITING_FORM_DRAFT } from '@/features/template/lib/empty-writing-form-draft'
import { getParticipantApplicationEditorVariantForTemplateCode } from '@/features/template/lib/participant-application-template-id'
import type { FormEditorKind, WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

function isInstitutionRecruitVariant(
  variant: ProgramParticipantApplicationEditorVariant
): boolean {
  return (
    variant === 'applicant-recruit-institution' ||
    variant === 'economy-recruit-institution' ||
    variant === 'trained-teachers-recruit-institution'
  )
}

function isRecruitmentCatalogVariant(
  variant: ProgramParticipantApplicationEditorVariant
): boolean {
  return (
    isInstitutionRecruitVariant(variant) ||
    variant === 'ujat-recruit-institution' ||
    variant === 'applicant-recruit-individual' ||
    variant === 'recruit-instructor' ||
    variant === 'recruit-volunteer' ||
    variant === 'ujat-recruit-volunteer' ||
    variant === 'gemini-recruit'
  )
}

const CATALOG_PREVIEW_AUTHORING = {
  enabled: true as const,
  isTemplateAuthoringMode: true as const,
  readOnlyPreview: true as const,
}

function noopUjatVolunteerApplicationTypeChange(): void {
  /* 카탈로그 미리보기 — 유형 전환 없음 */
}

/**
 * 등록 위저드 템플릿 선택 미리보기용 전용 단락 플래그.
 * 양식 관리 `leftPanelParagraphBodyOptions`와 enable 집합을 맞추되, 프로그램 연동·숨김 단락은 넣지 않는다.
 */
export function buildOperationalCatalogPreviewParagraphBodyOptions(
  variant: ProgramParticipantApplicationEditorVariant
): RenderFormParagraphBodyOptions {
  const isInstitutionRecruit = isInstitutionRecruitVariant(variant)

  return {
    programApplicationFormInstitution: variant === 'institution',
    programApplicationFormEconomyInstitution:
      variant === 'economy-application-institution'
        ? {
            enabled: true as const,
            isTemplateAuthoringMode: true as const,
            choiceDisplayOnly: true as const,
          }
        : undefined,
    programApplicationFormTrainedTeachersInstitution:
      variant === 'trained-teachers-application-institution',
    programApplicationFormGeminiInstitution: variant === 'gemini-application-institution',
    programApplicationFormGeminiInstructor:
      variant === 'gemini-application-instructor' ? CATALOG_PREVIEW_AUTHORING : undefined,
    ujatProgramApplicationFormInstitution: variant === 'ujat-application-institution',
    ujatProgramApplicationFormVolunteer:
      variant === 'ujat-application-volunteer'
        ? {
            enabled: true as const,
            applicationType: 'ujat-graduate',
            onApplicationTypeChange: noopUjatVolunteerApplicationTypeChange,
            isTemplateAuthoringMode: true as const,
          }
        : undefined,
    applicantRecruitFormInstitution: variant === 'applicant-recruit-institution',
    economyRecruitFormInstitution: variant === 'economy-recruit-institution',
    trainedTeachersRecruitFormInstitution: variant === 'trained-teachers-recruit-institution',
    showInstitutionApplicationLimits: isInstitutionRecruit,
    applicantRecruitInstitutionLayoutVariant:
      variant === 'economy-recruit-institution'
        ? 'economy'
        : variant === 'trained-teachers-recruit-institution'
          ? 'trainedTeachers'
          : undefined,
    applicantRecruitInstitutionTemplateAuthoringMode: isRecruitmentCatalogVariant(variant),
    applicantRecruitFormIndividual: variant === 'applicant-recruit-individual',
    recruitFormInstructor: variant === 'recruit-instructor',
    recruitFormVolunteer: variant === 'recruit-volunteer',
    geminiRecruitForm: variant === 'gemini-recruit',
    ujatRecruitFormInstitution: variant === 'ujat-recruit-institution',
    ujatRecruitFormVolunteer: variant === 'ujat-recruit-volunteer',
    programApplicationFormIndividual: variant === 'individual',
    programApplicationFormInstructor:
      variant === 'instructor' ? CATALOG_PREVIEW_AUTHORING : undefined,
    programApplicationFormVolunteer:
      variant === 'volunteer' ||
      variant === 'recruit-volunteer' ||
      variant === 'ujat-recruit-volunteer'
        ? CATALOG_PREVIEW_AUTHORING
        : undefined,
  }
}

export function resolveOperationalCatalogPreviewParagraphBodyOptions(
  templateCode: string | undefined | null,
  baseTemplateCode?: string | null
): RenderFormParagraphBodyOptions | undefined {
  const variant = getParticipantApplicationEditorVariantForTemplateCode(
    templateCode,
    baseTemplateCode
  )
  if (variant == null) return undefined
  return buildOperationalCatalogPreviewParagraphBodyOptions(variant)
}

export function resolveWritingTemplateSelectPreviewEditorKind(
  templateCode: string | undefined | null,
  baseTemplateCode?: string | null
): FormEditorKind | undefined {
  const variant = getParticipantApplicationEditorVariantForTemplateCode(
    templateCode,
    baseTemplateCode
  )
  return variant == null ? undefined : 'horizontal_table'
}

export function resolveWritingTemplateSelectPreviewDraft(
  savedDraft: WritingFormDraft | null | undefined,
  seed: WritingFormDraft | null | undefined
): WritingFormDraft {
  if (savedDraft != null && savedDraft.paragraphs.length > 0) return savedDraft
  if (seed != null && seed.paragraphs.length > 0) return seed
  return EMPTY_WRITING_FORM_DRAFT
}
