/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { serializeCompanySchoolDetailPatchOverlay } from './registration-overlay-sync'

function baseProgram(overlay: Record<string, unknown>): Program {
  return {
    id: '186910',
    backendProgramType: 'COMPANY_SCHOOL',
    sponsorId: 'sponsor-cs',
    title: '1사1교 패치',
    mainTitle: '1사1교 패치',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-03-01',
    endDate: '2026-11-30',
    status: 'pending',
    rounds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    generalCommonInfo: {
      announcementTitle: '공고',
      paymentItems: '교통비(일사일교)',
      curriculumSessions: [{ sessionLabel: '1차시', title: '유지 제목', description: '유지 설명' }],
      kpi: {
        finalParticipants: 3,
        instructorCount: 1,
        volunteerCount: 0,
        finalSchools: 2,
        finalClasses: 4,
      },
      participantRecruitmentInfo: {
        contactOrganizationName: '기관 담당',
        recruitmentPeriodLabel: '2026.03.01 ~ 2026.03.10',
      },
      instructorRecruitmentInfo: {
        contactOrganizationName: '강사 담당',
        recruitmentPeriodLabel: '2026.04.01 ~ 2026.04.10',
      },
    },
    registrationOverlay: overlay,
  }
}

describe('serializeCompanySchoolDetailPatchOverlay', () => {
  it('공통정보 PATCH 시 강사·기관 leftover 와 sidecar 를 유지한다', () => {
    const leftover = {
      'economyRegistration.kpi.volunteer': 9,
      'economyRegistration.kpi.educationProgress.note': '',
      'application.instructor.memo': 'keep',
      'recruit.notes': '기관 비고',
      'instructorRecruit.notes': '강사 비고',
      'economyRegistration.wageInfo.paymentItemValues': ['stale-id'],
      'economyRegistration.basicInfo.publicProgramTitle': '옛 공고',
    }
    const typed = baseProgram(leftover)
    typed.generalCommonInfo = {
      ...typed.generalCommonInfo,
      announcementTitle: '새 공고',
      paymentItems: '',
    }
    const overlay = serializeCompanySchoolDetailPatchOverlay({
      typedProgram: {
        ...typed,
        registrationOverlay: {
          ...leftover,
          'economyRegistration.wageInfo.paymentItemValues': [],
          'economyRegistration.basicInfo.publicProgramTitle': '새 공고',
        },
      },
      leftoverOverlay: leftover,
    })

    expect(overlay['economyRegistration.basicInfo.publicProgramTitle']).toBe('새 공고')
    expect(overlay['economyRegistration.wageInfo.paymentItemValues']).toEqual([])
    expect(overlay['economyRegistration.kpi.volunteer']).toBe(9)
    expect(overlay['economyRegistration.kpi.educationProgress.note']).toBe('')
    expect(overlay['application.instructor.memo']).toBe('keep')
    expect(overlay['recruit.notes']).toBe('기관 비고')
    expect(overlay['instructorRecruit.notes']).toBe('강사 비고')
  })

  it('강사 leftover 만 바꿔도 기관 leftover 가 지워지지 않는다', () => {
    const leftover = {
      'recruit.inquiryContact': '기관',
      'instructorRecruit.inquiryContact': '강사',
    }
    const typed = baseProgram(leftover)
    const overlay = serializeCompanySchoolDetailPatchOverlay({
      typedProgram: {
        ...typed,
        registrationOverlay: {
          ...leftover,
          'instructorRecruit.inquiryContact': '강사 수정',
        },
      },
      leftoverOverlay: {
        ...leftover,
        'instructorRecruit.inquiryContact': '강사 수정',
      },
    })
    expect(overlay['recruit.inquiryContact']).toBe('기관')
    expect(overlay['instructorRecruit.inquiryContact']).toBe('강사 수정')
  })
})
