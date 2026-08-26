import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  buildDetailedProgramsSeedPayload,
  buildSponsorsSeedPayload,
  buildTextbooksSeedPayload,
  detailedProgramMockIdToSeedPk,
} from './build-data-management-seed'

const docsApiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../docs/api')

function payloadPath(name: string) {
  return resolve(docsApiDir, name)
}

function readJson(name: string) {
  return JSON.parse(readFileSync(payloadPath(name), 'utf8'))
}

describe('data-management seed payloads', () => {
  it('maps dp-* mock ids to reserved numeric PKs', () => {
    expect(detailedProgramMockIdToSeedPk('dp-131')).toBe(900131)
    expect(detailedProgramMockIdToSeedPk('dp-119')).toBe(900119)
  })

  it('sponsors payload matches LNB management-list mock', () => {
    const built = buildSponsorsSeedPayload()
    if (process.env.WRITE_DATA_MANAGEMENT_SEED === '1') {
      mkdirSync(docsApiDir, { recursive: true })
      writeFileSync(payloadPath('sponsors-seed.payload.json'), `${JSON.stringify(built, null, 2)}\n`)
    }
    const file = readJson('sponsors-seed.payload.json')
    expect(file.rows).toHaveLength(built.rows.length)
    expect(file.rows.map((r: { nameKo: string }) => r.nameKo)).toEqual(
      built.rows.map(r => r.nameKo)
    )
    expect(file.rows[0].seedKey).toBe('sponsor-list-001')
    expect(new Set(file.rows.map((r: { nameKo: string }) => r.nameKo)).size).toBe(file.rows.length)
    expect(file.detailSamples).toHaveLength(1)
    expect(file.detailSamples[0].contacts).toHaveLength(3)
    expect(file.detailSamples[0].yearlyBusinesses[0]).toMatchObject({
      donationAmount: 91_500_000,
      beneficiaryCount: 915,
    })
    expect(file.detailSamples[0].programHistories).toHaveLength(8)
    expect(file.detailSamples[0].programHistories.some((h: { participantType: string }) => h.participantType === 'volunteer')).toBe(
      true
    )
  })

  it('textbooks payload matches TEXTBOOK_LNB_SEED_ROWS', () => {
    const built = buildTextbooksSeedPayload()
    if (process.env.WRITE_DATA_MANAGEMENT_SEED === '1') {
      writeFileSync(payloadPath('textbooks-seed.payload.json'), `${JSON.stringify(built, null, 2)}\n`)
    }
    const file = readJson('textbooks-seed.payload.json')
    expect(file.rows).toHaveLength(22)
    expect(file.rows).toEqual(built.rows)
  })

  it('detailed-programs payload matches management-list mock + id map', () => {
    const built = buildDetailedProgramsSeedPayload()
    if (process.env.WRITE_DATA_MANAGEMENT_SEED === '1') {
      writeFileSync(
        payloadPath('detailed-programs-seed.payload.json'),
        `${JSON.stringify(built, null, 2)}\n`
      )
    }
    const file = readJson('detailed-programs-seed.payload.json')
    expect(file.rows).toEqual(built.rows)
    expect(file.meta.forbiddenSentinels).toEqual([
      '__detailed_program_none__',
      '__ujat_volunteer_core__',
    ])
    expect(file.rows.every((r: { suggestedNumericId: number }) => r.suggestedNumericId >= 900119)).toBe(
      true
    )
  })
})
