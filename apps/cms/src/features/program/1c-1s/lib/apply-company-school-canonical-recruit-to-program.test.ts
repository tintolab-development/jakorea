/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { applyCompanySchoolCanonicalRecruitToProgram } from './apply-company-school-canonical-recruit-to-program'
import { emptyCompanySchoolRecruitFormState } from './registration-rhf-recruitment'
import {
  emptyCompanySchoolInstructorRecruitFormState,
  serializeCompanySchoolInstructorRecruitmentForFormVersion,
  withCompanySchoolInstructorRecruitCreateDefaults,
} from './registration-rhf-instructor-recruitment'
import { serializeCompanySchoolRecruitmentForFormVersion } from './registration-rhf-recruitment'
import { buildCompanySchoolProgramFromRhf } from './build-registration-create-from-canonical'
import { createDefaultCompanySchoolRegistrationRhfValues } from './registration-rhf-values'
import { replaceGeneralRecruitOverlayForScope } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

function baseProgram(): Program {
  return {
    id: 'cs-typed-map',
    name: '1사1교',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as unknown as Program
}

function filledRecruit() {
  const recruit = emptyCompanySchoolRecruitFormState()
  recruit.recruitRange = { start: '2026-03-01', end: '2026-03-31' }
  recruit.programRange = { start: '2026-04-01', end: '2026-11-30' }
  recruit.finalAnnounce = '2026-04-10'
  recruit.finalAnnounceMethod = '홈페이지'
  recruit.maxClassCount = 20
  recruit.maxAssignableInstructors = 0
  recruit.maxScheduleCount = 3
  recruit.maxSessionsPerDay = 2
  recruit.targetLevels = ['elementary', 'middle']
  recruit.targetLevelDetail = '서울'
  recruit.inquiryContact = '기관 담당'
  recruit.inquiryTel = '02-111'
  recruit.inquiryEmail = 'org@example.com'
  recruit.announcementPublished = ''
  recruit.preguidanceRequired = 'need'
  recruit.studentListRequired = 'need'
  recruit.certificateProvided = 'provided'
  recruit.notes = '기관 비고'
  recruit.notesNotApplicable = false
  recruit.detailInfo.programDescription = '<p>기관 소개</p>'
  recruit.detailInfo.recruitmentGuide = '<p>기관 안내</p>'
  return recruit
}

function filledInstructor() {
  const instructor = emptyCompanySchoolInstructorRecruitFormState()
  instructor.recruitRange = { start: '2026-02-01', end: '2026-02-20' }
  instructor.programRange = { start: '2026-04-01', end: '2026-11-30' }
  instructor.recruitTargets = ['adult']
  instructor.recruitTargetDetail = '성인'
  instructor.announcementPublished = 'unpublished'
  instructor.inquiryContact = '강사 담당'
  instructor.inquiryTel = '02-222'
  instructor.inquiryEmail = 'inst@example.com'
  instructor.notes = '강사 비고'
  instructor.notesNotApplicable = false
  instructor.otherNotes = '<p>기타</p>'
  instructor.finalAnnounce = '2026-02-25'
  instructor.finalAnnounceMethod = '개별 연락'
  instructor.detailInfo.programDescription = '<p>강사 소개</p>'
  return instructor
}

describe('applyCompanySchoolCanonicalRecruitToProgram', () => {
  it('KV apply와 nested·날짜가 같다', () => {
    const recruit = filledRecruit()
    const instructor = withCompanySchoolInstructorRecruitCreateDefaults(filledInstructor())
    const wire = {
      ...serializeCompanySchoolRecruitmentForFormVersion(recruit),
      ...serializeCompanySchoolInstructorRecruitmentForFormVersion(instructor),
    }
    const viaKv = applyGeneralRecruitOverlayToProgram(
      { ...baseProgram(), registrationOverlay: wire },
      wire,
      { preferOverlay: true }
    )
    const viaTyped = applyCompanySchoolCanonicalRecruitToProgram(baseProgram(), recruit, instructor)
    expect(viaTyped.generalCommonInfo?.participantRecruitmentInfo).toEqual(
      viaKv.generalCommonInfo?.participantRecruitmentInfo
    )
    expect(viaTyped.generalCommonInfo?.instructorRecruitmentInfo).toEqual(
      viaKv.generalCommonInfo?.instructorRecruitmentInfo
    )
    expect(viaTyped.applicationStartDate).toEqual(viaKv.applicationStartDate)
    expect(viaTyped.applicationEndDate).toEqual(viaKv.applicationEndDate)
    expect(viaTyped.instructorApplicationStartDate).toEqual(viaKv.instructorApplicationStartDate)
    expect(viaTyped.instructorApplicationEndDate).toEqual(viaKv.instructorApplicationEndDate)
    expect(viaTyped.resultAnnouncementDate).toEqual(viaKv.resultAnnouncementDate)
    expect(viaTyped.finalPassAnnouncementDate).toEqual(viaKv.finalPassAnnouncementDate)
    expect(viaTyped.contactPhone).toEqual(viaKv.contactPhone)
    expect(viaTyped.generalCommonInfo?.participantRecruitmentInfo?.maxClassCount).toBe(20)
  })

  it('0/false/빈 배열을 유실하지 않는다', () => {
    const recruit = emptyCompanySchoolRecruitFormState()
    recruit.maxAssignableInstructors = 0
    recruit.notesNotApplicable = false
    recruit.targetLevels = []
    const instructor = emptyCompanySchoolInstructorRecruitFormState()
    instructor.recruitTargets = []
    instructor.notesNotApplicable = false
    instructor.announcementPublished = 'unpublished'
    const program = applyCompanySchoolCanonicalRecruitToProgram(baseProgram(), recruit, instructor)
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors).toBe(0)
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.notesNotApplicable).toBe(false)
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(false)
  })

  it('CREATE는 overlay store leftover를 Program nested에 넣지 않는다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-economy', {
      'recruit.maxClassCount': 99,
      'recruit.inquiryContact': '스토어 기관',
    })
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', {
      'recruit.instructor.inquiryContact': '스토어 강사',
    })
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    values.publicProgramTitle = 'CREATE'
    values.operationRange = { start: '2026-03-01', end: '2026-11-30' }
    values.recruitment.maxClassCount = 4
    values.recruitment.inquiryContact = 'RHF 기관'
    values.instructorRecruit.inquiryContact = 'RHF 강사'
    values.instructorRecruit.announcementPublished = 'published'
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-no-store', values })
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.maxClassCount).toBe(4)
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName).toBe(
      'RHF 기관'
    )
    expect(program.generalCommonInfo?.instructorRecruitmentInfo?.contactOrganizationName).toBe(
      'RHF 강사'
    )
    expect(JSON.stringify(program)).not.toContain('스토어 기관')
    expect(JSON.stringify(program)).not.toContain('스토어 강사')
    expect(JSON.stringify(program)).not.toContain('application.instructor')
    expect(JSON.stringify(program)).not.toContain('recruit.volunteer')
    expect(JSON.stringify(program)).not.toContain('recruit.individual')
  })
})
