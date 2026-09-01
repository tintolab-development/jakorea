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
  it('exports writing form seeds excluding registration-general', () => {
    const specs = getWritingFormSeedSpecsForExport()
    expect(specs.some(s => s.templateCode === 'registration-general')).toBe(false)
    expect(specs.some(s => s.templateCode === 'recruitment-trained-teachers')).toBe(true)
    expect(specs.some(s => s.templateCode === 'recruitment-economy')).toBe(true)
    expect(specs).toHaveLength(31)
  })

  it('writes seed json files and handoff markdown', () => {
    const result = exportWritingFormTemplateSeeds()
    expect(result.exported).toBe(31)
  })
})

describe('exportIssuanceFormTemplateSeeds', () => {
  it('exports all 14 issuance form seeds', () => {
    expect(getIssuanceFormSeedSpecsForExport()).toHaveLength(14)
    expect(
      getIssuanceFormSeedSpecsForExport().map(s => s.templateCode)
    ).toEqual([
      'issuance-1',
      'issuance-2',
      'issuance-ujat-edu-journal',
      'issuance-3',
      'issuance-4',
      'issuance-5',
      'document-payment-order-issue',
      'document-payment-order-pre-consent',
      'document-1',
      'document-2',
      'document-3',
      'document-participation-certificate',
      'document-4',
      'document-5',
    ])
  })

  it('writes issuance seed json files and handoff markdown', () => {
    const result = exportIssuanceFormTemplateSeeds()
    expect(result.exported).toBe(14)
    expect(result.files).toHaveLength(14)
    expect(existsSync(result.handoffDocPath)).toBe(true)

    const payloadA = [
      'document-payment-order-issue.json',
      'document-payment-order-pre-consent.json',
      'issuance-2.json',
      'issuance-ujat-edu-journal.json',
      'issuance-3.json',
      'issuance-4.json',
    ]
    for (const fileName of payloadA) {
      const path = join(result.seedsDir, fileName)
      expect(existsSync(path)).toBe(true)
      const body = JSON.parse(readFileSync(path, 'utf8')) as {
        formType: string
        category: string
        schemaJson: { paragraphs: unknown[] }
        settingsJson: unknown
        _payload: string
      }
      expect(body.formType).toBe('ISSUANCE')
      expect(body.category).toBe('ISSUANCE')
      expect(body._payload).toBe('A')
      expect(body.schemaJson.paragraphs.length).toBeGreaterThan(0)
      expect(body.settingsJson).toBeNull()
    }

    const certPath = join(result.seedsDir, 'document-3-certificate.json')
    const cert = JSON.parse(readFileSync(certPath, 'utf8')) as {
      schemaJson: unknown
      settingsJson: { titleName: string }
      _payload: string
    }
    expect(cert._payload).toBe('D')
    expect(cert.schemaJson).toBeNull()
    expect(cert.settingsJson.titleName).toBe('수료증')

    const placeholder = JSON.parse(
      readFileSync(join(result.seedsDir, 'issuance-1.json'), 'utf8')
    ) as { _payload: string; schemaJson: { paragraphs: unknown[] } }
    expect(placeholder._payload).toBe('E')
    expect(placeholder.schemaJson.paragraphs).toEqual([])
  })
})
