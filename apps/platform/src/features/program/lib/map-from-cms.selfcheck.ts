/**
 * map-from-cms 매퍼 · CMS 등록 케이스 시드 정합 검증.
 */

import assert from 'node:assert/strict'
import {
  CMS_PLATFORM_PROGRAM_FIXTURES,
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
  mapApplicationWindowToRecruitmentStatus,
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
  'general-org-curriculum-single-participant-choice',
  'general-org-curriculum-multi',
  'general-org-curriculum-multi-participant-choice',
  'general-org-schedule-single',
  'general-org-schedule-single-participant-choice',
  'general-org-schedule-multi',
  'general-org-schedule-multi-participant-choice',
  'general-ind-curriculum-single',
  'general-ind-curriculum-single-team',
  'general-ind-curriculum-multi-individual',
  'general-ind-curriculum-multi',
  'general-ind-schedule-single',
  'general-ind-schedule-single-team',
  'general-ind-schedule-multi',
  'general-ind-schedule-multi-team',
]

function testCountsAndKinds() {
  assert.equal(GENERAL_REGISTRATION_FIXTURES.length, 16)
  assert.equal(ECONOMY_REGISTRATION_FIXTURES.length, 2)
  assert.equal(TRAINED_TEACHERS_REGISTRATION_FIXTURES.length, 8)
  assert.equal(GEMINI_RECRUITMENT_FIXTURES.length, 2)
  assert.equal(CMS_PLATFORM_PROGRAM_FIXTURES.length, 30)
  assert.deepEqual(
    GENERAL_REGISTRATION_FIXTURES.map(f => f.registrationCase),
    EXPECTED_GENERAL_CASES
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
      category: 'school',
    }),
    'institution'
  )
  assert.equal(
    resolvePlatformCategory({
      registrationKind: 'gemini',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['teacher_instructor'],
      category: 'instructor',
    }),
    'instructor'
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
    const expected = f.id === PROGRAM_DETAIL_CASE_SSOT_IDS.instructor ? 'instructor' : 'institution'
    assert.equal(list.find(p => p.id === f.id)?.category, expected, f.id)
  }

  assert.equal(
    list.find(p => p.id === PROGRAM_DETAIL_CASE_SSOT_IDS.instructor)?.category,
    'instructor'
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
  assert.equal(
    mapCmsProgramToPlatformDetail(GENERAL_REGISTRATION_FIXTURES[0]!).title,
    '일반 프로그램 (기관)_커리큘럼형_단일 회차'
  )
  assert.equal(
    mapCmsProgramToPlatformDetail(ECONOMY_REGISTRATION_FIXTURE).title,
    '1사1교 프로그램_교육형태고정'
  )
  assert.equal(
    TRAINED_TEACHERS_REGISTRATION_FIXTURES[0]!.id,
    'trained-teachers-prog-001'
  )
  assert.equal(
    TRAINED_TEACHERS_REGISTRATION_FIXTURES[0]!.title,
    '교육받은 교사 프로그램 (커리큘럼형)_단일 회차'
  )
  assert.deepEqual(
    GEMINI_RECRUITMENT_FIXTURES.map(f => f.id),
    ['gemini-prog-institution', 'gemini-prog-instructor']
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

  const futureStart = new Date()
  futureStart.setDate(futureStart.getDate() + 30)
  const futureEnd = new Date()
  futureEnd.setDate(futureEnd.getDate() + 60)
  assert.equal(
    mapApplicationWindowToRecruitmentStatus(futureStart, futureEnd),
    RECRUITMENT_STATUS.scheduled
  )

  const pastStart = new Date()
  pastStart.setDate(pastStart.getDate() - 60)
  const pastEnd = new Date()
  pastEnd.setDate(pastEnd.getDate() - 30)
  assert.equal(
    mapApplicationWindowToRecruitmentStatus(pastStart, pastEnd),
    RECRUITMENT_STATUS.closed
  )

  const openStart = new Date()
  openStart.setDate(openStart.getDate() - 10)
  const openEnd = new Date()
  openEnd.setDate(openEnd.getDate() + 10)
  assert.equal(
    mapApplicationWindowToRecruitmentStatus(openStart, openEnd),
    RECRUITMENT_STATUS.recruiting
  )
}

function testDetailCaseSsotMapping() {
  const instructor = mapCmsProgramToPlatformDetail(
    GEMINI_RECRUITMENT_FIXTURES.find(f => f.id === PROGRAM_DETAIL_CASE_SSOT_IDS.instructor)!
  )
  assert.equal(instructor.detailCase, 'instructor')
  assert.equal(instructor.recruitmentRoleLabel, '강사')
  assert.equal(instructor.category, 'instructor')
  assert.ok(instructor.recruitmentPhases.some(p => p.label === '강사 모집 기간'))

  const ujatVol = mapCmsProgramToPlatformDetail(UJAT_VOLUNTEER_FIXTURE)
  assert.equal(ujatVol.detailCase, 'ujat-volunteer')
  assert.equal(ujatVol.category, 'youth')
  assert.ok(ujatVol.recruitmentPhases.some(p => p.label === '봉사자 모집 기간'))
  assert.match(ujatVol.recruitmentPhases[0]?.value ?? '', /2028/)
  assert.equal(ujatVol.recruitmentStatus, RECRUITMENT_STATUS.scheduled)
  assert.ok(ujatVol.educationSchedules.some(s => s.label === '사전교육(발대식)'))
  assert.ok(ujatVol.educationSchedules.some(s => s.label === '교육 진행'))
  assert.ok(ujatVol.educationSchedules.some(s => s.label === '해단식'))

  const ujatOrg = mapCmsProgramToPlatformDetail(UJAT_PARTICIPANT_FIXTURE)
  assert.equal(ujatOrg.detailCase, 'ujat-participant')
  assert.equal(ujatOrg.category, 'institution')
  assert.ok(ujatOrg.recruitmentPhases.some(p => p.label === '기관 모집 기간'))
  assert.equal(ujatOrg.recruitmentRoleLabel, '기관')
  assert.ok(ujatOrg.educationSchedules.some(s => s.label === '상반기'))
  assert.ok(ujatOrg.educationSchedules.some(s => s.label === '하반기'))
  assert.ok(ujatOrg.extraSections.some(s => s.title === '학습 지원 내용'))
  assert.ok(!ujatOrg.extraSections.some(s => s.title === '기타사항'))
  assert.ok(ujatOrg.contactValue.includes('school@jakorea.org'))

  const gemini = mapCmsProgramToPlatformDetail(
    GEMINI_RECRUITMENT_FIXTURES.find(f => f.id === PROGRAM_DETAIL_CASE_SSOT_IDS.gemini)!
  )
  assert.equal(gemini.detailCase, 'gemini')
  assert.equal(gemini.category, 'institution')
  assert.equal(gemini.title, 'Gemini 프로그램_기관')
  assert.ok(gemini.recruitmentPhases.some(p => p.label === '연수 신청 기간'))
  assert.equal(gemini.educationTargetDetailLabel, '특성화고등학교 3학년')

  const economyChoice = mapCmsProgramToPlatformDetail(
    ECONOMY_REGISTRATION_FIXTURES.find(f => f.id === 'economy-prog-participant-choice')!
  )
  assert.equal(economyChoice.educationForm, 'participant_choice')

  const teamInd = mapCmsProgramToPlatformDetail(
    GENERAL_REGISTRATION_FIXTURES.find(f => f.id === 'general-prog-type-ind-curriculum-multi')!
  )
  assert.equal(teamInd.participationMethod, 'team')
  const soloInd = mapCmsProgramToPlatformDetail(
    GENERAL_REGISTRATION_FIXTURES.find(f => f.id === 'general-prog-type-ind-curriculum-single')!
  )
  assert.equal(soloInd.participationMethod, 'individual')

  const orgChoice = mapCmsProgramToPlatformDetail(
    GENERAL_REGISTRATION_FIXTURES.find(
      f => f.id === 'general-prog-type-org-curriculum-single-participant-choice'
    )!
  )
  assert.equal(orgChoice.educationForm, 'participant_choice')
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
    participationMethod: 'individual',
    recruitmentRoleLabel: '참여자',
    basicInfoFields: [
      { label: '사업 분야', value: '경제금융' },
      { label: '교육 형태', value: '온라인' },
      { label: '교육 대상', value: '고등학교' },
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
    contactValue: '',
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
  // 기획: 일정형 + 복수회차 → 세부내용 「교육 일정」 비노출
  assert.equal(schMulti.educationSchedules.length, 0)

  const schMultiOrg = byId['general-prog-type-org-schedule-multi']
  assert.ok(schMultiOrg)
  assert.equal(schMultiOrg.educationSchedules.length, 0)

  // 기획: 일반(참여자)도 면접 있으면 1차 서류·2차 면접 노출
  const soloInd = GENERAL_REGISTRATION_FIXTURES.find(
    f => f.id === 'general-prog-type-ind-curriculum-single'
  )!
  const withInterview = mapCmsProgramToPlatformDetail({
    ...soloInd,
    interviewEnabled: true,
    documentPassAnnouncementDate: '2026-05-01T00:00:00+09:00',
    interviewStartDate: '2026-05-10T00:00:00+09:00',
    interviewEndDate: '2026-05-15T00:00:00+09:00',
  })
  assert.equal(withInterview.detailCase, 'general')
  assert.ok(withInterview.recruitmentPhases.some(p => p.label === '1차 서류 합격자 발표'))
  assert.ok(withInterview.recruitmentPhases.some(p => p.label === '2차 면접 기간'))

  const withoutInterview = mapCmsProgramToPlatformDetail({
    ...soloInd,
    interviewEnabled: false,
  })
  assert.ok(!withoutInterview.recruitmentPhases.some(p => p.label === '1차 서류 합격자 발표'))
  assert.ok(!withoutInterview.recruitmentPhases.some(p => p.label === '2차 면접 기간'))
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
    'map-from-cms: all checks passed (30 seeds, 16 general + 2 economy + 8 TT + 2 gemini + 2 UJAT)'
  )
}

run()
