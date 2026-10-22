/** @vitest-environment node */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  APPLICATION_OVERLAY_COLLECT_PREFIXES,
  APPLICATION_OVERLAY_KEY_INVENTORY,
  APPLICATION_OVERLAY_TEST_ONLY_KEYS,
  isInventoriedApplicationOverlayKey,
} from './application-overlay-key-inventory'
import {
  EDITOR_EXTRAS_CURRICULUM_MULTI,
  EDITOR_EXTRAS_CURRICULUM_SINGLE,
  EDITOR_EXTRAS_FALLBACK_WHEN_UNSET,
  EDITOR_EXTRAS_SCHEDULE_MULTI,
  EDITOR_EXTRAS_SCHEDULE_SINGLE,
} from './editor-extras-fixtures'
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  operationalOverlayKeyPrefixesForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  patchGeneralApplicationOverlay,
  resetGeneralApplicationOverlayStoreForTests,
  setGeneralApplicationOverlayScope,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  extrasFromGeneralProgram,
  getGeneralRegistrationDetailEditExtras,
  setGeneralRegistrationDetailEditExtras,
} from '@/features/program/general/lib/registration-overlay-sync'
import type { Program } from '@/types/domain'

const QUOTED_APPLICATION_KEY =
  /['"](application\.(?:institution|individual|instructor|volunteer)\.[A-Za-z0-9.]+)['"]/g

function walkFiles(root: string, out: string[] = []): string[] {
  for (const name of readdirSync(root)) {
    const full = join(root, name)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue
      walkFiles(full, out)
      continue
    }
    if (!/\.(ts|tsx)$/.test(name)) continue
    if (/\.test\.(ts|tsx)$/.test(name)) continue
    out.push(full)
  }
  return out
}

function collectQuotedApplicationKeys(files: string[]): string[] {
  const keys = new Set<string>()
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(QUOTED_APPLICATION_KEY)) {
      keys.add(match[1] ?? '')
    }
  }
  keys.delete('')
  return [...keys].sort()
}

const inventoryDir = dirname(fileURLToPath(import.meta.url))
const applicationFormDir = join(
  inventoryDir,
  '../../../../template/ui/form-set/application-form'
)
const generalLibDir = join(inventoryDir, '..')

describe('Phase 0-B 신청 overlay 키 전수', () => {
  it('일반 4 catalog prefix가 collect prefix와 같다', () => {
    expect(operationalOverlayKeyPrefixesForCatalogId('application-participant-school')).toEqual(
      APPLICATION_OVERLAY_COLLECT_PREFIXES['application-participant-school']
    )
    expect(operationalOverlayKeyPrefixesForCatalogId('application-participant-individual')).toEqual(
      APPLICATION_OVERLAY_COLLECT_PREFIXES['application-participant-individual']
    )
    expect(operationalOverlayKeyPrefixesForCatalogId('application-instructor')).toEqual(
      APPLICATION_OVERLAY_COLLECT_PREFIXES['application-instructor']
    )
    expect(operationalOverlayKeyPrefixesForCatalogId('application-volunteer')).toEqual(
      APPLICATION_OVERLAY_COLLECT_PREFIXES['application-volunteer']
    )
  })

  it('paragraph·lib 소스의 quoted application.* 키가 인벤토리에 있다', () => {
    const files = [
      ...['institution', 'individual', 'instructor', 'volunteer', 'shared'].flatMap(folder =>
        walkFiles(join(applicationFormDir, folder))
      ),
      ...walkFiles(generalLibDir).filter(path =>
        /application|individual-application-team/.test(path)
      ),
    ]
    const found = collectQuotedApplicationKeys(files)
    const missing = found.filter(key => !isInventoriedApplicationOverlayKey(key))
    expect(missing).toEqual([])
  })

  it('인벤토리 정적 키는 catalog prefix로 시작한다', () => {
    for (const entry of APPLICATION_OVERLAY_KEY_INVENTORY) {
      const prefix = APPLICATION_OVERLAY_COLLECT_PREFIXES[entry.catalog][0]
      const matchesOwnPrefix = entry.key === prefix || entry.key.startsWith(`${prefix}.`)
      if (entry.key === 'application.institution.fixedScheduleSelected') {
        expect(matchesOwnPrefix).toBe(true)
        continue
      }
      expect(matchesOwnPrefix).toBe(true)
    }
  })

  it('테스트 전용 키는 제품 인벤토리와 겹치지 않는다', () => {
    const product = new Set(APPLICATION_OVERLAY_KEY_INVENTORY.map(entry => entry.key))
    for (const key of APPLICATION_OVERLAY_TEST_ONLY_KEYS) {
      expect(product.has(key)).toBe(false)
    }
  })
})

describe('Phase 0-B 신청 overlay collect / 복원', () => {
  beforeEach(() => {
    resetGeneralApplicationOverlayStoreForTests()
  })

  it('catalog peek만 collect하고 프로그램 PATCH 키로 승격하지 않는다', () => {
    setGeneralApplicationOverlayScope('application-participant-school')
    patchGeneralApplicationOverlay({
      'application.institution.teacherTel': '02-1234-5678',
      'application.institution.classCount': '3',
    })
    const collected = collectOperationalOverlayForCatalogId('application-participant-school')
    expect(collected).toMatchObject({
      'application.institution.teacherTel': '02-1234-5678',
      'application.institution.classCount': '3',
    })
    expect(collected && 'application.instructor.crimeRecordConfirmed' in collected).toBe(false)
  })

  it('개인 catalog는 institution 일정 키를 빠뜨린다 (known-diff)', () => {
    setGeneralApplicationOverlayScope('application-participant-individual')
    patchGeneralApplicationOverlay({
      'application.individual.teamInfo.teamName': '팀A',
      'application.institution.fixedScheduleSelected': ['slot-1'],
    })
    const collected = collectOperationalOverlayForCatalogId('application-participant-individual')
    expect(collected).toEqual({
      'application.individual.teamInfo.teamName': '팀A',
    })
    expect(collected?.['application.institution.fixedScheduleSelected']).toBeUndefined()
  })

  it('임시저장과 같은 apply → collect 왕복이 동일 키를 복원한다', () => {
    const overlay = {
      'application.instructor.crimeRecordConfirmed': true,
      'application.instructor.selectedSlotIds': ['s1', 's2'],
    }
    applyOperationalOverlayForCatalogId('application-instructor', overlay)
    expect(collectOperationalOverlayForCatalogId('application-instructor')).toMatchObject(overlay)
  })
})

describe('Phase 0-B editor extras fixture', () => {
  it('커리큘럼/일정 × 단일/복수 회차 extras가 서로 다른 행 빌더 입력을 만든다', () => {
    expect(EDITOR_EXTRAS_CURRICULUM_SINGLE.programType).toBe('curriculum')
    expect(EDITOR_EXTRAS_CURRICULUM_SINGLE.sessionRoundType).toBe('single')
    expect(EDITOR_EXTRAS_CURRICULUM_MULTI.sessionRoundType).toBe('multi')
    expect(EDITOR_EXTRAS_SCHEDULE_SINGLE.programType).toBe('schedule')
    expect(EDITOR_EXTRAS_SCHEDULE_MULTI.scheduleCurriculumGroupCount).toBe(2)
    expect(EDITOR_EXTRAS_FALLBACK_WHEN_UNSET).toEqual({
      programType: 'curriculum',
      sessionRoundType: 'single',
    })
  })

  it('상세 extras 미설정 fallback은 curriculum+single', () => {
    setGeneralRegistrationDetailEditExtras(EDITOR_EXTRAS_FALLBACK_WHEN_UNSET)
    expect(getGeneralRegistrationDetailEditExtras()).toEqual(EDITOR_EXTRAS_FALLBACK_WHEN_UNSET)
  })

  it('GET 프로그램에서 extras 세션 수는 nested 행 길이로 재계산된다', () => {
    const program = {
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
      generalCommonInfo: {
        curriculumSessions: [
          { sessionLabel: '1차시', title: 'A', description: '' },
          { sessionLabel: '2차시', title: 'B', description: '' },
        ],
      },
    } as Program
    const extras = extrasFromGeneralProgram(program)
    expect(extras.programType).toBe('curriculum')
    expect(extras.sessionRoundType).toBe('multi')
    expect(extras.curriculumSessionCount).toBeGreaterThanOrEqual(2)
    expect(extras.participantOrganization).toBe(true)
  })
})
