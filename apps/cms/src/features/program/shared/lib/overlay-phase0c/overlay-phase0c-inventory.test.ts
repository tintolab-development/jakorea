/** @vitest-environment node */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ProgramCreateRequestProgramType } from '@/shared/api/generated/dashboard/schemas/programCreateRequestProgramType'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import {
  APPLICATION_BINDING_RECRUITMENT_ROW_TYPES,
  CMS_REGISTRATION_DRAFT_TYPE_KEYS,
  DO_NOT_MERGE_INTO_ONE_BUILDER,
  OPENAPI_PROGRAM_CREATE_TYPES,
  OPERATIONAL_BINDING_KINDS,
  OVERLAY_PHASE0C_BASELINE_TEST_COUNT,
  OVERLAY_PHASE0C_EVIDENCE_FILES,
  OVERLAY_PHASE0C_IMPLEMENTATION_ORDER,
  OVERLAY_PHASE0C_MATRIX,
  SCHEDULE_FIELD_CONTRACTS,
  SESSION_AUTHORING_CONTRACTS,
  overlayPhase0cMatrixByFamily,
} from './overlay-phase0c-inventory'
import {
  OVERLAY_PHASE0C_REQUIRED_FIXTURE_FAMILIES,
  OVERLAY_PHASE0C_SHADOW_FIXTURES,
} from './overlay-phase0c-shadow-plan'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../../../../../..')

const BUILDER_REUSE_VALUES = new Set([
  'reuse-as-is',
  'reuse-with-adapter',
  'needs-separate-domain',
  'overlay-conversion-not-needed',
])

function extractTsxPaths(value: string): string[] {
  return value
    .split(/ \+ |, /)
    .map(part => part.replace(/\s*\([^)]*\)\s*$/, '').trim())
    .filter(part => part.startsWith('apps/') && /\.(ts|tsx)$/.test(part))
}

describe('Phase 0-C CMS 전체 프로그램 Overlay / RHF 조사', () => {
  it('OpenAPI programType enum 11개를 모두 식별한다', () => {
    expect(OPENAPI_PROGRAM_CREATE_TYPES.sort()).toEqual(
      Object.values(ProgramCreateRequestProgramType).sort()
    )
    expect(OPENAPI_PROGRAM_CREATE_TYPES).toHaveLength(11)
  })

  it('CMS 등록 초안 키와 operational binding kind는 4종이다', () => {
    expect([...CMS_REGISTRATION_DRAFT_TYPE_KEYS]).toEqual([
      'GENERAL',
      'COMPANY_SCHOOL',
      'TRAINED_TEACHER',
      'UJAT',
    ])
    expect([...OPERATIONAL_BINDING_KINDS]).toEqual([
      'GENERAL',
      'COMPANY_SCHOOL',
      'TRAINED_TEACHER',
      'UJAT',
    ])
  })

  it('Matrix가 CMS family를 빠짐없이 가진다', () => {
    const families = OVERLAY_PHASE0C_MATRIX.map(row => row.family).sort()
    expect(families).toEqual(
      [
        'COMPANY_SCHOOL',
        'GEMINI_VISITING_TRAINING',
        'GENERAL',
        'LEGACY_VOLUNTEER_ROUTE',
        'OPENAPI_ONLY',
        'TRAINED_TEACHER',
        'UJAT',
      ].sort()
    )
  })

  it('OpenAPI enum 값이 Matrix programTypeEnum에 모두 등장한다', () => {
    const covered = new Set(OVERLAY_PHASE0C_MATRIX.flatMap(row => [...row.programTypeEnum]))
    for (const type of OPENAPI_PROGRAM_CREATE_TYPES) {
      expect(covered.has(type)).toBe(true)
    }
  })

  it('유형별 입력·저장 SSOT와 Builder 재사용 판정이 채워져 있다', () => {
    for (const row of OVERLAY_PHASE0C_MATRIX) {
      expect(row.wizardInputSsot.length).toBeGreaterThan(0)
      expect(row.detailInputSsot.length).toBeGreaterThan(0)
      expect(row.saveSsot.length).toBeGreaterThan(10)
      expect(row.saveHook.length).toBeGreaterThan(0)
      expect(row.createApi.length).toBeGreaterThan(0)
      expect(row.updateApi.length).toBeGreaterThan(0)
      expect(row.previewSource.length).toBeGreaterThan(0)
      expect(row.draftRestore.length).toBeGreaterThan(0)
      expect(BUILDER_REUSE_VALUES.has(row.commonInfoBuilder)).toBe(true)
      expect(BUILDER_REUSE_VALUES.has(row.recruitmentBuilder)).toBe(true)
      expect(BUILDER_REUSE_VALUES.has(row.applicationBuilder)).toBe(true)
      expect(BUILDER_REUSE_VALUES.has(row.mediaBuilder)).toBe(true)
      expect(['High', 'Medium', 'Low']).toContain(row.risk)
    }
  })

  it('일반 Independent Builder는 재사용 유지, 거대 Builder 합치기는 금지다', () => {
    const general = overlayPhase0cMatrixByFamily('GENERAL')
    expect(general.commonInfoBuilder).toBe('reuse-as-is')
    expect(general.recruitmentBuilder).toBe('reuse-as-is')
    expect(general.applicationBuilder).toBe('reuse-as-is')
    expect(general.mediaBuilder).toBe('reuse-as-is')
    expect(DO_NOT_MERGE_INTO_ONE_BUILDER).toBe(true)
    expect(overlayPhase0cMatrixByFamily('COMPANY_SCHOOL').commonInfoBuilder).toBe(
      'needs-separate-domain'
    )
    expect(overlayPhase0cMatrixByFamily('UJAT').recruitmentBuilder).toBe(
      'needs-separate-domain'
    )
    expect(overlayPhase0cMatrixByFamily('GEMINI_VISITING_TRAINING').commonInfoBuilder).toBe(
      'overlay-conversion-not-needed'
    )
  })

  it('일정형 3필드와 세션 작성 정본이 유형별로 구분된다', () => {
    expect(SCHEDULE_FIELD_CONTRACTS.map(item => item.field)).toEqual([
      'scheduleDetails',
      'educationScheduleLines',
      'schedules[]',
    ])
    expect(SESSION_AUTHORING_CONTRACTS.map(item => item.family)).toEqual([
      'GENERAL',
      'COMPANY_SCHOOL',
      'TRAINED_TEACHER',
      'UJAT',
    ])
    expect(
      SESSION_AUTHORING_CONTRACTS.find(item => item.family === 'COMPANY_SCHOOL')?.authoring
    ).toMatch(/sessionN/)
  })

  it('신청 모집 행 바인딩은 GENERAL*·UJAT만이다', () => {
    expect([...APPLICATION_BINDING_RECRUITMENT_ROW_TYPES]).toEqual([
      'GENERAL',
      'GENERAL_INDIVIDUAL',
      'GENERAL_ORGANIZATION',
      'UJAT',
    ])
  })

  it('증거 파일과 Matrix 화면 경로가 실제 존재한다', () => {
    for (const relative of OVERLAY_PHASE0C_EVIDENCE_FILES) {
      expect(existsSync(join(repoRoot, relative)), relative).toBe(true)
    }
    for (const row of OVERLAY_PHASE0C_MATRIX) {
      for (const relative of [
        ...extractTsxPaths(row.registrationScreen),
        ...extractTsxPaths(row.detailScreen),
      ]) {
        expect(existsSync(join(repoRoot, relative)), relative).toBe(true)
      }
    }
  })

  it('기존 Phase 0 known-diff 13건을 유지한다', () => {
    expect(OVERLAY_PHASE0_KNOWN_DIFFS).toHaveLength(13)
    expect(OVERLAY_PHASE0C_BASELINE_TEST_COUNT).toBe(94)
  })

  it('구현 순서는 일반 제품 교체 보류가 1순위다', () => {
    expect(OVERLAY_PHASE0C_IMPLEMENTATION_ORDER[0]?.family).toBe('GENERAL')
    expect(OVERLAY_PHASE0C_IMPLEMENTATION_ORDER[0]?.action).toMatch(/BLOCKED/)
  })

  it('Shadow fixture가 필수 family를 모두 포함한다', () => {
    const families = new Set(OVERLAY_PHASE0C_SHADOW_FIXTURES.map(item => item.family))
    for (const family of OVERLAY_PHASE0C_REQUIRED_FIXTURE_FAMILIES) {
      expect(families.has(family)).toBe(true)
    }
    expect(OVERLAY_PHASE0C_SHADOW_FIXTURES.some(item => item.id.includes('ujat-h1-h2'))).toBe(
      true
    )
    expect(
      OVERLAY_PHASE0C_SHADOW_FIXTURES.some(item => item.id.includes('company-school-sessionN'))
    ).toBe(true)
    expect(
      OVERLAY_PHASE0C_SHADOW_FIXTURES.some(item =>
        item.id.includes('trained-teachers-single-multi-schedule')
      )
    ).toBe(true)
  })
})
