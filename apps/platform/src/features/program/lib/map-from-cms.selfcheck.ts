/**
 * map-from-cms 매퍼 · CMS 4유형 + 상세 케이스 시드 정합 검증.
 */

import assert from 'node:assert/strict'
import {
  CASE_INSTRUCTOR_FIXTURE,
  CASE_VOLUNTEER_FIXTURE,
  CMS_PLATFORM_PROGRAM_FIXTURES,
  DETAIL_CASE_FIXTURES,
  ECONOMY_REGISTRATION_FIXTURE,
  ECONOMY_REGISTRATION_FIXTURES,
  GENERAL_REGISTRATION_FIXTURES,
  GEMINI_RECRUITMENT_FIXTURES,
  TRAINED_TEACHERS_REGISTRATION_FIXTURES,
  UJAT_PARTICIPANT_FIXTURE,
  UJAT_VOLUNTEER_FIXTURE,
} from './cms-registration-fixtures.ts'
import { PROGRAM_DETAIL_CASE_SSOT_IDS } from './detail-case.ts'
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
  assert.equal(DETAIL_CASE_FIXTURES.length, 4)
  assert.equal(CMS_PLATFORM_PROGRAM_FIXTURES.length, 31)
  assert.deepEqual(
    GENERAL_REGISTRATION_FIXTURES.map(f => f.registrationCase),
    EXPECTED_GENERAL_CASES
  )
  assert.deepEqual(
    DETAIL_CASE_FIXTURES.map(f => f.id),
    [
      PROGRAM_DETAIL_CASE_SSOT_IDS.instructor,
      PROGRAM_DETAIL_CASE_SSOT_IDS.volunteer,
      PROGRAM_DETAIL_CASE_SSOT_IDS.ujatVolunteer,
      PROGRAM_DETAIL_CASE_SSOT_IDS.ujatParticipant,
    ]
  )
}

function testPlatformCategoryMapping() {
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
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'economy',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    }),
    'institution'
  )
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'trainedTeachers',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
    }),
    'instructor'
  )
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'gemini',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
    }),
    'institution'
  )
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'ujat',
      ujatProgressStatus: 'VOLUNTEER_RECRUITING',
    }),
    'youth'
  )
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'ujat',
      ujatProgressStatus: 'PARTICIPANT_RECRUITING',
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

  assert.equal(
    list.find(p => p.id === PROGRAM_DETAIL_CASE_SSOT_IDS.instructor)?.category,
    'instructor'
  )
  assert.equal(
    list.find(p => p.id === PROGRAM_DETAIL_CASE_SSOT_IDS.volunteer)?.category,
    'youth'
  )
  assert.equal(
    list.find(p => p.id === PROGRAM_DETAIL_CASE_SSOT_IDS.ujatVolunteer)?.category,
    'youth'
  )
  assert.equal(
    list.find(p => p.id === PROGRAM_DETAIL_CASE_SSOT_IDS.ujatParticipant)?.category,
    'institution'
  )

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
  assert.equal(mapLifecycleToRecruitmentStatus('planned'), RECRUITMENT_STATUS.recruiting)
  assert.equal(
    mapLifecycleToRecruitmentStatus('recruiting_students'),
    RECRUITMENT_STATUS.recruiting
  )
  assert.equal(
    mapLifecycleToRecruitmentStatus('matching_completed'),
    RECRUITMENT_STATUS.closed
  )
}

function testDetailCaseSsotMapping() {
  const instructor = mapCmsProgramToPlatformDetail(CASE_INSTRUCTOR_FIXTURE)
  assert.equal(instructor.detailCase, 'instructor')
  assert.equal(instructor.recruitmentRoleLabel, '강사')
  assert.equal(instructor.category, 'instructor')
  assert.ok(instructor.recruitmentPhases.some(p => p.label === '강사 모집 기간'))
  assert.ok(instructor.basicInfoFields.some(f => f.label === '모집 구분' && f.value === '강사'))
  assert.ok(instructor.basicInfoFields.some(f => f.label === '모집 소속'))

  const volunteer = mapCmsProgramToPlatformDetail(CASE_VOLUNTEER_FIXTURE)
  assert.equal(volunteer.detailCase, 'volunteer')
  assert.equal(volunteer.recruitmentRoleLabel, '봉사자')
  assert.equal(volunteer.category, 'youth')
  assert.ok(volunteer.recruitmentPhases.some(p => p.label === '봉사자 모집 기간'))
  assert.ok(volunteer.recruitmentPhases.some(p => p.label === '면접 기간'))
  assert.equal(volunteer.sponsor, '한국씨티은행')

  const ujatVol = mapCmsProgramToPlatformDetail(UJAT_VOLUNTEER_FIXTURE)
  assert.equal(ujatVol.detailCase, 'ujat-volunteer')
  assert.equal(ujatVol.category, 'youth')
  assert.ok(ujatVol.recruitmentPhases.some(p => p.label === '봉사자 모집 기간'))
  assert.match(ujatVol.recruitmentPhases[0]?.value ?? '', /2028/)

  const ujatOrg = mapCmsProgramToPlatformDetail(UJAT_PARTICIPANT_FIXTURE)
  assert.equal(ujatOrg.detailCase, 'ujat-participant')
  assert.equal(ujatOrg.category, 'institution')
  assert.ok(ujatOrg.recruitmentPhases.some(p => p.label === '기관 모집 기간'))
  assert.equal(ujatOrg.recruitmentRoleLabel, '기관')

  const gemini = mapCmsProgramToPlatformDetail(
    GEMINI_RECRUITMENT_FIXTURES.find(f => f.id === PROGRAM_DETAIL_CASE_SSOT_IDS.gemini)!
  )
  assert.equal(gemini.detailCase, 'gemini')
  assert.equal(gemini.category, 'institution')
  assert.equal(gemini.sponsor, 'Google')
  assert.equal(gemini.educationForm, 'online')
  assert.equal(gemini.title, 'Gemini Academy')
  assert.ok(gemini.recruitmentPhases.some(p => p.label === '연수 신청 기간'))
  assert.ok(gemini.basicInfoFields.some(f => f.label === '교육 기수'))
  assert.equal(gemini.educationTargetDetailLabel, '특성화고등학교 3학년')

  const jobdam = mapCmsProgramToPlatformDetail(
    ECONOMY_REGISTRATION_FIXTURES.find(f => f.id === 'economy-prog-008')!
  )
  assert.equal(jobdam.sponsor, '한국씨티은행')
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
    detailCase: 'general',
    recruitmentRoleLabel: '참여자',
    basicInfoFields: [
      { label: '사업 분야', value: '경제금융' },
      { label: '교육 형태', value: '온라인' },
      { label: '교육대상', value: '고등학교' },
      { label: '교육 대상 상세', value: '고등학생' },
      { label: '교육 장소', value: '온라인' },
    ],
    educationStructure: 'curriculum',
    sessions: [],
    eventSchedules: [],
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

function testIndCurriculumScheduleCases() {
  const byId = Object.fromEntries(
    mapCmsProgramsToPlatformDetails(GENERAL_REGISTRATION_FIXTURES).map(p => [p.id, p])
  )

  const curSingle = byId['general-prog-type-ind-curriculum-single']
  assert.ok(curSingle)
  assert.equal(curSingle.educationStructure, 'curriculum')
  assert.equal(curSingle.sessions.length, 2)
  assert.equal(curSingle.sessions[0]?.sessionLabel, '1차시')
  assert.equal(curSingle.eventSchedules.length, 0)
  assert.equal(curSingle.educationSchedules.length, 2)
  assert.match(curSingle.educationSchedules[0]?.value ?? '', /4월 20일/)

  const curMulti = byId['general-prog-type-ind-curriculum-multi']
  assert.ok(curMulti)
  assert.equal(curMulti.educationStructure, 'curriculum')
  assert.equal(curMulti.sessions[0]?.sessionLabel, '1회차')
  assert.ok(curMulti.sessions[0]?.dateLabel?.includes('4월'))
  assert.equal(curMulti.eventSchedules.length, 0)
  assert.equal(curMulti.educationSchedules.length, 2)

  const schSingle = byId['general-prog-type-ind-schedule-single']
  assert.ok(schSingle)
  assert.equal(schSingle.educationStructure, 'schedule')
  assert.equal(schSingle.sessions.length, 0)
  assert.equal(schSingle.eventSchedules.length, 2)
  assert.equal(schSingle.eventSchedules[0]?.scheduleLabel, '세부 일정 01')
  assert.equal(schSingle.eventSchedules[0]?.name, '오리엔테이션')
  assert.ok(schSingle.eventSchedules[0]?.dateLabel.includes('그룹'))
  assert.equal(schSingle.educationSchedules.length, 4)

  const schMulti = byId['general-prog-type-ind-schedule-multi']
  assert.ok(schMulti)
  assert.equal(schMulti.educationStructure, 'schedule')
  assert.equal(schMulti.sessions.length, 0)
  assert.equal(schMulti.eventSchedules.length, 2)
  assert.equal(schMulti.eventSchedules[0]?.scheduleLabel, '행사 일정 01')
  assert.equal(schMulti.eventSchedules[1]?.name, '국내대회')
  assert.match(schMulti.eventSchedules[0]?.dateLabel ?? '', /3월/)
  assert.equal(schMulti.educationSchedules.length, 2)
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
  testDetailCaseSsotMapping()
  testIndCurriculumScheduleCases()
  testMerge()
  console.log(
    'map-from-cms: all checks passed (31 seeds, detail cases x5 SSOT, 4 CMS kinds + UJAT)'
  )
}

run()
