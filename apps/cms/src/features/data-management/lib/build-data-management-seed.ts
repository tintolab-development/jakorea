import detailedProgramsSeedPayload from '../../../../docs/api/detailed-programs-seed.payload.json'
import { TEXTBOOK_LNB_SEED_ROWS } from '@/features/textbook/api/textbook-lnb-seed-catalog'

export function detailedProgramMockIdToSeedPk(mockId: string): number {
  const m = /^dp-(\d+)$/.exec(mockId)
  if (!m) throw new Error(`unexpected detailed program mock id: ${mockId}`)
  return 900_000 + Number(m[1])
}

export function getSponsorDetailSampleListRow(): null {
  return null
}

export interface SponsorsSeedRow {
  nameKo: string
  seedKey?: string
}

export interface SponsorsSeedPayload {
  meta: Record<string, unknown>
  rows: SponsorsSeedRow[]
  detailSamples: Array<Record<string, unknown>>
}

export function buildSponsorsSeedPayload(): SponsorsSeedPayload {
  return {
    meta: {
      domain: 'sponsors',
      ssot: 'remote API export',
      detailSsot: 'remote API export',
      note: 'FE mock removed — export from staging API.',
      upsertKeys: ['nameKoNormalized', 'businessRegistrationNumber'],
      childSeedOrder: ['contacts', 'yearlyBusinesses', 'programHistories'],
    },
    rows: [],
    detailSamples: [],
  }
}

export function buildTextbooksSeedPayload() {
  return {
    meta: {
      domain: 'textbooks',
      ssot: 'apps/cms/src/features/textbook/api/textbook-lnb-seed-catalog.ts TEXTBOOK_LNB_SEED_ROWS',
      upsertKeys: ['nameKo', 'businessArea', 'educationTarget', 'grade'],
      materialKitPolicy: 'global kit only (textbookId null) — do not clone kit per textbook',
    },
    rows: TEXTBOOK_LNB_SEED_ROWS.map((row, index) => ({
      seedKey: row.id,
      suggestedNumericId: 700_000 + Number(row.id.replace(/\D/g, '') || index + 1),
      nameKo: row.textbookName,
      businessArea: row.businessArea,
      educationTarget: row.educationTarget,
      grade: row.grade,
      useStatus: row.useStatus,
      registrantName: row.registrant,
      registeredAt: row.registeredAt,
    })),
  }
}

export function buildDetailedProgramsSeedPayload() {
  return detailedProgramsSeedPayload
}
