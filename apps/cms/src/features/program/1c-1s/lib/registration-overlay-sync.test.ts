import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resetProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { applyEconomyRegistrationOverlayToProgram } from '@/features/program/general/lib/economy-registration-overlay-to-program'
import {
  buildEconomyRegistrationOverlayFromProgram,
  seedEconomyRegistrationOverlayFromProgram,
  readEconomyRegistrationOverlayForSave,
} from './registration-overlay-sync'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'

function baseProgram(): Program {
  return {
    id: 'company-school-local-1',
    title: '1사1교 테스트',
    mainTitle: '디지털 리터러시 교실',
    titleEn: 'Digital Literacy Classroom',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    detailedProgramId: '163050',
    businessArea: '디지털 리터러시',
    educationProcess: 'Digital (Computer)',
    ipOwned: 'JA',
    courseDeliveredBy: 'JA',
    ips: 'Prepare',
    partnerInvolvement: true,
    generalCommonInfo: {
      announcementTitle: '공고용 디지털 리터러시',
      detailedProgramName: '여름방학 집중 캠프',
      curriculumSessions: [
        { sessionLabel: '1차시', title: '단원1', description: '내용1' },
        { sessionLabel: '2차시', title: '단원2', description: '내용2' },
      ],
      educationScheduleLines: ['2026. 10. 11 ~ 2026. 11. 09'],
      wageGradeRows: [
        { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 140,000원 | 장거리 : 50,000원' },
      ],
      kpi: {
        finalParticipants: 49,
        instructorCount: 3,
        volunteerCount: 0,
        finalSchools: 9,
        finalClasses: 13,
      },
    },
  } as Program
}

describe('buildEconomyRegistrationOverlayFromProgram → apply', () => {
  beforeEach(() => {
    resetProgramRegistrationOverlay()
  })

  it('제목·세부프로그램·교육과정·KPI·커리큘럼을 왕복한다', () => {
    const overlay = buildEconomyRegistrationOverlayFromProgram(baseProgram())
    expect(overlay['economyRegistration.basicInfo.repKo']).toBe('디지털 리터러시 교실')
    expect(overlay['economyRegistration.basicInfo.detailedProgramId']).toBe('163050')
    expect(overlay['economyRegistration.basicInfo.educationCourse']).toBe('digital_computer')
    expect(overlay['economyRegistration.kpi.participantCount']).toBe(49)
    expect(overlay['economyRegistration.educationCurriculum.session1.title']).toBe('단원1')

    const next = applyEconomyRegistrationOverlayToProgram(baseProgram(), overlay)
    expect(next.mainTitle).toBe('디지털 리터러시 교실')
    expect(next.detailedProgramId).toBe('163050')
    expect(next.educationProcess).toBe('Digital (Computer)')
    expect(next.generalCommonInfo?.kpi?.finalParticipants).toBe(49)
    expect(next.generalCommonInfo?.curriculumSessions?.[0]?.title).toBe('단원1')
  })

  it('seed 후 read는 economy prefix만 반환한다', () => {
    seedEconomyRegistrationOverlayFromProgram(baseProgram())
    const saved = readEconomyRegistrationOverlayForSave()
    expect(Object.keys(saved).every(key => key.startsWith('economyRegistration.'))).toBe(true)
    expect(saved['economyRegistration.basicInfo.repKo']).toBe('디지털 리터러시 교실')
  })

  it('후원사만 있고 담당자가 없으면 수정 overlay에 미선택을 시드한다', () => {
    const overlay = buildEconomyRegistrationOverlayFromProgram({
      ...baseProgram(),
      sponsorId: '1627251',
      managerName: '미선택',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        sponsorManagementIds: ['1627251'],
        sponsorManagerContactIds: [],
        sponsorManagerLine: '미선택',
      },
    })
    expect(overlay['economyRegistration.basicInfo.managerContactIds']).toEqual([
      SPONSOR_CONTACT_UNSELECTED_VALUE,
    ])
    expect(overlay['economyRegistration.basicInfo.managerContactId']).toBe(
      SPONSOR_CONTACT_UNSELECTED_VALUE
    )
  })
})
