import { beforeEach, describe, expect, it } from 'vitest'
import {
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  patchApplicantRecruitInstitutionOverlay,
  resetApplicantRecruitInstitutionOverlay,
  setApplicantRecruitInstitutionOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  patchGeneralRecruitOverlay,
  setGeneralRecruitOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resetAllOperationalOverlayStoresForTests } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  buildGeneralProgramListRowFromRegistrationSnapshot,
  resolveTrainedTeacherEducationJournalEnabled,
} from './registration-local-save'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'

const organizationOnlyParticipant: ProgramRegistrationParticipantState = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
}

const individualOnlyParticipant: ProgramRegistrationParticipantState = {
  individual: true,
  organization: false,
  teacherInstructor: false,
  volunteer: false,
}

beforeEach(() => {
  resetAllOperationalOverlayStoresForTests()
  resetProgramRegistrationOverlay()
  resetApplicantRecruitInstitutionOverlay()
})

describe('buildGeneralProgramListRowFromRegistrationSnapshot — 세부 프로그램명 (버그 수정 확인, 일정형)', () => {
  it('교육받은 교사 — 일정형에서도 수동 선택한 세부 프로그램명이 그대로 저장된다', () => {
    replaceProgramRegistrationOverlay({
      'trainedTeachersRegistration.basicInfo.detailedProgramId': 'dp-1',
      'trainedTeachersRegistration.basicInfo.detailedProgramName': '실제 선택한 세부 프로그램명',
    })

    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'trained-teachers-local-test-1',
      participant: organizationOnlyParticipant,
      programType: 'schedule',
      variant: 'trainedTeachers',
      sessionRoundType: 'single',
      scheduleCurriculumDetailCount: 1,
    })

    expect(program.generalCommonInfo?.detailedProgramName).toBe('실제 선택한 세부 프로그램명')
    expect(program.detailedProgramId).toBe('dp-1')
    // 버그 수정 확인: textbookName/teamDivision이 스케줄 상세명으로 덮어써지지 않는다
    expect(program.textbookName).not.toBe('해당없음')
    expect(program.teamDivision).not.toBe('해당없음')
  })

  it('교육받은 교사 — 커리큘럼형에서도 수동 선택한 세부 프로그램명이 그대로 저장된다', () => {
    replaceProgramRegistrationOverlay({
      'trainedTeachersRegistration.basicInfo.detailedProgramId': 'dp-2',
      'trainedTeachersRegistration.basicInfo.detailedProgramName': '커리큘럼형 세부 프로그램명',
    })

    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'trained-teachers-local-test-2',
      participant: organizationOnlyParticipant,
      programType: 'curriculum',
      variant: 'trainedTeachers',
      sessionRoundType: 'single',
    })

    expect(program.generalCommonInfo?.detailedProgramName).toBe('커리큘럼형 세부 프로그램명')
    expect(program.detailedProgramId).toBe('dp-2')
  })

  it('1사1교 — 후원사 overlay를 sponsorId에 반영한다', () => {
    replaceProgramRegistrationOverlay({
      'economyRegistration.basicInfo.sponsorId': '163388',
    })

    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'company-school-local-test-sponsor',
      participant: organizationOnlyParticipant,
      programType: 'curriculum',
      variant: 'economy',
      sessionRoundType: 'single',
    })

    expect(program.sponsorId).toBe('163388')
    expect(program.generalCommonInfo?.sponsorManagementIds).toEqual(['163388'])
  })

  it('1사1교 — 수동 선택한 세부 프로그램명이 그대로 저장된다 (1사1교는 커리큘럼형 고정)', () => {
    replaceProgramRegistrationOverlay({
      'economyRegistration.basicInfo.detailedProgramId': '163003',
      'economyRegistration.basicInfo.detailedProgramName': '1사1교 실제 선택 세부 프로그램명',
    })

    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'company-school-local-test-1',
      participant: organizationOnlyParticipant,
      programType: 'curriculum',
      variant: 'economy',
      sessionRoundType: 'single',
    })

    expect(program.generalCommonInfo?.detailedProgramName).toBe('1사1교 실제 선택 세부 프로그램명')
    // 버그 수정 확인: name만 반영되고 top-level detailedProgramId는 세팅되지 않아
    // 실제 요청에서 항상 빠지던 문제 (BE가 id로 조회 → "세부 프로그램명 없음" 오류)
    expect(program.detailedProgramId).toBe('163003')
    // 1사1교는 「교육 진행 구조」 선택 자체가 없다 — 항상 curriculum으로 고정된다
    expect(program.generalProgramEducationStructure).toBe('curriculum')
  })

  it('1사1교 — 참여 기관 모집 비고를 remarks로 반영한다', () => {
    setGeneralRecruitOverlayScope('recruitment-economy')
    patchGeneralRecruitOverlay({
      'recruit.individual.notes': '일정은 학교 사정에 따라 조율할 수 있습니다.',
    })
    setApplicantRecruitInstitutionOverlayScope('recruitment-economy')
    patchApplicantRecruitInstitutionOverlay({ 'recruit.notes': '테스토 비고' })

    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'company-school-local-test-notes',
      participant: organizationOnlyParticipant,
      programType: 'curriculum',
      variant: 'economy',
      sessionRoundType: 'single',
    })

    expect(program.remarks).toBe('테스토 비고')
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('테스토 비고')
  })

  it('(대조군) 일반 프로그램 — 일정형은 여전히 세부 프로그램명이 스케줄 상세명으로 잠긴다', () => {
    replaceProgramRegistrationOverlay({
      'generalRegistration.basicInfo.detailedProgramId': 'dp-4',
      'generalRegistration.basicInfo.detailedProgramName': '일반 프로그램에서 고른 값 (무시되어야 함)',
    })

    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'general-local-test-1',
      participant: organizationOnlyParticipant,
      programType: 'schedule',
      variant: 'general',
      sessionRoundType: 'single',
      scheduleCurriculumDetailCount: 1,
    })

    expect(program.generalCommonInfo?.detailedProgramName).not.toBe(
      '일반 프로그램에서 고른 값 (무시되어야 함)'
    )
  })
})

describe('buildGeneralProgramListRowFromRegistrationSnapshot — 모집 overlay peek', () => {
  it('신청 단계 스코프여도 선택된 모집 버킷 문의처·설명을 스냅샷에 남긴다', () => {
    setGeneralRecruitOverlayScope('recruitment-participant-individual')
    patchGeneralRecruitOverlay({
      'recruit.individual.inquiryContact': '박지훈',
      'recruit.detailInfo.programDescription':
        '디지털 리터러시 교실은 학교에서 경제·금융 기초를 익히는 참여형 교육입니다.',
    })
    replaceProgramRegistrationOverlay({
      'recruit.individual.inquiryContact': '',
      'recruit.detailInfo.programDescription': '',
    })
    setGeneralRecruitOverlayScope('application-participant-individual')

    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'general-local-test-recruit-peek',
      participant: individualOnlyParticipant,
      programType: 'curriculum',
      variant: 'general',
    })

    expect(program.registrationOverlay?.['recruit.individual.inquiryContact']).toBe('박지훈')
    expect(program.registrationOverlay?.['recruit.detailInfo.programDescription']).toBe(
      '디지털 리터러시 교실은 학교에서 경제·금융 기초를 익히는 참여형 교육입니다.'
    )
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName).toBe(
      '박지훈'
    )
    expect(program.description).toBe(
      '디지털 리터러시 교실은 학교에서 경제·금융 기초를 익히는 참여형 교육입니다.'
    )
  })
})

describe('교육받은 교사 교육일지 등록 기본값', () => {
  it('설정이 없으면 없음으로 정규화한다', () => {
    expect(resolveTrainedTeacherEducationJournalEnabled(undefined)).toBe(false)
    expect(resolveTrainedTeacherEducationJournalEnabled(null)).toBe(false)
  })

  it('명시적인 있음/없음 설정을 우선한다', () => {
    expect(resolveTrainedTeacherEducationJournalEnabled('yes')).toBe(true)
    expect(resolveTrainedTeacherEducationJournalEnabled(true)).toBe(true)
    expect(resolveTrainedTeacherEducationJournalEnabled('no')).toBe(false)
    expect(resolveTrainedTeacherEducationJournalEnabled(false)).toBe(false)
  })

  it('설정이 없을 때만 기존 snapshot fallback을 사용한다', () => {
    expect(resolveTrainedTeacherEducationJournalEnabled(undefined, true)).toBe(true)
    expect(resolveTrainedTeacherEducationJournalEnabled('no', true)).toBe(false)
  })
})
