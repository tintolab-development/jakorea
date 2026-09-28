import { beforeEach, describe, expect, it } from 'vitest'
import {
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { buildGeneralProgramListRowFromRegistrationSnapshot } from './registration-local-save'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'

const organizationOnlyParticipant: ProgramRegistrationParticipantState = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
}

beforeEach(() => {
  resetProgramRegistrationOverlay()
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
