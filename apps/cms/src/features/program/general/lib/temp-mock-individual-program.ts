/**
 * TODO(temp-mock): 열여라 참깨 — 일반 개인 프로그램 FE 전용 시드 (검증 후 삭제)
 * QA 개인 회원 190045~190060 · 강사·봉사자는 org 시드 remap.
 */

import {
  isGeneralProgramTempMockEnabled,
  isGeneralProgramTempMockIndividualProgramId,
  TEMP_MOCK_INDIVIDUAL_PROGRAM_ID,
} from '@/features/program/general/api/temp-mock-capabilities'
import { GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_COMMON_INFO_MOCK } from '@/features/program/general/lib/detail-common-info-display'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ProgramManagerRow } from '@/features/program/general/model/program-managers'
import type { ParticipatingSchoolSession, TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { LectureAttendanceSession } from '@/features/program/general/model/school-detail-types'
import type { Program } from '@/types/domain'
import {
  buildTempMockProgramManagers,
  cloneJson,
  formatBirth,
  formatPhone,
  ageFromBirth,
  remapTempMockRowsProgramId,
  TEMP_MOCK_CONTACT_EMAIL,
  TEMP_MOCK_CONTACT_PHONE,
  TEMP_MOCK_DETAILED_PROGRAM_NAME,
  TEMP_MOCK_PRIMARY_SPONSOR_ID,
  TEMP_MOCK_SECONDARY_SPONSOR_ID,
  TEMP_MOCK_SPONSOR_DISPLAY_NAME,
  TEMP_MOCK_SPONSOR_MANAGER_LINE,
  TEMP_MOCK_TEXTBOOK_BUSINESS_AREA,
  TEMP_MOCK_TEXTBOOK_ID,
} from '@/features/program/general/lib/temp-mock-shared'
import {
  cloneTempMockOrgApplicantInstructorsSeed,
  cloneTempMockOrgProgressInstructorsSeed,
  cloneTempMockOrgProgressVolunteersSeed,
  cloneTempMockOrgVolunteerApplicantsSeed,
  TEMP_MOCK_ORG_INSTRUCTOR_APP_PREFIX,
  TEMP_MOCK_ORG_PROGRESS_INSTRUCTOR_PREFIX,
  TEMP_MOCK_ORG_PROGRESS_VOLUNTEER_PREFIX,
  TEMP_MOCK_ORG_VOLUNTEER_APP_PREFIX,
} from '@/features/program/general/lib/temp-mock-org-program'

export { TEMP_MOCK_INDIVIDUAL_PROGRAM_ID }

export const TEMP_MOCK_INDIVIDUAL_PARTICIPANT_PREFIX = 'temp-mock-individual-participant-'
export const TEMP_MOCK_INDIVIDUAL_INSTRUCTOR_APP_PREFIX = 'temp-mock-individual-instructor-app-'
export const TEMP_MOCK_INDIVIDUAL_VOLUNTEER_APP_PREFIX = 'temp-mock-individual-volunteer-app-'
export const TEMP_MOCK_INDIVIDUAL_PROGRESS_INSTRUCTOR_PREFIX =
  'temp-mock-individual-progress-instructor-'
export const TEMP_MOCK_INDIVIDUAL_PROGRESS_VOLUNTEER_PREFIX =
  'temp-mock-individual-progress-volunteer-'

export function isTempMockIndividualParticipantRowId(id: string): boolean {
  return id.startsWith(TEMP_MOCK_INDIVIDUAL_PARTICIPANT_PREFIX)
}

const TEMP_MOCK_TEXTBOOK_NAME = '[개인] 커리큘럼형 복수회차 테스트 프로그램 교재'
const TEMP_MOCK_TEXTBOOK_NAME_EN = '[개인] 커리큘럼형 복수회차 테스트 프로그램 교재'
const TEMP_MOCK_TARGET_LEVELS = ['elementary', 'middle', 'high'] as const
const TEMP_MOCK_EDUCATION_TARGET_DETAIL =
  '초등 4~6학년, 중등 1~3학년, 고등 1~3학년'
const WEEKDAYS = ['월', '화', '수', '목', '금', '월', '화', '수'] as const

type IndividualMemberSeed = {
  memberId: number
  name: string
  phone: string
  email: string
  birthDate: string
  gender: '남성' | '여성'
  grade: string
  schoolName: string
  address: string
  schoolOrganizationId: number | null
}

/** QA roster individuals 190045~190060 */
const INDIVIDUAL_MEMBERS: IndividualMemberSeed[] = [
  { memberId: 190045, name: '민서아', phone: '01012349501', email: 'qa.individual.min.seoah@tinto.co.kr', birthDate: '2016-04-12', gender: '여성', grade: '4학년', schoolName: '강서초등학교', address: '서울특별시 강서구 공항대로 1', schoolOrganizationId: 165101 },
  { memberId: 190046, name: '박도윤', phone: '01012349502', email: 'qa.individual.park.doyun@tinto.co.kr', birthDate: '2015-09-03', gender: '남성', grade: '5학년', schoolName: '푸른솔초등학교', address: '경기도 성남시 분당구 판교로 1', schoolOrganizationId: 165102 },
  { memberId: 190047, name: '이하윤', phone: '01012349503', email: 'qa.individual.lee.hayoon@tinto.co.kr', birthDate: '2017-02-21', gender: '여성', grade: '3학년', schoolName: '하늘빛초등학교', address: '인천광역시 연수구 송도대로 1', schoolOrganizationId: 165103 },
  { memberId: 190048, name: '최시우', phone: '01012349504', email: 'qa.individual.choi.siu@tinto.co.kr', birthDate: '2014-11-08', gender: '남성', grade: '6학년', schoolName: '바다초등학교', address: '부산광역시 해운대구 해운대로 1', schoolOrganizationId: 165104 },
  { memberId: 190049, name: '정예은', phone: '01012349505', email: 'qa.individual.jung.yeeun@tinto.co.kr', birthDate: '2012-06-15', gender: '여성', grade: '2학년', schoolName: '대전중학교', address: '대전광역시 서구 둔산로 1', schoolOrganizationId: 186101 },
  { memberId: 190050, name: '강지호', phone: '01012349506', email: 'qa.individual.kang.jiho@tinto.co.kr', birthDate: '2011-03-22', gender: '남성', grade: '3학년', schoolName: '광주중학교', address: '광주광역시 서구 상무로 1', schoolOrganizationId: 186102 },
  { memberId: 190051, name: '윤수아', phone: '01012349507', email: 'qa.individual.yoon.sua@tinto.co.kr', birthDate: '2010-08-30', gender: '여성', grade: '1학년', schoolName: '울산중학교', address: '울산광역시 남구 삼산로 1', schoolOrganizationId: 186103 },
  { memberId: 190052, name: '한건우', phone: '01012349508', email: 'qa.individual.han.geonwoo@tinto.co.kr', birthDate: '2009-01-11', gender: '남성', grade: '2학년', schoolName: '세종중학교', address: '세종특별자치시 한누리대로 1', schoolOrganizationId: 186104 },
  { memberId: 190053, name: '오민서', phone: '01012349509', email: 'qa.individual.oh.minseo@tinto.co.kr', birthDate: '2008-05-19', gender: '여성', grade: '1학년', schoolName: '제주중학교', address: '제주특별자치도 제주시 중앙로 1', schoolOrganizationId: 186105 },
  { memberId: 190054, name: '배준서', phone: '01012349510', email: 'qa.individual.bae.junseo@tinto.co.kr', birthDate: '2007-12-02', gender: '남성', grade: '2학년', schoolName: '수원고등학교', address: '경기도 수원시 영통구 광교로 1', schoolOrganizationId: 186106 },
  { memberId: 190055, name: '노채인', phone: '01012349511', email: 'qa.individual.noh.chaein@tinto.co.kr', birthDate: '2006-07-27', gender: '여성', grade: '3학년', schoolName: '창원고등학교', address: '경상남도 창원시 성산구 중앙대로 1', schoolOrganizationId: 186107 },
  { memberId: 190056, name: '권태민', phone: '01012349512', email: 'qa.individual.kwon.taemin@tinto.co.kr', birthDate: '2005-04-09', gender: '남성', grade: '1학년', schoolName: '청주고등학교', address: '충청북도 청주시 상당구 상당로 1', schoolOrganizationId: 186108 },
  { memberId: 190057, name: '송유진', phone: '01012349513', email: 'qa.individual.song.yujin@tinto.co.kr', birthDate: '2004-10-14', gender: '여성', grade: '해당 없음', schoolName: '-', address: '서울특별시 마포구 월드컵로 1', schoolOrganizationId: null },
  { memberId: 190058, name: '김하림', phone: '01012349514', email: 'qa.individual.kim.harim@tinto.co.kr', birthDate: '2003-02-28', gender: '여성', grade: '해당 없음', schoolName: 'JA 청소년 경제교육센터', address: '서울특별시 종로구 종로 1', schoolOrganizationId: null },
  { memberId: 190059, name: '이상호', phone: '01012349515', email: 'qa.individual.lee.sangho@tinto.co.kr', birthDate: '2002-09-05', gender: '남성', grade: '해당 없음', schoolName: '-', address: '경기도 고양시 일산동구 중앙로 1', schoolOrganizationId: null },
  { memberId: 190060, name: '박소연', phone: '01012349516', email: 'qa.individual.park.soyeon@tinto.co.kr', birthDate: '2001-06-18', gender: '여성', grade: '해당 없음', schoolName: '성남시 청소년수련관', address: '경기도 성남시 수정구 수정로 1', schoolOrganizationId: null },
]

function participantRowId(memberId: number): string {
  return `${TEMP_MOCK_INDIVIDUAL_PARTICIPANT_PREFIX}${memberId}`
}

function buildSessions(index: number): ParticipatingSchoolSession[] {
  const weekday = WEEKDAYS[index % WEEKDAYS.length]
  return [1, 2, 3, 4].map(round => ({
    round,
    date: `2026.10.${String(13 + (index % 8) + (round - 1) * 7).padStart(2, '0')}`,
    dayOfWeek: weekday,
    duration: '2시간',
    format: '대면 교육',
    classNum: `${round}교시`,
    timeRange: `${String(8 + round).padStart(2, '0')}:00 ~ ${String(9 + round).padStart(2, '0')}:50`,
    status: round === 1 ? 'completed' : round === 4 ? 'not_planned' : 'pending',
    requestedScheduleId: 890_000 + index * 10 + round,
    resolvedScheduleId: 880_000 + index * 10 + round,
    scheduleUnresolved: false,
  }))
}

function buildLectureAttendanceSessions(index: number): LectureAttendanceSession[] {
  return buildSessions(index).map((session, sessionIndex) => ({
    roundNumber: session.round,
    status:
      sessionIndex === 0
        ? 'attended'
        : sessionIndex === 1
          ? 'late'
          : sessionIndex === 2
            ? 'absent'
            : 'not_held',
    scheduleId: session.resolvedScheduleId ?? undefined,
  }))
}

function buildTempMockIndividualCommonInfo(): NonNullable<Program['generalCommonInfo']> {
  const base = cloneJson(GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_COMMON_INFO_MOCK)
  return {
    ...base,
    announcementTitle: '2026년 로컬나눔은행-JA Korea 개인 경제교육 쇼케이스',
    detailedProgramName: TEMP_MOCK_DETAILED_PROGRAM_NAME,
    sponsorDisplayName: TEMP_MOCK_SPONSOR_DISPLAY_NAME,
    sponsorManagementId: TEMP_MOCK_PRIMARY_SPONSOR_ID,
    sponsorManagementIds: [TEMP_MOCK_PRIMARY_SPONSOR_ID, TEMP_MOCK_SECONDARY_SPONSOR_ID],
    sponsorManagerLine: TEMP_MOCK_SPONSOR_MANAGER_LINE,
    venueDetail: 'JA Korea 교육장',
    educationFormLabel: '대면 교육',
    educationScheduleLines: [
      '26년 10월 12일(월) 9:00 ~ 11:50',
      '26년 10월 19일(월) 9:00 ~ 11:50',
      '26년 10월 26일(월) 9:00 ~ 11:50',
      '26년 11월 02일(월) 9:00 ~ 11:50',
    ],
    participantRecruitmentInfo: {
      ...base.participantRecruitmentInfo,
      interviewEnabled: true,
    },
  }
}

function buildProgram(): Program {
  const now = '2026-09-17T12:00:00+09:00'
  const commonInfo = buildTempMockIndividualCommonInfo()
  return {
    id: TEMP_MOCK_INDIVIDUAL_PROGRAM_ID,
    sponsorId: TEMP_MOCK_PRIMARY_SPONSOR_ID,
    title: '[임시] 개인 경제교육 쇼케이스',
    mainTitle: '개인 경제교육 쇼케이스',
    titleEn: 'Individual Economic Education Showcase',
    type: 'offline',
    format: 'course',
    category: 'individual',
    description:
      'JA Korea 개인 참여자 대상 경제·금융 교육 프로그램입니다. 4회차 커리큘럼으로 진행됩니다.',
    businessArea: TEMP_MOCK_TEXTBOOK_BUSINESS_AREA,
    textbookName: TEMP_MOCK_TEXTBOOK_NAME,
    textbookNameEn: TEMP_MOCK_TEXTBOOK_NAME_EN,
    teamDivision: 'C&D',
    educationProcess: 'Traditional (Paper)',
    courseDeliveredBy: 'JA',
    partnerInvolvement: false,
    ipOwned: 'JA',
    rounds: [1, 2, 3, 4].map(roundNumber => ({
      id: `temp-mock-individual-round-${roundNumber}`,
      programId: TEMP_MOCK_INDIVIDUAL_PROGRAM_ID,
      roundNumber,
      startDate: `2026-10-${String(12 + (roundNumber - 1) * 7).padStart(2, '0')}`,
      endDate: `2026-10-${String(12 + (roundNumber - 1) * 7).padStart(2, '0')}`,
      capacity: 32,
      classCount: 1,
      status: roundNumber === 1 ? 'completed' : 'active',
      curriculum: `${roundNumber}회차 | 경제 기초 활동`,
    })),
    startDate: '2026-10-12',
    endDate: '2026-11-20',
    applicationStartDate: '2026-09-01',
    applicationEndDate: '2026-09-30',
    status: 'active',
    lifecycleStatus: 'in_progress',
    targetLevel: TEMP_MOCK_TARGET_LEVELS[0],
    targetLevels: [...TEMP_MOCK_TARGET_LEVELS],
    district: TEMP_MOCK_EDUCATION_TARGET_DETAIL,
    educationTime: 8,
    totalParticipants: 16,
    approvedStudentCount: 12,
    instructors: 8,
    generalVolunteers: 8,
    managerName: '테스트 PM 관리자',
    venue: 'JA Korea 교육장',
    contactPhone: TEMP_MOCK_CONTACT_PHONE,
    contactEmail: TEMP_MOCK_CONTACT_EMAIL,
    oneLineIntroduction: '실제 QA 개인·강사·봉사자 회원 ID로 LNB를 확인합니다.',
    recruitmentGuide: '홈페이지에서 개인 참여 신청서를 작성·제출해 주세요.',
    applicationMethod: 'JA Korea 홈페이지 > 프로그램 신청 > 개인 참여 신청',
    studentListRequired: 'not_required',
    instructorCapacity: 16,
    instructorApplicationStartDate: '2026-09-01',
    instructorApplicationEndDate: '2026-09-20',
    volunteerApplicationStartDate: '2026-09-01',
    volunteerApplicationEndDate: '2026-09-25',
    generalVolunteerInterviewEnabled: true,
    generalParticipantInterviewEnabled: true,
    generalParticipantTypes: ['individual', 'teacher_instructor', 'volunteer'],
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalCommonInfo: commonInfo,
    createdAt: now,
    updatedAt: now,
    createdByName: '틴토 QA',
    updatedByName: '틴토 QA',
  }
}

function buildIndividualApplicants(): GeneralIndividualApplicantRow[] {
  const approvals: GeneralIndividualApplicantRow['approvalStatus'][] = [
    'approved',
    'approved',
    'approved',
    'approved',
    'approved',
    'approved',
    'pending',
    'pending',
    'rejected',
    'rejected',
    'approved',
    'approved',
    'pending',
    'pending',
    'approved',
    'approved',
  ]
  const textbookStatuses: TextbookStatusKey[] = [
    'delivered',
    'shipping',
    'preparing',
    'delivered',
    'not_applicable',
    'delivered',
    'preparing',
    'shipping',
    'not_applicable',
    'preparing',
    'delivered',
    'delivered',
    'preparing',
    'shipping',
    'delivered',
    'not_applicable',
  ]

  return INDIVIDUAL_MEMBERS.map((member, index) => {
    const approvalStatus = approvals[index] ?? 'pending'
    const appId = `temp-mock-individual-app-${member.memberId}`
    return {
      id: appId,
      individualApplicationId: appId,
      memberId: String(member.memberId),
      affiliationOrganizationId: member.schoolOrganizationId,
      no: index + 1,
      applicantName: member.name,
      availableActions:
        approvalStatus === 'approved' ? ['GIVE_UP'] : approvalStatus === 'pending' ? ['APPROVE', 'REJECT'] : undefined,
      affiliation: member.schoolName === '-' ? '해당 없음' : member.schoolName,
      educationGrade: member.grade,
      homeAddress: member.address,
      approvalStatus,
      programId: TEMP_MOCK_INDIVIDUAL_PROGRAM_ID,
      sessions: buildSessions(index),
      textbookId: TEMP_MOCK_TEXTBOOK_ID,
      textbookName: TEMP_MOCK_TEXTBOOK_NAME,
      textbookStatus: textbookStatuses[index],
      adminComment: `${member.name} 참여자 신청 확인`,
      documentScreeningStatus: index <= 5 ? 'pass' : index <= 8 ? 'pending' : index === 9 ? 'fail' : 'pass',
      managerAEvaluation: index <= 8 ? 'unreviewed' : 'pass',
      managerBEvaluation: index <= 8 ? 'unreviewed' : 'pass',
      interviewAssignmentStatus: index <= 4 ? 'assigned' : 'waiting',
      assignedInterviewDateLabel: index <= 4 ? '2026.10.03(금)' : undefined,
      assignedInterviewTime: index <= 4 ? '14:00' : undefined,
      detail: {
        gender: member.gender,
        birthDate: formatBirth(member.birthDate),
        age: ageFromBirth(member.birthDate),
        schoolEnrollmentStatus: member.grade === '해당 없음' ? '해당 없음' : '재학',
        affiliationSchool: member.schoolName,
        affiliationGrade: member.grade,
        contact: formatPhone(member.phone),
        email: member.email,
        homeAddressFull: member.address,
        personalInfoConsent: 'agree',
        thirdPartyConsent: 'agree',
        teamName: index % 3 === 0 ? `팀 ${member.name.slice(0, 1)}` : undefined,
        teamMemberCount: index % 3 === 0 ? 2 : 1,
        teamRole: index % 3 === 0 ? 'leader' : 'member',
      },
    }
  })
}

function buildProgressParticipants(): ParticipatingIndividualParticipantRow[] {
  const approved = buildIndividualApplicants().filter(row => row.approvalStatus === 'approved')
  return approved.map((row, index) => ({
    ...row,
    id: participantRowId(Number(row.memberId)),
    individualApplicationId: row.id,
    satisfactionSurveyCompleted: index % 2 === 0,
    participationAppliedAt: `2026-09-${String(2 + (index % 20)).padStart(2, '0')}T10:00:00+09:00`,
    lectureAttendanceSessions: buildLectureAttendanceSessions(index),
    activityWithdrawn: index === approved.length - 1,
    activityWithdrawStopSessionKey: index === approved.length - 1 ? 'round-2' : undefined,
    activityWithdrawStopScheduleLabel:
      index === approved.length - 1 ? '2026.10.26 (수) 10:00 ~ 11:50' : undefined,
  }))
}

function remapInstructorVolunteerSeeds<T extends { programId?: string; id: string }>(
  rows: T[],
  idReplacements: Array<[string, string]>
): T[] {
  return remapTempMockRowsProgramId(rows, TEMP_MOCK_INDIVIDUAL_PROGRAM_ID, idReplacements)
}

let cachedProgram: Program | null = null
function getCachedProgram(): Program {
  if (cachedProgram == null) cachedProgram = buildProgram()
  return cachedProgram
}

const APPLICANT_INDIVIDUALS = buildIndividualApplicants()
const PROGRESS_PARTICIPANTS = buildProgressParticipants()
const PROGRAM_MANAGERS = buildTempMockProgramManagers('temp-mock-individual')

const APPLICANT_INSTRUCTORS = remapInstructorVolunteerSeeds(
  cloneTempMockOrgApplicantInstructorsSeed(),
  [[TEMP_MOCK_ORG_INSTRUCTOR_APP_PREFIX, TEMP_MOCK_INDIVIDUAL_INSTRUCTOR_APP_PREFIX]]
)

const PROGRESS_INSTRUCTORS = remapInstructorVolunteerSeeds(
  cloneTempMockOrgProgressInstructorsSeed(),
  [[TEMP_MOCK_ORG_PROGRESS_INSTRUCTOR_PREFIX, TEMP_MOCK_INDIVIDUAL_PROGRESS_INSTRUCTOR_PREFIX]]
)

const VOLUNTEER_APPLICANTS = remapInstructorVolunteerSeeds(
  cloneTempMockOrgVolunteerApplicantsSeed(),
  [[TEMP_MOCK_ORG_VOLUNTEER_APP_PREFIX, TEMP_MOCK_INDIVIDUAL_VOLUNTEER_APP_PREFIX]]
)

const PROGRESS_VOLUNTEERS = remapInstructorVolunteerSeeds(
  cloneTempMockOrgProgressVolunteersSeed(),
  [[TEMP_MOCK_ORG_PROGRESS_VOLUNTEER_PREFIX, TEMP_MOCK_INDIVIDUAL_PROGRESS_VOLUNTEER_PREFIX]]
)

export function getTempMockIndividualProgram(): Program | null {
  if (!isGeneralProgramTempMockEnabled()) return null
  return cloneJson(getCachedProgram())
}

export function getTempMockIndividualProgramIfId(programId?: string | null): Program | null {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return null
  return cloneJson(getCachedProgram())
}

export function getTempMockIndividualApplicants(programId?: string | null): GeneralIndividualApplicantRow[] {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return []
  return cloneJson(APPLICANT_INDIVIDUALS)
}

export function getTempMockIndividualProgressParticipants(
  programId?: string | null
): ParticipatingIndividualParticipantRow[] {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return []
  return cloneJson(PROGRESS_PARTICIPANTS)
}

export function getTempMockIndividualApplicantInstructors(
  programId?: string | null
): ApplicantInstructorRow[] {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return []
  return cloneJson(APPLICANT_INSTRUCTORS)
}

export function getTempMockIndividualProgressInstructors(
  programId?: string | null
): ParticipatingInstructorRow[] {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return []
  return cloneJson(PROGRESS_INSTRUCTORS)
}

export function getTempMockIndividualVolunteerApplicants(
  programId?: string | null,
  stage?: 'doc1' | 'docPassed' | 'interview2'
): GeneralVolunteerApplicantRow[] {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return []
  const rows = cloneJson(VOLUNTEER_APPLICANTS)
  if (stage === 'docPassed') {
    return rows.filter(row => row.documentScreeningStatus === 'pass')
  }
  if (stage === 'interview2') {
    return rows.filter(
      row =>
        row.documentScreeningStatus === 'pass' && row.interviewAssignmentStatus === 'assigned'
    )
  }
  return rows
}

export function getTempMockIndividualProgressVolunteers(
  programId?: string | null
): ParticipatingVolunteerRow[] {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return []
  return cloneJson(PROGRESS_VOLUNTEERS)
}

export function getTempMockIndividualProgramManagers(
  programId?: string | null
): ProgramManagerRow[] {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return []
  return cloneJson(PROGRAM_MANAGERS)
}
