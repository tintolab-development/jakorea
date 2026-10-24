import { describe, expect, it } from 'vitest'
import { EMPTY_WRITING_FORM_DRAFT } from './empty-writing-form-draft'
import {
  buildOperationalCatalogPreviewParagraphBodyOptions,
  resolveOperationalCatalogPreviewParagraphBodyOptions,
  resolveWritingTemplateSelectPreviewDraft,
  resolveWritingTemplateSelectPreviewEditorKind,
} from './operational-catalog-preview-paragraph-body-options'
import { createApplicantRecruitFormIndividualDraft } from '@/features/template/model/applicant-recruit-form-individual-draft'

describe('buildOperationalCatalogPreviewParagraphBodyOptions', () => {
  it('enables individual recruit specialized body', () => {
    const options = buildOperationalCatalogPreviewParagraphBodyOptions(
      'applicant-recruit-individual'
    )
    expect(options.applicantRecruitFormIndividual).toBe(true)
    expect(options.applicantRecruitFormInstitution).toBe(false)
    expect(options.applicantRecruitInstitutionTemplateAuthoringMode).toBe(true)
    expect(options.showInstitutionApplicationLimits).toBe(false)
  })

  it('enables institution recruit body with limits and authoring mode', () => {
    const options = buildOperationalCatalogPreviewParagraphBodyOptions(
      'applicant-recruit-institution'
    )
    expect(options.applicantRecruitFormInstitution).toBe(true)
    expect(options.showInstitutionApplicationLimits).toBe(true)
    expect(options.applicantRecruitInstitutionTemplateAuthoringMode).toBe(true)
    expect(options.applicantRecruitInstitutionLayoutVariant).toBeUndefined()
  })

  it('sets economy and trained-teachers recruit layout variants', () => {
    expect(
      buildOperationalCatalogPreviewParagraphBodyOptions('economy-recruit-institution')
        .applicantRecruitInstitutionLayoutVariant
    ).toBe('economy')
    expect(
      buildOperationalCatalogPreviewParagraphBodyOptions('trained-teachers-recruit-institution')
        .applicantRecruitInstitutionLayoutVariant
    ).toBe('trainedTeachers')
  })

  it('enables instructor application body as catalog authoring preview', () => {
    const options = buildOperationalCatalogPreviewParagraphBodyOptions('instructor')
    expect(options.programApplicationFormInstructor).toEqual({
      enabled: true,
      isTemplateAuthoringMode: true,
      readOnlyPreview: true,
    })
    expect(options.programApplicationFormVolunteer).toBeUndefined()
  })

  it('enables volunteer application body as catalog authoring preview', () => {
    const options = buildOperationalCatalogPreviewParagraphBodyOptions('volunteer')
    expect(options.programApplicationFormVolunteer).toEqual({
      enabled: true,
      isTemplateAuthoringMode: true,
      readOnlyPreview: true,
    })
  })

  it('enables school and individual application specialized bodies', () => {
    expect(
      buildOperationalCatalogPreviewParagraphBodyOptions('institution')
        .programApplicationFormInstitution
    ).toBe(true)
    expect(
      buildOperationalCatalogPreviewParagraphBodyOptions('individual')
        .programApplicationFormIndividual
    ).toBe(true)
  })
})

describe('resolveOperationalCatalogPreviewParagraphBodyOptions', () => {
  it('maps catalog and copy codes to the same flags', () => {
    const catalog = resolveOperationalCatalogPreviewParagraphBodyOptions(
      'recruitment-participant-individual'
    )
    const copy = resolveOperationalCatalogPreviewParagraphBodyOptions(
      'recruitment-participant-individual-copy-12',
      'recruitment-participant-individual'
    )
    expect(catalog?.applicantRecruitFormIndividual).toBe(true)
    expect(copy?.applicantRecruitFormIndividual).toBe(true)
    expect(resolveWritingTemplateSelectPreviewEditorKind('recruitment-participant-individual')).toBe(
      'horizontal_table'
    )
  })

  it('returns undefined for unknown template codes', () => {
    expect(resolveOperationalCatalogPreviewParagraphBodyOptions('survey-education')).toBeUndefined()
    expect(resolveWritingTemplateSelectPreviewEditorKind('survey-education')).toBeUndefined()
  })
})

describe('resolveWritingTemplateSelectPreviewDraft', () => {
  it('prefers a saved draft that has paragraphs', () => {
    const seed = createApplicantRecruitFormIndividualDraft()
    const saved = { ...seed, paragraphs: seed.paragraphs.slice(0, 1) }
    expect(resolveWritingTemplateSelectPreviewDraft(saved, seed)).toBe(saved)
  })

  it('falls back to seed when saved draft has no paragraphs', () => {
    const seed = createApplicantRecruitFormIndividualDraft()
    expect(resolveWritingTemplateSelectPreviewDraft(EMPTY_WRITING_FORM_DRAFT, seed)).toBe(seed)
    expect(resolveWritingTemplateSelectPreviewDraft(null, seed)).toBe(seed)
  })

  it('falls back to empty draft when both saved and seed are empty', () => {
    expect(resolveWritingTemplateSelectPreviewDraft(null, null)).toBe(EMPTY_WRITING_FORM_DRAFT)
    expect(
      resolveWritingTemplateSelectPreviewDraft(EMPTY_WRITING_FORM_DRAFT, EMPTY_WRITING_FORM_DRAFT)
    ).toBe(EMPTY_WRITING_FORM_DRAFT)
  })
})
