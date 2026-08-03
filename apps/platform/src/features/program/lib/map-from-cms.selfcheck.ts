/**
 * map-from-cms 매퍼 · CMS 4유형 시드 정합 검증.
 */

import assert from 'node:assert/strict'
import {
  CMS_PLATFORM_PROGRAM_FIXTURES,
  ECONOMY_REGISTRATION_FIXTURE,
  ECONOMY_REGISTRATION_FIXTURES,
  GENERAL_REGISTRATION_FIXTURES,
  GEMINI_RECRUITMENT_FIXTURES,
  TRAINED_TEACHERS_REGISTRATION_FIXTURES,
} from './cms-registration-fixtures.ts'
import {
  mapCmsProgramToPlatformDetail,
  mapCmsProgramsToPlatformDetails,
  mapLifecycleToRecruitmentStatus,
  resolvePlatformCategory,
} from './map-from-cms.ts'
import { mergeSeedAndCatalogPrograms } from './merge-seed-catalog.ts'
import type { CmsRegistrationCaseKind } from '../model/cms-program.types.ts'
import type { ProgramDetail } from '../model/types.ts'

const RECRUITMENT_STATUS = {
  scheduled: 'scheduled',
  recruiting: 'recruiting',
  closed: 'closed',
} as const

const EXPECTED_GENERAL_CASES: CmsRegistrationCaseKind[] = [
  'general-org-curriculum-single',
  'general-org-curriculum-multi',
  'general-ind-curriculum-single',
  'general-ind-curriculum-multi',
  'general-org-schedule-single',
  'general-org-schedule-multi',
  'general-ind-schedule-single',
  'general-ind-schedule-multi',
]

function testCountsAndKinds() {
  assert.equal(GENERAL_REGISTRATION_FIXTURES.length, 8)
  assert.equal(ECONOMY_REGISTRATION_FIXTURES.length, 8)
  assert.equal(TRAINED_TEACHERS_REGISTRATION_FIXTURES.length, 8)
  assert.equal(GEMINI_RECRUITMENT_FIXTURES.length, 3)
  assert.equal(CMS_PLATFORM_PROGRAM_FIXTURES.length, 27)
  assert.deepEqual(
    GENERAL_REGISTRATION_FIXTURES.map(f => f.registrationCase),
    EXPECTED_GENERAL_CASES
  )
}

function testPlatformCategoryMapping() {
  // 일반 기관/개인
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'general',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    }),
    'institution'
  )
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'general',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual', 'teacher_instructor'],
    }),
    'youth'
  )
  // 1사1교 → 기관
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'economy',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    }),
    'institution'
  )
  // 교육받은 교사 → 강사
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'trainedTeachers',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
    }),
    'instructor'
  )
  // Gemini → 기관
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'gemini',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
    }),
    'institution'
  )
}

function testMappedCategoriesBySource() {
  const list = mapCmsProgramsToPlatformDetails(CMS_PLATFORM_PROGRAM_FIXTURES)

  for (const id of GENERAL_REGISTRATION_FIXTURES.filter(f =>
    f.id.includes('-org-')
  ).map(f => f.id)) {
    assert.equal(list.find(p => p.id === id)?.category, 'institution', id)
  }
  for (const id of GENERAL_REGISTRATION_FIXTURES.filter(f =>
    f.id.includes('-ind-')
  ).map(f => f.id)) {
    assert.equal(list.find(p => p.id === id)?.category, 'youth', id)
  }
  for (const f of ECONOMY_REGISTRATION_FIXTURES) {
    assert.equal(list.find(p => p.id === f.id)?.category, 'institution', f.id)
  }
  for (const f of TRAINED_TEACHERS_REGISTRATION_FIXTURES) {
    assert.equal(list.find(p => p.id === f.id)?.category, 'instructor', f.id)
  }
  for (const f of GEMINI_RECRUITMENT_FIXTURES) {
    assert.equal(list.find(p => p.id === f.id)?.category, 'institution', f.id)
  }

  const categories = new Set(list.map(p => p.category))
  assert.ok(categories.has('youth'))
  assert.ok(categories.has('institution'))
  assert.ok(categories.has('instructor'))
}

function testTitlesAndIds() {
  assert.ok(
    mapCmsProgramToPlatformDetail(GENERAL_REGISTRATION_FIXTURES[0]!).title.startsWith(
      '【유형·7】'
    )
  )
  assert.ok(
    mapCmsProgramToPlatformDetail(ECONOMY_REGISTRATION_FIXTURE).title.includes('HSBC')
  )
  assert.equal(
    TRAINED_TEACHERS_REGISTRATION_FIXTURES[0]!.id,
    'trained-teachers-prog-001'
  )
  assert.ok(
    TRAINED_TEACHERS_REGISTRATION_FIXTURES[0]!.title.includes('신한은행')
  )
  assert.deepEqual(
    GEMINI_RECRUITMENT_FIXTURES.map(f => f.id),
    [
      'gvt-recruitment-scheduled',
      'gvt-recruitment-in-progress',
      'gvt-recruitment-ended',
    ]
  )
}

function testLifecycleMapping() {
  assert.equal(mapLifecycleToRecruitmentStatus('planned'), RECRUITMENT_STATUS.scheduled)
  assert.equal(
    mapLifecycleToRecruitmentStatus('recruiting_students'),
    RECRUITMENT_STATUS.recruiting
  )
  assert.equal(
    mapLifecycleToRecruitmentStatus('matching_completed'),
    RECRUITMENT_STATUS.closed
  )
}

function makeStubDetail(id: string, title: string): ProgramDetail {
  return {
    id,
    category: 'youth',
    categoryLabel: '청소년 · 청년',
    title,
    operatingPeriodLabel: '-',
    operatingPeriodStart: '2026-01-01',
    operatingPeriodEnd: '2026-12-31',
    applicationStartDate: '2026-01-01',
    applicationEndDate: '2026-12-31',
    recruitmentPeriodLabel: '-',
    recruitmentStatus: 'recruiting',
    educationTargetKey: 'high',
    educationTargetLabel: '고등학생',
    educationForm: 'online',
    educationFormLabel: '온라인',
    sponsor: 'JA Korea',
    summary: title,
    isRecruiting: true,
    businessFieldLabel: '경제금융',
    educationTargetGroupLabel: '고등학교',
    educationTargetDetailLabel: '고등학생',
    educationVenueLabel: '온라인',
    sessions: [],
    recruitmentPhaseGroupLabel: '모집',
    recruitmentPhases: [],
    educationSchedules: [],
    extraSections: [],
    applicationMethodLabel: '지원방법',
    applicationMethodValue: '-',
    attachments: [],
    applicationPeriodLabel: '-',
  }
}

function testMerge() {
  const seed = [makeStubDetail('a', 'A')]
  const catalog = [makeStubDetail('b', 'B'), makeStubDetail('a', 'A2')]
  const merged = mergeSeedAndCatalogPrograms(seed, catalog)
  assert.equal(merged[0]?.id, 'b')
  assert.equal(merged[1]?.title, 'A2')
}

function run() {
  testCountsAndKinds()
  testPlatformCategoryMapping()
  testMappedCategoriesBySource()
  testTitlesAndIds()
  testLifecycleMapping()
  testMerge()
  console.log('map-from-cms: all checks passed (27 seeds, 4 CMS kinds)')
}

run()
