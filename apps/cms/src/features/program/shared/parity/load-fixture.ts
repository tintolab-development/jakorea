import type { Program } from '@/types/domain'
import generalNestedOnly from './fixtures/general-organization-nested_only.json'
import generalConflict from './fixtures/general-organization-nested_overlay_conflict.json'
import generalOverlayOnly from './fixtures/general-organization-overlay_only.json'
import generalEmptyBoth from './fixtures/general-organization-empty_both.json'
import companySchoolOverlay from './fixtures/company-school-economy-overlay_only.json'
import ujatNested from './fixtures/ujat-institution-nested_only.json'
import geminiRecruitment from './fixtures/gemini-recruitment-nested_only.json'

export type ParityFixturePack = {
  fixtureId: string
  variant: string
  label: string
  program: Program
}

function asParityFixturePack(raw: unknown): ParityFixturePack {
  const pack = raw as ParityFixturePack
  return { ...pack, program: pack.program as Program }
}

const FIXTURES: ParityFixturePack[] = [
  asParityFixturePack(generalNestedOnly),
  asParityFixturePack(generalConflict),
  asParityFixturePack(generalOverlayOnly),
  asParityFixturePack(generalEmptyBoth),
  asParityFixturePack(companySchoolOverlay),
  asParityFixturePack(ujatNested),
  asParityFixturePack(geminiRecruitment),
]

export function listParityFixtures(): ParityFixturePack[] {
  return FIXTURES
}

export function loadParityFixture(fixtureId: string): ParityFixturePack | undefined {
  return FIXTURES.find(f => f.fixtureId === fixtureId)
}
