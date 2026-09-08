import { describe, expect, it } from 'vitest'
import {
  buildLocalDuplicateWritingTemplateCode,
  isCatalogFixedWritingFormTemplateCode,
  isDuplicateWritingTemplateCode,
  isUserCreatedWritingFormTemplateRow,
  isWritingFormTemplateStructureLocked,
  resolveWritingFormTemplateDeletable,
  shouldShowWritingFormTemplateDeleteButton,
} from '@/features/template/lib/form-template-delete-policy'
import {
  resolveAgreementWritingFormConfig,
  stripAgreementWritingFormStructureLocks,
} from '@/features/template/model/template-registry/agreement-template-config-registry'

describe('form-template-delete-policy', () => {
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
    expect(config?.paragraphBodyOptions).toBeUndefined()
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
    expect(editable.paragraphBodyOptions).toBeUndefined()
  })
})
