import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  exportIssuanceFormTemplateSeeds,
  exportWritingFormTemplateSeeds,
  getIssuanceFormSeedSpecsForExport,
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

describe('exportIssuanceFormTemplateSeeds', () => {
  it('exports P0 payment-order issuance seeds (2)', () => {
    expect(getIssuanceFormSeedSpecsForExport()).toHaveLength(2)
    expect(
      getIssuanceFormSeedSpecsForExport().map(s => s.templateCode).sort()
    ).toEqual(['document-payment-order-issue', 'document-payment-order-pre-consent'])
  })

  it('writes issuance seed json files with formType ISSUANCE', () => {
    const result = exportIssuanceFormTemplateSeeds()
    expect(result.exported).toBe(2)
    expect(result.files).toEqual([
      'document-payment-order-issue.json',
      'document-payment-order-pre-consent.json',
    ])

    for (const fileName of result.files) {
      const path = join(result.seedsDir, fileName)
      expect(existsSync(path)).toBe(true)
      const body = JSON.parse(readFileSync(path, 'utf8')) as {
        formType: string
        category: string
        schemaJson: { paragraphs: unknown[] }
        extensionJson: unknown
        settingsJson: unknown
      }
      expect(body.formType).toBe('ISSUANCE')
      expect(body.category).toBe('ISSUANCE')
      expect(body.schemaJson.paragraphs.length).toBeGreaterThan(0)
      expect(body.extensionJson).toEqual({ overlay: {}, editorState: {}, uiState: {} })
      expect(body.settingsJson).toBeNull()
    }
  })
})
