import { afterEach, describe, expect, it } from 'vitest'
import {
  clearFormTemplateVersionCache,
  upsertFormTemplateVersionCacheEntry,
} from '@/features/template/api/form-template-version-cache'
import {
  lookupWritingTemplateRegistry,
  resolveWritingTemplateDisplayName,
} from './lookup-writing-template-registry'

describe('lookupWritingTemplateRegistry', () => {
  afterEach(() => {
    clearFormTemplateVersionCache()
  })

  it('returns the catalog entry for a catalog code', () => {
    const entry = lookupWritingTemplateRegistry('recruitment-participant-school')
    expect(entry?.editorVariant).toBe('applicant-recruit-institution')
    expect(entry?.id).toBe('recruitment-participant-school')
  })

  it('maps copy/custom suffix codes to the catalog editor while keeping the actual id', () => {
    const copy = lookupWritingTemplateRegistry('recruitment-participant-school-custom-3')
    expect(copy?.editorVariant).toBe('applicant-recruit-institution')
    expect(copy?.id).toBe('recruitment-participant-school-custom-3')
  })

  it('maps unique server codes via cached baseTemplateCode', () => {
    upsertFormTemplateVersionCacheEntry({
      templateCode: 'tmpl_unique_recruit',
      templateId: 42,
      baseTemplateCode: 'recruitment-participant-school',
      templateName: '일반_참여 기관 모집 폼 (복사)',
    })
    const entry = lookupWritingTemplateRegistry('tmpl_unique_recruit')
    expect(entry?.editorVariant).toBe('applicant-recruit-institution')
    expect(entry?.id).toBe('tmpl_unique_recruit')
    expect(resolveWritingTemplateDisplayName('tmpl_unique_recruit')).toBe(
      '일반_참여 기관 모집 폼 (복사)'
    )
  })

  it('returns undefined for unknown codes', () => {
    expect(lookupWritingTemplateRegistry('not-a-template')).toBeUndefined()
  })
})
