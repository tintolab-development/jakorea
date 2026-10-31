import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  buildActivityCertificateVolunteerFromUjatDetail,
  buildLectureAttendanceSessionsFromBundle,
  buildStudentCertificateContextFromUjatVolunteer,
  formatLectureAttendanceFromBundle,
  resolveAssignedInstitutionNamesFromBundle,
} from './activity-certificate'
import type { UjatVolunteerAssignmentProgressBundle } from './detail/assignment-types'
import type { UjatEducationProgressVolunteerDetail } from './detail/volunteer-detail-data'

function emptyBundle(
  overrides: Partial<UjatVolunteerAssignmentProgressBundle> = {}
): UjatVolunteerAssignmentProgressBundle {
  return {
    rows: [],
    attendanceSummary: { completionStatus: '교육 진행 전', lateCountLabel: '0회' },
    absenceReasons: [],
    ...overrides,
  }
}

function baseDetail(): UjatEducationProgressVolunteerDetail {
  return {
    volunteerId: 'vol-1',
    half: 'h1',
    row: {
      id: 'vol-1',
      no: 1,
      volunteerName: '테스트봉사자',
      grade: '3학년',
      regionKey: 'seoul',
      regionLabel: '서울',
      mobile: '010-****-0000',
      email: 't***@example.com',
      totalAssignedDays: 2,
      assignmentStatus: 'assignment_completed',
      memberId: '70',
    },
    applicant: {
      id: 'vol-1',
      no: 1,
      name: '테스트봉사자',
      grade: '3학년',
      preferredRegion: '서울',
      preferredRegionCode: 'SEOUL',
      contact: '010-****-0000',
      email: 't***@example.com',
      contactRaw: '010-****-0000',
      emailRaw: 't***@example.com',
      hasEducationExperience: false,
      applicationType: 'new',
      essayIntro: '',
      essayEducationExperience: '',
      essayNecessity: '',
      essayJaExperience: '',
      totalAssignedDays: 2,
      homeAddress: '-',
      managerAEvaluation: 'unreviewed',
      managerBEvaluation: 'unreviewed',
      documentScreeningStatus: 'pass',
      interviewSlotCount: 0,
      interviewAssignmentStatus: 'assigned',
      programId: '186506',
      half: 'h1',
      englishName: 'Test',
      memberId: '70',
      id1365: '1365-1',
      gender: '여성',
      birthDate: '2000-01-01',
      age: 26,
      universityName: '-',
      major: '-',
      applicationRoute: '-',
      scheduleChangeCancelCount: 0,
      interviewAvailability: [],
    },
    adminComment: '',
  }
}

const program = {
  id: '186506',
  title: 'UJAT 테스트',
  mainTitle: 'UJAT 테스트',
  startDate: '2026-03-01',
  endDate: '2026-12-31',
} as Program

describe('activity-certificate builders', () => {
  it('uses assigned institution names from progress bundle (dedup)', () => {
    const bundle = emptyBundle({
      rows: [
        {
          id: 'r1',
          scheduleLabel: '1회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'present' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
        {
          id: 'r2',
          scheduleLabel: '2회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'present' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
        {
          id: 'r3',
          scheduleLabel: '3회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '별빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '4-2' },
          attendance: { kind: 'absence' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
      ],
    })

    expect(resolveAssignedInstitutionNamesFromBundle(bundle)).toEqual([
      '한빛초등학교',
      '별빛초등학교',
    ])
    expect(buildActivityCertificateVolunteerFromUjatDetail(baseDetail(), bundle).assignedInstitutionNames)
      .toEqual(['한빛초등학교', '별빛초등학교'])
  })

  it('builds sessions from rows and excludes withdrawn rows', () => {
    const bundle = emptyBundle({
      rows: [
        {
          id: 'r1',
          scheduleLabel: '1회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'present' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
        {
          id: 'r2',
          scheduleLabel: '2회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'withdrawn' },
          attendance: { kind: 'absence' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: true,
        },
        {
          id: 'r3',
          scheduleLabel: '3회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'excused_absence' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
      ],
    })

    expect(buildLectureAttendanceSessionsFromBundle(bundle)).toEqual([
      { roundNumber: 1, status: 'attended' },
      { roundNumber: 2, status: 'attended' },
    ])
  })

  it('resolves completion when all sessions present or excused', () => {
    const bundle = emptyBundle({
      rows: [
        {
          id: 'r1',
          scheduleLabel: '1회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'present' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
        {
          id: 'r2',
          scheduleLabel: '2회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'excused_absence' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
      ],
    })

    const context = buildStudentCertificateContextFromUjatVolunteer({
      detail: baseDetail(),
      program,
      issuanceReasonLabel: '수료',
      bundle,
    })
    expect(context.certificateKind).toBe('completion')
    expect(context.schoolName).toBe('한빛초등학교')
  })

  it('resolves participation when any session absent', () => {
    const bundle = emptyBundle({
      rows: [
        {
          id: 'r1',
          scheduleLabel: '1회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'present' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
        {
          id: 'r2',
          scheduleLabel: '2회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'absence' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
      ],
    })

    const context = buildStudentCertificateContextFromUjatVolunteer({
      detail: baseDetail(),
      program,
      issuanceReasonLabel: '참여',
      bundle,
    })
    expect(context.certificateKind).toBe('participation')
  })

  it("schoolName falls back to '-' only when bundle has no named institution", () => {
    const bundle = emptyBundle({
      rows: [
        {
          id: 'r1',
          scheduleLabel: '1회차',
          role: 'none',
          assignedInstitution: { kind: 'dash' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'present' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
      ],
    })

    expect(
      buildStudentCertificateContextFromUjatVolunteer({
        detail: baseDetail(),
        program,
        issuanceReasonLabel: '참여',
        bundle,
      }).schoolName
    ).toBe('-')
  })

  it('lectureAttendance reflects attended/assigned counts', () => {
    const bundle = emptyBundle({
      rows: [
        {
          id: 'r1',
          scheduleLabel: '1회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'present' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
        {
          id: 'r2',
          scheduleLabel: '2회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'absence' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
        {
          id: 'r3',
          scheduleLabel: '3회차',
          role: 'none',
          assignedInstitution: { kind: 'name', value: '한빛초등학교' },
          partner: { kind: 'dash' },
          classDisplay: { kind: 'class', label: '3-1' },
          attendance: { kind: 'excused_absence' },
          educationPlanSubmitted: false,
          educationLogSubmitted: false,
          educationProgress: 'completed',
          isWithdrawn: false,
        },
      ],
    })

    expect(formatLectureAttendanceFromBundle(bundle)).toBe('2/3')
  })
})
