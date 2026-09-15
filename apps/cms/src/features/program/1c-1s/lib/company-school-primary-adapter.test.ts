import { describe, expect, it } from 'vitest'
import { mapCompanySchoolDetailToProgram } from '@/features/program/1c-1s/api/adapters'
import { parseCompanySchoolServiceDetailJson } from '@/features/program/1c-1s/api/service-detail-json'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { mapRequestedSchedulesToSessions } from '@/features/program/1c-1s/lib/map-requested-schedules'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'

const ONE_01_FLAT_CONFIG = {
  schemaVersion: 1,
  seedCase: 'ONE-01',
  frontendProgramId: 'company-school-primary-01',
  generalProgramAudience: 'organization',
  generalProgramEducationStructure: 'curriculum',
  generalProgramSessionRound: 'single',
  generalParticipantTypes: ['school_institution', 'teacher_instructor'],
  generalSurveyMenuKeys: [],
  studentListRequired: 'not_required',
  preEducationNoticeRequired: true,
  generalCommonInfo: {
    curriculumSessions: [
      { sessionLabel: '1차시', title: '1단원' },
      { sessionLabel: '2차시', title: '2단원' },
    ],
    participantRecruitmentInfo: {
      maxClassCount: 4,
      maxAssignableInstructors: 2,
      studentListRequired: 'not_required',
      studentListRequiredLabel: '명단 미제출',
      announcementPublished: true,
      announcementPublishedLabel: '공고 게시',
      inquiryTel: '02-1234-5678',
      preEducationNoticeRequired: true,
    },
    instructorRecruitmentInfo: {
      recruitmentTarget: 'JA 강사',
      announcementPublished: true,
    },
    wageGradeRows: [{ grade: '1급 강사비', pricing: '기본 500,000원' }],
  },
}

describe('company-school Primary ONE adapter', () => {
  it('parses flat Primary serviceDetailJson (not only {program} envelope)', () => {
    const partial = parseCompanySchoolServiceDetailJson(JSON.stringify(ONE_01_FLAT_CONFIG))
    expect(partial.studentListRequired).toBe('not_required')
    expect(partial.generalSurveyMenuKeys).toEqual([])
    expect(partial.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors).toBe(2)
    expect(partial.generalCommonInfo?.instructorRecruitmentInfo).toBeTruthy()
    expect(partial.generalVolunteers).toBe(0)
    expect(partial.generalParticipantTypes).not.toContain('volunteer')
  })

  it('maps 170001 detail with settlementPolicy wages and Primary id heuristic', () => {
    const program = mapCompanySchoolDetailToProgram({
      id: '170001',
      programType: 'COMPANY_SCHOOL',
      title: '[1사1교] ONE-01 테스트',
      mainTitle: 'ONE-01',
      contactEmail: 'cs.primary.case1@jakorea.local',
      serviceDetailJson: JSON.stringify(ONE_01_FLAT_CONFIG),
      settlementPolicy: {
        wagePolicies: [
          { feeGrade: 'GRADE_1', feeKind: 'NORMAL', amount: 500000 },
          { feeGrade: 'GRADE_1', feeKind: 'LONG_DISTANCE', amount: 500000 },
          { feeGrade: 'GRADE_2', feeKind: 'NORMAL', amount: 400000 },
          { feeGrade: 'GRADE_3', feeKind: 'NORMAL', amount: 300000 },
        ],
        paymentItems: [
          { itemType: 'TRANSPORTATION', useYn: true },
          { itemType: 'LODGING', useYn: true },
        ],
      },
      attachmentFileNames: ['a.pdf', 'b.pdf'],
    } as ProgramResponse)

    expect(isCompanySchoolProgram(program)).toBe(true)
    expect(program.generalCommonInfo?.wageGradeRows?.[0]?.grade).toBe('1급 강사비')
    expect(program.generalCommonInfo?.paymentItems).toContain('교통비')
    expect(program.studentListRequired).toBe('not_required')
    expect(program.generalSurveyMenuKeys).toEqual([])
    expect(program.attachmentFileNames).toHaveLength(2)
  })

  it('maps requested schedules to sessions (max 2, preference order)', () => {
    const sessions = mapRequestedSchedulesToSessions([
      {
        preferenceOrder: 2,
        requestedDate: '2026-05-20',
        startPeriod: 3,
        sessionCount: 2,
        combinedClassYn: false,
      },
      {
        preferenceOrder: 1,
        requestedDate: '2026-05-12',
        startPeriod: 1,
        sessionCount: 1,
        combinedClassYn: false,
      },
    ])
    expect(sessions).toHaveLength(2)
    expect(sessions?.[0]?.round).toBe(1)
    expect(sessions?.[0]?.classNum).toBe('1교시')
    expect(sessions?.[1]?.round).toBe(2)
    expect(sessions?.[1]?.timeRange).toContain('3교시')
  })
})
