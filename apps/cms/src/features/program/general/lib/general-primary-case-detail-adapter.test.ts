import { describe, expect, it } from 'vitest'
import { mapAdminProgramDetailToProgram } from '@/features/program/general/api/adapters/general-program-adapters'
import { resolveGeneralProgramParticipantRecruitmentDisplay } from '@/features/program/general/lib/participant-recruitment-display'
import { parseGeneralProgramServiceDetailJson } from '@/features/program/general/lib/general-program-service-detail-json'
import { mapSettlementWagePoliciesToGradeRows } from '@/features/program/general/lib/settlement-policy-to-wage-rows'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'

/** Primary Case 1 (168001) — 기관·강사 ON·봉사 OFF·설문 OFF·사전 해당없음 */
const PRIMARY_CASE_1_SERVICE_DETAIL = {
  schemaVersion: 1,
  generalProgramAudience: 'organization',
  generalProgramEducationStructure: 'curriculum',
  generalProgramSessionRound: 'single',
  generalParticipantTypes: ['school_institution', 'teacher_instructor'],
  generalSurveyMenuKeys: [],
  generalParticipantInterviewEnabled: false,
  generalVolunteerInterviewEnabled: false,
  studentListRequired: 'required',
  contactPhone: '02-1680-0001',
  contactEmail: 'primary.case1@local.example',
  remarks: '로컬 데모 비고: Case 1 (ACTIVE)',
  inquiryTel: '02-1680-0001',
  inquiryEmail: 'primary.case1@local.example',
  announcementPublished: true,
  announcementPublishedLabel: '게시',
  studentListRequiredLabel: '제출 필요',
  preEducationNoticeRequired: false,
  preEducationNoticeRequiredLabel: '해당없음',
  maxAssignableInstructors: 2,
  maxClassCount: 4,
  participantRecruitment: {
    announcementPublished: true,
    announcementPublishedLabel: '게시',
    studentListRequired: 'required',
    studentListRequiredLabel: '제출 필요',
    preEducationNoticeRequired: false,
    preEducationNoticeRequiredLabel: '해당없음',
    maxAssignableInstructors: 2,
    maxClassCount: 4,
    operationPeriodLabel: '2026-08-16 ~ 2026-11-14',
    recruitmentPeriodLabel: '2026-06-17 ~ 2026-08-15',
    finalAnnouncementLabel: '2026-08-15 | 홈페이지 공지 및 담당교사 개별 안내',
    inquiryTel: '02-1680-0001',
    inquiryEmail: 'primary.case1@local.example',
    remarks: '로컬 데모 비고: Case 1 참여 모집 (ACTIVE)',
    contactOrganizationName: '로컬나눔은행, 스타벅스',
    educationTarget: '중등',
    educationTargetDetail: '중학교 1~3학년',
  },
  instructorRecruitment: {
    announcementPublished: true,
    announcementPublishedLabel: '게시',
    recruitmentTarget: '교사 강사',
    inquiryTel: '02-1680-0001',
    inquiryEmail: 'primary.case1@local.example',
    remarks: '로컬 데모 비고: Case 1 강사 모집',
  },
  generalCommonInfo: {
    participantRecruitmentInfo: {
      announcementPublished: true,
      announcementPublishedLabel: '게시',
      studentListRequired: 'required',
      studentListRequiredLabel: '제출 필요',
      preEducationNoticeRequired: false,
      preEducationNoticeRequiredLabel: '해당없음',
      maxAssignableInstructors: 2,
      maxClassCount: 4,
      operationPeriodLabel: '2026-08-16 ~ 2026-11-14',
      recruitmentPeriodLabel: '2026-06-17 ~ 2026-08-15',
      finalAnnouncementLabel: '2026-08-15 | 홈페이지 공지 및 담당교사 개별 안내',
      inquiryTel: '02-1680-0001',
      inquiryEmail: 'primary.case1@local.example',
      remarks: '로컬 데모 비고: Case 1 참여 모집 (ACTIVE)',
      contactOrganizationName: '로컬나눔은행, 스타벅스',
      educationTarget: '중등',
      educationTargetDetail: '중학교 1~3학년',
    },
    instructorRecruitmentInfo: {
      announcementPublished: true,
      announcementPublishedLabel: '게시',
      recruitmentTarget: '교사 강사',
    },
    wageGradeRows: [
      { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 200,000원 | 장거리 : 250,000원' },
    ],
  },
}

describe('Primary 8 detail adapter', () => {
  it('parses Case1 serviceDetailJson and hydrates studentList / recruitment aliases', () => {
    const partial = parseGeneralProgramServiceDetailJson(
      JSON.stringify(PRIMARY_CASE_1_SERVICE_DETAIL)
    )

    expect(partial.studentListRequired).toBe('required')
    expect(partial.generalSurveyMenuKeys).toEqual([])
    expect(partial.generalParticipantTypes).toEqual([
      'school_institution',
      'teacher_instructor',
    ])
    expect(partial.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors).toBe(2)
    expect(partial.generalCommonInfo?.instructorRecruitmentInfo).toBeTruthy()
    expect(partial.generalCommonInfo?.volunteerRecruitmentInfo).toBeUndefined()
  })

  it('fills participant recruitment display without "-" for Case1 core fields', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '168001',
      programType: 'GENERAL_ORGANIZATION',
      title: '[기관] 커리큘럼형 단일회차 테스트 프로그램',
      contactPhone: '02-1680-0001',
      contactEmail: 'primary.case1@local.example',
      remarks: 'typed remarks',
      serviceDetailJson: JSON.stringify(PRIMARY_CASE_1_SERVICE_DETAIL),
      settlementPolicy: {
        wagePolicies: [
          { feeGrade: 'GRADE_1', feeKind: 'NORMAL', amount: 200000 },
          { feeGrade: 'GRADE_1', feeKind: 'LONG_DISTANCE', amount: 250000 },
          { feeGrade: 'GRADE_2', feeKind: 'NORMAL', amount: 160000 },
          { feeGrade: 'GRADE_2', feeKind: 'LONG_DISTANCE', amount: 200000 },
          { feeGrade: 'GRADE_3', feeKind: 'NORMAL', amount: 120000 },
          { feeGrade: 'GRADE_3', feeKind: 'LONG_DISTANCE', amount: 150000 },
        ],
        paymentItems: [
          { itemType: 'TRANSPORTATION', useYn: true },
          { itemType: 'LODGING', useYn: true },
        ],
        deductionType: 'NONE',
      },
      attachmentFileNames: ['a.pdf', 'b.pdf'],
    } as ProgramResponse)

    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)

    expect(display.announcementPublishedLabel).toBe('게시')
    expect(display.studentListLabel).toBe('제출 필요')
    expect(display.preEducationNoticeLabel).toBe('해당없음')
    expect(display.maxInstructorsLabel).toBe('2명')
    expect(display.maxClassLabel).toBe('4개')
    expect(display.contactPhone).toBe('02-1680-0001')
    expect(display.contactEmail).toBe('primary.case1@local.example')
    expect(display.notes).not.toBe('-')
    expect(program.generalParticipantTypes).toContain('teacher_instructor')
    expect(program.generalParticipantTypes).not.toContain('volunteer')
    expect(program.generalSurveyMenuKeys).toEqual([])
    expect(program.generalCommonInfo?.instructorRecruitmentInfo).toBeTruthy()
    expect(program.generalCommonInfo?.volunteerRecruitmentInfo).toBeUndefined()
    expect(program.generalCommonInfo?.wageGradeRows).toHaveLength(3)
    expect(program.generalCommonInfo?.wageGradeRows?.[0]?.grade).toBe('1급 강사비')
    expect(program.generalCommonInfo?.paymentItems).toContain('교통비')
    expect(program.attachmentFileNames).toHaveLength(2)
  })

  it('maps settlementPolicy wage rows for grades 1–3', () => {
    const rows = mapSettlementWagePoliciesToGradeRows([
      { feeGrade: 'GRADE_1', feeKind: 'NORMAL', amount: 200000 },
      { feeGrade: 'GRADE_1', feeKind: 'LONG_DISTANCE', amount: 250000 },
      { feeGrade: 'GRADE_2', feeKind: 'NORMAL', amount: 160000 },
      { feeGrade: 'GRADE_3', feeKind: 'NORMAL', amount: 120000 },
    ])
    expect(rows).toHaveLength(3)
    expect(rows?.[0]?.pricing).toContain('200,000원')
    expect(rows?.[0]?.pricing).toContain('250,000원')
  })

  it('keeps Case3 instructor OFF and volunteer ON in parsed axes', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '168003',
      title: '[기관] 일정형 단일회차 테스트 프로그램',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        generalParticipantTypes: ['school_institution', 'volunteer'],
        generalSurveyMenuKeys: ['survey'],
        generalCommonInfo: {
          participantRecruitmentInfo: { announcementPublished: true },
          volunteerRecruitmentInfo: { announcementPublished: true },
        },
      }),
    } as ProgramResponse)

    expect(program.generalParticipantTypes).not.toContain('teacher_instructor')
    expect(program.generalCommonInfo?.instructorRecruitmentInfo).toBeUndefined()
    expect(program.generalCommonInfo?.volunteerRecruitmentInfo).toBeTruthy()
  })

  it('keeps Case5 participant-only axes and labels false as 미게시/해당없음', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '168005',
      title: '[개인] 커리큘럼형 단일회차 테스트 프로그램',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        generalProgramAudience: 'individual',
        generalParticipantTypes: ['individual'],
        generalSurveyMenuKeys: [],
        generalCommonInfo: {
          participantRecruitmentInfo: {
            announcementPublished: false,
            announcementPublishedLabel: '미게시',
            studentListRequired: 'not_required',
            studentListRequiredLabel: '제출 불필요',
            preEducationNoticeRequired: false,
            preEducationNoticeRequiredLabel: '해당없음',
          },
        },
      }),
    } as ProgramResponse)

    expect(program.generalParticipantTypes).toEqual(['individual'])
    expect(program.generalCommonInfo?.instructorRecruitmentInfo).toBeUndefined()
    expect(program.generalCommonInfo?.volunteerRecruitmentInfo).toBeUndefined()
    expect(program.generalSurveyMenuKeys).toEqual([])
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
    expect(display.announcementPublishedLabel).toBe('미게시')
    expect(display.studentListLabel).toBe('제출 불필요')
    expect(display.preEducationNoticeLabel).toBe('해당없음')
  })
})
