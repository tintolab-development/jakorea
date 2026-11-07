import { describe, expect, it } from 'vitest'
import {
  buildLocalDuplicateWritingTemplateCode,
  canReorderParticipantApplicationParagraphs,
  isCatalogFixedWritingFormTemplateCode,
  isCatalogOriginalVersionWriteBlocked,
  isCatalogSurveyOrGeneralAgreementTemplateCode,
  isCertificateIssuanceTemplatePublishTarget,
  isSurveyOrGeneralAgreementPublishTarget,
  isDocumentOnlyAgreementTemplateCode,
  isDuplicateWritingTemplateCode,
  isProgramScopedOperationalWritingTemplate,
  isRecruitmentOrApplicationWritingTemplateCode,
  isUserCreatedWritingFormTemplateRow,
  isWritingFormTemplateStructureLocked,
  resolveWritingFormTemplateDeletable,
  shouldOmitImmutableFormSchemaJson,
  shouldShowWritingFormTemplateDeleteButton,
} from '@/features/template/lib/form-template-delete-policy'
import {
  resolveAgreementWritingFormConfig,
  stripAgreementWritingFormStructureLocks,
} from '@/features/template/model/template-registry/agreement-template-config-registry'

describe('form-template-delete-policy', () => {
  it('uses immutable schema path for registration and recruitment PUT', () => {
    expect(shouldOmitImmutableFormSchemaJson('registration-trained-teachers')).toBe(true)
    expect(shouldOmitImmutableFormSchemaJson('registration-trained-teachers-copy-1')).toBe(true)
    expect(shouldOmitImmutableFormSchemaJson('recruitment-participant-school')).toBe(true)
    expect(shouldOmitImmutableFormSchemaJson('recruitment-participant-school-custom-01')).toBe(
      true
    )
    expect(shouldOmitImmutableFormSchemaJson('application-participant-school')).toBe(false)
    expect(shouldOmitImmutableFormSchemaJson('application-participant-individual')).toBe(true)
    expect(shouldOmitImmutableFormSchemaJson('application-participant-individual-copy-99')).toBe(
      true
    )
    expect(shouldOmitImmutableFormSchemaJson('application-ujat-volunteer')).toBe(true)
    expect(shouldOmitImmutableFormSchemaJson('application-ujat-volunteer-copy-1')).toBe(true)
    expect(shouldOmitImmutableFormSchemaJson('application-ujat-school')).toBe(true)
    expect(shouldOmitImmutableFormSchemaJson('agreement-portrait')).toBe(false)
  })

  it('allows new catalog survey and general agreement versions but blocks operational originals', () => {
    expect(isCatalogSurveyOrGeneralAgreementTemplateCode('survey-default')).toBe(true)
    expect(isCatalogSurveyOrGeneralAgreementTemplateCode('agreement-third-party')).toBe(true)
    expect(isCatalogSurveyOrGeneralAgreementTemplateCode('agreement-receipt-pre-consent')).toBe(
      true
    )
    expect(isCatalogSurveyOrGeneralAgreementTemplateCode('agreement-crime')).toBe(false)
    expect(isCatalogOriginalVersionWriteBlocked('registration-general')).toBe(true)
    expect(isCatalogOriginalVersionWriteBlocked('recruitment-instructor')).toBe(true)
    expect(isCatalogOriginalVersionWriteBlocked('application-participant-school')).toBe(true)
    expect(isCatalogOriginalVersionWriteBlocked('survey-default')).toBe(false)
    expect(isDocumentOnlyAgreementTemplateCode('agreement-crime')).toBe(true)
    expect(isCatalogOriginalVersionWriteBlocked('agreement-crime')).toBe(true)
    expect(isSurveyOrGeneralAgreementPublishTarget('survey-default')).toBe(true)
    expect(isSurveyOrGeneralAgreementPublishTarget('survey-student-copy-1')).toBe(true)
    expect(
      isSurveyOrGeneralAgreementPublishTarget('copy-abc', { baseTemplateCode: 'survey-student' })
    ).toBe(true)
    expect(isSurveyOrGeneralAgreementPublishTarget('issuance-3')).toBe(false)
    expect(isSurveyOrGeneralAgreementPublishTarget('registration-general')).toBe(false)
    expect(isSurveyOrGeneralAgreementPublishTarget('agreement-crime')).toBe(false)
    expect(isCertificateIssuanceTemplatePublishTarget('document-participation-certificate')).toBe(
      true
    )
    expect(isCertificateIssuanceTemplatePublishTarget('document-3')).toBe(true)
    expect(isCertificateIssuanceTemplatePublishTarget('issuance-3')).toBe(false)
  })

  it('identifies catalog-fixed template codes', () => {
    expect(isCatalogFixedWritingFormTemplateCode('agreement-portrait')).toBe(true)
    expect(isCatalogFixedWritingFormTemplateCode('agreement-portrait-copy-01')).toBe(false)
    expect(isCatalogFixedWritingFormTemplateCode('survey-custom-20260824-01')).toBe(false)
  })

  it('treats systemTemplate=false as user-editable even for catalog code', () => {
    expect(
      isWritingFormTemplateStructureLocked({
        templateCode: 'agreement-portrait',
        systemTemplate: false,
      })
    ).toBe(false)
  })

  it('allows edit when forceUserEditable after duplicate', () => {
    expect(
      isWritingFormTemplateStructureLocked({
        templateCode: 'agreement-portrait',
        forceUserEditable: true,
      })
    ).toBe(false)
  })

  it('treats duplicate copy codes as user-editable without URL flag', () => {
    expect(isDuplicateWritingTemplateCode('agreement-portrait-copy-1735689600123')).toBe(true)
    expect(isDuplicateWritingTemplateCode('agreement-portrait-copy')).toBe(true)
    expect(
      isWritingFormTemplateStructureLocked({
        templateCode: 'agreement-portrait-copy-1735689600123',
      })
    ).toBe(false)
  })

  it('locks recruitment and application copies like the registration wizard', () => {
    expect(isRecruitmentOrApplicationWritingTemplateCode('application-instructor')).toBe(true)
    expect(
      isRecruitmentOrApplicationWritingTemplateCode('recruitment-participant-school-custom-01')
    ).toBe(true)
    expect(
      isWritingFormTemplateStructureLocked({
        templateCode: 'recruitment-instructor-custom-01',
        systemTemplate: false,
        forceUserEditable: true,
      })
    ).toBe(true)
    expect(
      isWritingFormTemplateStructureLocked({
        templateCode: 'recruitment-participant-school-copy-99',
        systemTemplate: false,
      })
    ).toBe(true)
    expect(
      isWritingFormTemplateStructureLocked({
        templateCode: 'application-participant-individual-copy-1735689600123',
        systemTemplate: false,
        forceUserEditable: true,
      })
    ).toBe(true)
    expect(
      isWritingFormTemplateStructureLocked({
        templateCode: 'application-volunteer-custom-01',
        systemTemplate: false,
      })
    ).toBe(true)
  })

  it('allows application reorder while locking recruitment reorder', () => {
    expect(
      canReorderParticipantApplicationParagraphs({
        structureLocked: true,
        recruitmentForm: false,
      })
    ).toBe(true)
    expect(
      canReorderParticipantApplicationParagraphs({
        structureLocked: true,
        recruitmentForm: true,
      })
    ).toBe(false)
    expect(
      canReorderParticipantApplicationParagraphs({
        structureLocked: false,
        recruitmentForm: true,
      })
    ).toBe(true)
  })

  it('never locks catalog survey templates', () => {
    expect(
      isWritingFormTemplateStructureLocked({
        templateCode: 'survey-default',
        systemTemplate: true,
      })
    ).toBe(false)
    expect(
      isWritingFormTemplateStructureLocked({
        templateCode: 'survey-admin',
        systemTemplate: true,
      })
    ).toBe(false)
  })

  it('treats user-created list rows as editable', () => {
    expect(
      isUserCreatedWritingFormTemplateRow({
        id: 'agreement-portrait',
        systemTemplate: false,
      })
    ).toBe(true)
    expect(
      isUserCreatedWritingFormTemplateRow({
        id: 'agreement-portrait-copy-1',
        creator: '사용자 생성',
      })
    ).toBe(true)
  })

  it('builds local duplicate template codes', () => {
    expect(buildLocalDuplicateWritingTemplateCode('agreement-portrait')).toMatch(
      /^agreement-portrait-copy-\d+$/
    )
  })

  it('hides only registration operational copies from template management', () => {
    expect(
      isProgramScopedOperationalWritingTemplate({
        templateCode: 'registration-general-copy-1735689600123',
        category: 'REGISTRATION',
      })
    ).toBe(true)
    expect(
      isProgramScopedOperationalWritingTemplate({
        templateCode: 'application-participant-individual-copy-1735689600123',
        category: 'APPLICATION',
      })
    ).toBe(false)
    expect(
      isProgramScopedOperationalWritingTemplate({
        templateCode: 'recruitment-instructor-copy-1',
        category: 'RECRUITMENT',
      })
    ).toBe(false)
    expect(
      isProgramScopedOperationalWritingTemplate({
        templateCode: 'application-participant-individual',
        category: 'APPLICATION',
      })
    ).toBe(false)
    expect(
      isProgramScopedOperationalWritingTemplate({
        templateCode: 'survey-custom-20260824-01',
        category: 'SURVEY',
      })
    ).toBe(false)
  })
  it('treats system templates as non-deletable', () => {
    expect(
      resolveWritingFormTemplateDeletable({
        id: 'registration-general',
        systemTemplate: true,
      })
    ).toBe(false)
  })

  it('treats user-created templates as deletable', () => {
    expect(
      resolveWritingFormTemplateDeletable({
        id: 'survey-custom-20260824-01',
        systemTemplate: false,
      })
    ).toBe(true)
  })

  it('uses availableActions DELETE when systemTemplate is omitted', () => {
    expect(
      resolveWritingFormTemplateDeletable({
        id: 'application-instructor',
        availableActions: ['DELETE'],
      })
    ).toBe(true)
  })

  it('hides delete without remote API', () => {
    expect(
      shouldShowWritingFormTemplateDeleteButton(
        { id: 'survey-custom-01', systemTemplate: false },
        false
      )
    ).toBe(false)
  })
})

describe('resolveAgreementWritingFormConfig', () => {
  it('keeps structure locks for catalog agreement templates', () => {
    const config = resolveAgreementWritingFormConfig('agreement-portrait')
    expect(config?.structureLockedParagraphIds).toBeDefined()
    expect(config?.paragraphBodyOptions).toBeDefined()
  })

  it('strips structure locks for user-created agreement copies', () => {
    const config = resolveAgreementWritingFormConfig('agreement-portrait-copy-01')
    expect(config?.initialDraft).toBeDefined()
    expect(config?.structureLockedParagraphIds).toBeUndefined()
    expect(config?.hideDragHandleForParagraphIds).toBeUndefined()
    expect(config?.paragraphBodyOptions?.agreementAdminProxyConfirm).toBe(true)
  })

  it('strips structure locks for agreement-portrait-copy without numeric suffix', () => {
    const config = resolveAgreementWritingFormConfig('agreement-portrait-copy')
    expect(config?.structureLockedParagraphIds).toBeUndefined()
  })

  it('locks catalog agreement-notice table and unlocks user copies', () => {
    const catalog = resolveAgreementWritingFormConfig('agreement-notice')
    expect(catalog?.structureLockedParagraphIds?.has('agreement-notice-table')).toBe(true)
    const copy = resolveAgreementWritingFormConfig('agreement-notice-copy-01')
    expect(copy?.structureLockedParagraphIds).toBeUndefined()
  })

  it('strips locks from catalog config when opened as user template', () => {
    const catalog = resolveAgreementWritingFormConfig('agreement-portrait')
    expect(catalog?.structureLockedParagraphIds).toBeDefined()
    const editable = stripAgreementWritingFormStructureLocks(catalog!)
    expect(editable.structureLockedParagraphIds).toBeUndefined()
    expect(editable.hideDragHandleForParagraphIds).toBeUndefined()
    expect(editable.paragraphBodyOptions?.agreementAdminProxyConfirm).toBe(true)
    expect(editable.paragraphBodyOptions?.structureLockedAuthoringChoicePreview).toBeUndefined()
    expect(editable.paragraphBodyOptions?.documentPreviewClassName).toBe(
      catalog!.paragraphBodyOptions?.documentPreviewClassName
    )
  })

  it('keeps payment-statement authoring values when unlocking catalog inputs', () => {
    const catalog = resolveAgreementWritingFormConfig('agreement-third-party')
    const editable = stripAgreementWritingFormStructureLocks(catalog!)
    expect(editable.structureLockedParagraphIds).toBeUndefined()
    expect(editable.paragraphBodyOptions?.paymentStatementBasicInfoValues).toEqual(
      catalog!.paragraphBodyOptions?.paymentStatementBasicInfoValues
    )
    expect(editable.paragraphBodyOptions?.structureLockedAuthoringChoicePreview).toBeUndefined()
  })
})
