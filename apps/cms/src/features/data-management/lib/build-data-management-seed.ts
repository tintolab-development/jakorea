import {
  SPONSOR_DETAIL_SEED_CONTACTS,
  SPONSOR_DETAIL_SEED_PROGRAM_HISTORIES,
  SPONSOR_DETAIL_SEED_YEARLY_BUSINESSES,
} from '@/data/mock/sponsor-management-detail'
import { mockDetailedProgramManagementListRows } from '@/data/mock/detailed-program-management-list'
import { mockSponsorManagementListRows } from '@/data/mock/sponsor-management-list'
import { TEXTBOOK_LNB_SEED_ROWS } from '@/features/textbook/api/textbook-mock-store'

/** mock `dp-131` → 예약 numeric PK `900131` */
export function detailedProgramMockIdToSeedPk(mockId: string): number {
  const m = /^dp-(\d+)$/.exec(mockId)
  if (!m) throw new Error(`unexpected detailed program mock id: ${mockId}`)
  return 900_000 + Number(m[1])
}

/** 상세 child seed를 붙일 대표 후원사 (목록 선두 = 제이에이코리아) */
export function getSponsorDetailSampleListRow() {
  const row = mockSponsorManagementListRows[0]
  if (!row) throw new Error('mockSponsorManagementListRows is empty')
  return row
}

export function buildSponsorsSeedPayload() {
  const sample = getSponsorDetailSampleListRow()
  return {
    meta: {
      domain: 'sponsors',
      ssot: 'apps/cms/src/data/mock/sponsor-management-list.ts',
      detailSsot: 'apps/cms/src/data/mock/sponsor-management-detail.ts',
      note: 'LNB 후원사 관리 목록. sponsors.ts(프로그램 폼 30건)와 병합하지 말 것 — 이름 교집합만 링크.',
      upsertKeys: ['nameKoNormalized', 'businessRegistrationNumber'],
      childSeedOrder: ['contacts', 'yearlyBusinesses', 'programHistories'],
    },
    rows: mockSponsorManagementListRows.map((row, index) => ({
      seedKey: row.id,
      suggestedNumericId: 800_001 + index,
      nameKo: row.name,
      nameEn: row.nameEn ?? null,
      organizationKind: row.organizationKind ?? 'corporate',
      sponsorshipStatus: row.sponsorshipStatus ?? 'active',
      sponsorshipStartDate: row.sponsorshipStartDate ?? null,
      programCount: row.programCount,
      totalDonationAmount: row.totalDonationAmount,
      totalBeneficiaryCount: row.totalBeneficiaryCount,
      mainContact: row.managers?.[0]
        ? { name: row.managers[0].name, phone: row.managers[0].phone }
        : null,
    })),
    detailSamples: [
      {
        seedKey: sample.id,
        suggestedNumericId: 800_001,
        nameKo: sample.name,
        businessNumber: '124-81-00998',
        executives: '전영현, 노태문',
        address: '경기도 수원시 영통구 삼성로 129(매탄동)',
        contacts: SPONSOR_DETAIL_SEED_CONTACTS.map(c => ({
          seedKey: c.id,
          name: c.name,
          position: c.position,
          phone: c.phone,
          email: c.email,
          contactType: c.contactType,
          registeredAt: c.registeredAt,
        })),
        yearlyBusinesses: SPONSOR_DETAIL_SEED_YEARLY_BUSINESSES.map(y => ({
          seedKey: y.id,
          businessYear: y.year,
          donationAmount: y.donationAmount,
          beneficiaryCount: y.beneficiaryCount,
          memo: y.memo,
          businessName: y.businessName,
          managerNameSnapshot: y.managerNameSnapshot,
        })),
        programHistories: SPONSOR_DETAIL_SEED_PROGRAM_HISTORIES.map(h => ({
          seedKey: h.id,
          programIdHint: h.programId,
          title: h.title,
          year: h.year,
          lifecycleStatus: h.lifecycleStatus,
          managerName: h.managerName,
          participantCount: h.participantCount,
          participantType: h.participantType,
          educationTarget: h.educationTarget,
        })),
      },
    ],
  }
}

export function buildTextbooksSeedPayload() {
  return {
    meta: {
      domain: 'textbooks',
      ssot: 'apps/cms/src/features/textbook/api/textbook-mock-store.ts TEXTBOOK_LNB_SEED_ROWS',
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
  return {
    meta: {
      domain: 'detailedPrograms',
      ssot: 'apps/cms/src/data/mock/detailed-program-management-list.ts',
      upsertKeys: ['nameKo'],
      forbiddenSentinels: ['__detailed_program_none__', '__ujat_volunteer_core__'],
      idMapNote: 'FE mock id dp-* is not DB PK. Use suggestedNumericId (900000+n).',
    },
    rows: mockDetailedProgramManagementListRows.map(row => ({
      seedKey: row.id,
      suggestedNumericId: detailedProgramMockIdToSeedPk(row.id),
      nameKo: row.name,
      useYn: row.active,
      createdByName: row.createdBy,
      createdAt: row.createdAt,
      inUseHint: row.inUse ?? false,
    })),
  }
}
