import { describe, expect, it } from 'vitest'
import {
  filterIndividualDoc1Rows,
  mapApiApplicationStatusToApprovalStatus,
  mapIndividualApplicationDetailToApplicantRow,
  mapIndividualApplicationToApplicantRow,
  mapInstructorApplicationToApplicantInstructorRow,
  mapMaterialAssignmentStatusToTextbookStatus,
  mapOrganizationApplicationToApplicantSchoolRow,
  mapParticipantToParticipatingIndividualRow,
  mapParticipantToParticipatingInstructorRow,
  mapParticipantToParticipatingSchoolRow,
  mapParticipantToParticipatingVolunteerRow,
  mapVolunteerApplicationToGeneralVolunteerApplicantRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
} from '@/features/program/general/lib/general-program-service-detail-json'
import type { Program } from '@/types/domain'

describe('general-applications-adapters', () => {
  it('maps API application status to approval status', () => {
    expect(mapApiApplicationStatusToApprovalStatus('APPROVED')).toBe('approved')
    expect(mapApiApplicationStatusToApprovalStatus('WAITING_REVIEW')).toBe('pending')
    expect(mapApiApplicationStatusToApprovalStatus('REJECTED')).toBe('rejected')
  })

  it('maps organization application list item to applicant row', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 101,
        organizationId: 8801,
        teacherMemberId: 9901,
        organizationName: '서울초',
        teacherName: '김교사',
        requestedClassCount: 2,
        requestedStudentCount: 40,
        applicationStatus: 'WAITING_REVIEW',
        submittedAt: '2026-04-01T00:00:00Z',
      },
      0,
      '5001'
    )

    expect(row.id).toBe('101')
    expect(row.organizationId).toBe(8801)
    expect(row.teacherMemberId).toBe(9901)
    expect(row.schoolName).toBe('서울초')
    expect(row.approvalStatus).toBe('pending')
    expect(row.programId).toBe('5001')
  })

  it('maps ORGANIZATION participant give-up fields to participating school row', () => {
    const active = mapParticipantToParticipatingSchoolRow(
      {
        participantId: 1691423,
        memberName: '테스트초',
        teacherMemberId: 9901,
        participantStatus: 'APPROVED',
        availableActions: ['VIEW', 'GIVE_UP'],
      } as never,
      0,
      '168001'
    )
    expect(active.id).toBe('1691423')
    expect(active.teacherMemberId).toBe(9901)
    expect(active.activityWithdrawn).toBe(false)
    expect(active.availableActions).toEqual(['VIEW', 'GIVE_UP'])

    const withdrawn = mapParticipantToParticipatingSchoolRow(
      {
        participantId: 1691424,
        organizationName: '포기초',
        participantStatus: 'GIVE_UP',
        giveUpAt: '2026-09-01T00:00:00Z',
        availableActions: ['VIEW'],
      } as never,
      1,
      '168002'
    )
    expect(withdrawn.schoolName).toBe('포기초')
    expect(withdrawn.activityWithdrawn).toBe(true)
    expect(withdrawn.giveUpAt).toBe('2026-09-01T00:00:00Z')
    expect(withdrawn.availableActions).toEqual(['VIEW'])
  })

  it.each([
    ['BEFORE_SHIPPING', 'preparing'],
    ['SHIPPING', 'shipping'],
    ['DELIVERED', 'delivered'],
    ['NOT_APPLICABLE', 'not_applicable'],
    [undefined, 'not_applicable'],
  ] as const)('maps material assignment status %s to %s', (status, expected) => {
    expect(mapMaterialAssignmentStatusToTextbookStatus(status)).toBe(expected)
  })

  it('maps saved affiliation fallback for individual, instructor, and volunteer participants', () => {
    const dto = {
      participantId: 1691500,
      memberName: '기존 회원',
      organizationId: 8801,
      organizationName: '기존 소속 기관',
    }

    const individual = mapParticipantToParticipatingIndividualRow(dto, 0, '168001')
    const instructor = mapParticipantToParticipatingInstructorRow(dto, 0, '168001')
    const volunteer = mapParticipantToParticipatingVolunteerRow(dto, 0, '168001')

    expect(individual.affiliationOrganizationId).toBe(8801)
    expect(individual.affiliation).toBe('기존 소속 기관')
    expect(instructor.affiliationOrganizationId).toBe(8801)
    expect(instructor.affiliation).toBe('기존 소속 기관')
    expect(volunteer.affiliationOrganizationId).toBe(8801)
    expect(volunteer.affiliation).toBe('기존 소속 기관')
  })

  it('does not invent affiliationOrganizationId from display name alone', () => {
    const row = mapIndividualApplicationToApplicantRow(
      {
        id: 56,
        programId: 5001,
        memberName: '이름만있는참여자',
        affiliationName: '서울초등학교',
        applicationStatus: 'WAITING_REVIEW',
      } as never,
      0,
      '5001'
    )

    expect(row.affiliationOrganizationId).toBeUndefined()
    expect(row.affiliation).toBe('서울초등학교')
  })

  it('maps instructor application list item to applicant row', () => {
    const row = mapInstructorApplicationToApplicantInstructorRow(
      {
        id: 77,
        instructorMemberId: 9001,
        affiliationOrganizationId: 8801,
        programId: 5001,
        instructorName: '이강사',
        applicationStatus: 'APPROVED',
        instructorFeeGradeSnapshot: '3급 강사비',
        submittedAt: '2026-04-02T00:00:00Z',
        rejectReason: '서류 미비',
      },
      0,
      '5001'
    )

    expect(row.id).toBe('77')
    expect(row.instructorMemberId).toBe(9001)
    expect(row.affiliationOrganizationId).toBe(8801)
    expect(row.programId).toBe('5001')
    expect(row.instructorName).toBe('이강사')
    expect(row.approvalStatus).toBe('approved')
    expect(row.instructorFeeGradeLabel).toBe('3급 강사비')
    expect(row.rejectionReason).toBe('서류 미비')
  })

  it('maps volunteer application list item to screening row', () => {
    const row = mapVolunteerApplicationToGeneralVolunteerApplicantRow(
      {
        id: 55,
        programId: 5001,
        affiliationOrganizationId: null,
        memberName: '김봉사',
        documentStatus: 'PASS',
        interviewStatus: 'ASSIGNED',
        finalResultStatus: 'RESERVE',
        reserveRank: 2,
        isReparticipation: true,
        giveUpYn: false,
        managerAEvaluation: 'NEUTRAL',
        managerBEvaluation: 'UNREVIEWED',
        canEditManagerAEvaluation: true,
        canEditManagerBEvaluation: false,
        availableActions: ['VIEW', 'UPDATE_DOCUMENT_EVALUATION'],
      },
      0,
      '5001'
    )

    expect(row.id).toBe('55')
    expect(row.affiliationOrganizationId).toBeNull()
    expect(row.name).toBe('김봉사')
    expect(row.documentScreeningStatus).toBe('pass')
    expect(row.interviewAssignmentStatus).toBe('assigned')
    expect(row.secondInterviewScreeningStatus).toBe('reserve2')
    expect(row.applicationType).toBe('ujat-graduate')
    expect(row.managerAEvaluation).toBe('neutral')
    expect(row.managerBEvaluation).toBe('unreviewed')
    expect(row.canEditManagerAEvaluation).toBe(true)
    expect(row.canEditManagerBEvaluation).toBe(false)
    expect(row.availableActions).toEqual(['VIEW', 'UPDATE_DOCUMENT_EVALUATION'])
  })

  it('maps individual application list item with screening fields', () => {
    const row = mapIndividualApplicationToApplicantRow(
      {
        id: 55,
        programId: 5001,
        affiliationOrganizationId: 8802,
        memberName: '김참여자',
        affiliationName: '한국대학교',
        applicationGrade: '2학년',
        homeAddressSummary: '서울특별시 강남구',
        managerComment: '신청 정보 재확인 필요',
        preferredEducationSchedules: [
          {
            scheduleId: 168362,
            round: 2,
            startAt: '2026-09-22T01:00:00Z',
            endAt: '2026-09-22T03:00:00Z',
          },
        ],
        applicationStatus: 'WAITING_REVIEW',
        documentStatus: 'DOCUMENT_PASSED',
        interviewStatus: 'ASSIGNED',
        finalResultStatus: 'RESERVE',
        reserveRank: 2,
        giveUpYn: false,
        managerAEvaluation: 'UNREVIEWED',
        managerBEvaluation: 'PASS',
        availableActions: ['VIEW', 'COMMENT_UPDATE', 'RESEND_NOTIFICATION'],
        submittedAt: '2026-04-03T00:00:00Z',
        assignedInterviewSlotId: 1001,
        assignedInterviewStartAt: '2026-04-10T10:00:00+09:00',
        assignedInterviewEndAt: '2026-04-10T11:00:00+09:00',
        interviewAvailabilityCount: 3,
        interviewAvailabilitySlots: [
          {
            startAt: '2026-09-18T01:00:00Z',
            endAt: '2026-09-18T02:00:00Z',
          },
          {
            startAt: '2026-09-18T05:00:00Z',
            endAt: '2026-09-18T06:00:00Z',
          },
          {
            startAt: '2026-09-20T01:00:00Z',
            endAt: '2026-09-20T02:00:00Z',
          },
        ],
      },
      0,
      '5001'
    )

    expect(row.id).toBe('55')
    expect(row.affiliationOrganizationId).toBe(8802)
    expect(row.applicantName).toBe('김참여자')
    expect(row.affiliation).toBe('한국대학교')
    expect(row.educationGrade).toBe('2학년')
    expect(row.homeAddress).toBe('서울특별시 강남구')
    expect(row.adminComment).toBe('신청 정보 재확인 필요')
    expect(row.sessions).toEqual([
      expect.objectContaining({
        round: 2,
        date: '2026.09.22',
        timeRange: '10:00 ~ 12:00',
        requestedScheduleId: 168362,
      }),
    ])
    expect(row.documentScreeningStatus).toBe('pass')
    expect(row.interviewAssignmentStatus).toBe('assigned')
    expect(row.secondInterviewScreeningStatus).toBe('reserve2')
    expect(row.programId).toBe('5001')
    expect(row.availableActions).toEqual(['VIEW', 'COMMENT_UPDATE', 'RESEND_NOTIFICATION'])
    expect(row.managerAEvaluation).toBe('unreviewed')
    expect(row.managerBEvaluation).toBe('pass')
    expect(row.assignedInterviewDateLabel).toBe('2026.04.10')
    expect(row.assignedInterviewTime).toContain('10:00')
    expect(row.interviewSlotCount).toBe(3)
    expect(row.detail?.interviewAvailability).toEqual([
      {
        dateLabel: '26. 09. 18(금)',
        slots: ['10:00 ~ 11:00', '14:00 ~ 15:00'],
      },
      {
        dateLabel: '26. 09. 20(일)',
        slots: ['10:00 ~ 11:00'],
      },
    ])
  })

  it('keeps reviewed applications in the first document screening list', () => {
    const rows = [
      { id: '1', documentScreeningStatus: 'pending' },
      { id: '2', documentScreeningStatus: 'fail' },
      { id: '3', documentScreeningStatus: 'pass' },
    ] as ReturnType<typeof mapIndividualApplicationToApplicantRow>[]

    expect(filterIndividualDoc1Rows(rows)).toEqual(rows)
  })

  it('maps masked individual detail without member-based fallback', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 1690625,
        programId: 168006,
        memberId: 190016,
        applicationStatus: 'APPROVED',
        managerComment: '상세 코멘트',
        availableActions: ['VIEW', 'RESEND_NOTIFICATION'],
        canEditManagerAEvaluation: true,
        canEditManagerBEvaluation: false,
        privacyMaskingLevel: 'MASKED',
        canRevealPersonalInfo: true,
        profile: {
          name: '김*자',
          affiliationSchool: 'Case6 QA school 5',
          affiliationGrade: '대학교 2학년',
          contact: '010-****-1234',
        },
        application: {
          selfIntroduction: '신청 시점 자기소개',
          preferredEducationSchedules: [{ scheduleId: 168362, round: 1 }],
          scheduleChangeCancelCount: 2,
        },
        textbook: {
          id: 168036,
          name: '개인 프로그램 교재',
          kits: 3,
          quantity: 3,
          status: 'PREPARING',
        },
        team: {
          name: '우리가 최고',
          memberCount: 3,
          role: 'LEADER',
        } as never,
        screening: {
          documentStatus: 'PASS',
          documentEvaluations: {
            managerA: { evaluation: 'PASS' } as never,
            managerB: { evaluation: 'NEUTRAL' } as never,
          },
          interviewEvaluations: [
            { evaluatorOrder: 1, score: 42 },
            { evaluatorOrder: 2, score: 45 },
          ],
          interviewTotalScore: 87,
          interviewEvaluationRemark: '면접 평가',
          finalResultStatus: 'PASS',
          giveUpYn: false,
        },
        interviewAvailabilitySlots: [
          {
            startAt: '2026-09-18T01:00:00Z',
            endAt: '2026-09-18T02:00:00Z',
          },
        ],
        interviewAvailabilityCount: 1,
        assignedInterviewSlotId: 1690961,
        assignedInterviewStartAt: '2026-09-18T01:00:00Z',
        assignedInterviewEndAt: '2026-09-18T02:00:00Z',
      },
      {
        id: '1690625',
        no: 1,
        applicantName: '목록 이름',
        affiliation: '목록 소속',
        educationGrade: '목록 학년',
        homeAddress: '목록 주소',
        approvalStatus: 'pending',
      }
    )

    expect(row.memberId).toBe('190016')
    expect(row.applicantName).toBe('김*자')
    expect(row.privacyMaskingLevel).toBe('MASKED')
    expect(row.canRevealPersonalInfo).toBe(true)
    expect(row.managerAEvaluation).toBe('pass')
    expect(row.managerBEvaluation).toBe('neutral')
    expect(row.managerAScore).toBe(42)
    expect(row.managerBScore).toBe(45)
    expect(row.totalScore).toBe(87)
    expect(row.detail?.selfIntroduction).toBe('신청 시점 자기소개')
    expect(row.detail?.scheduleChangeCancelCount).toBe(2)
    expect(row.textbookId).toBe('168036')
    expect(row.detail?.teamName).toBe('우리가 최고')
    expect(row.detail?.teamMemberCount).toBe(3)
    expect(row.detail?.teamRole).toBe('leader')
    expect(row.interviewSlotCount).toBe(1)
    expect(row.assignedInterviewDateLabel).toBe('2026.09.18')
  })

  it('uses the document-evaluation action when slot edit flags are omitted', () => {
    const base = {
      id: '1690625',
      no: 1,
      applicantName: '목록 이름',
      affiliation: '목록 소속',
      educationGrade: '목록 학년',
      homeAddress: '목록 주소',
      approvalStatus: 'pending',
    } as const
    const row = mapIndividualApplicationDetailToApplicantRow(
      {
        id: 1690625,
        programId: 168006,
        applicationStatus: 'PENDING',
        availableActions: ['VIEW', 'UPDATE_DOCUMENT_EVALUATION'],
      },
      base
    )

    expect(row.canEditManagerAEvaluation).toBe(true)
    expect(row.canEditManagerBEvaluation).toBe(true)
  })
})

describe('general-program-service-detail-json', () => {
  it('round-trips CMS-only nested fields including education structure', () => {
    const program = {
      generalCommonInfo: { educationScheduleMode: 'period' as const },
      generalParticipantTypes: ['individual' as const],
      targetLevels: ['elementary' as const],
      generalProgramEducationStructure: 'curriculum' as const,
      generalProgramSessionRound: 'single' as const,
      generalProgramAudience: 'organization' as const,
    } as Program

    const raw = serializeGeneralProgramServiceDetailJson(program)
    expect(raw).toBeTruthy()

    const parsed = parseGeneralProgramServiceDetailJson(raw)
    expect(parsed.generalCommonInfo?.educationScheduleMode).toBe('period')
    expect(parsed.generalParticipantTypes).toEqual(['individual'])
    expect(parsed.targetLevels).toEqual(['elementary'])
    expect(parsed.generalProgramEducationStructure).toBe('curriculum')
    expect(parsed.generalProgramSessionRound).toBe('single')
    expect(parsed.generalProgramAudience).toBe('organization')
  })
})
