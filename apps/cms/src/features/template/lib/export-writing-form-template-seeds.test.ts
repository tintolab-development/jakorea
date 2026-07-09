import { describe, expect, it } from 'vitest'
import {
  exportWritingFormTemplateSeeds,
  getWritingFormSeedSpecsForExport,
} from '@/features/template/lib/export-writing-form-template-seeds'

describe('exportWritingFormTemplateSeeds', () => {
  it('exports 28 writing form seeds excluding registration-general', () => {
    expect(getWritingFormSeedSpecsForExport()).toHaveLength(28)
    expect(getWritingFormSeedSpecsForExport().some(s => s.templateCode === 'registration-general')).toBe(
      false
    )
  })

  it('writes seed json files and handoff markdown', () => {
    const result = exportWritingFormTemplateSeeds()
    expect(result.exported).toBe(28)
  })
})
