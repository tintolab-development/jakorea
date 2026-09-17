/**
 * TODO(temp-mock): 열여라 참깨 — 일반 기관 프로그램 FE 전용 시드 (검증 후 삭제)
 * CMS remote 회원(190022~044, 061~076) · 학교(165101~104, 186101~104) ID만 사용.
 * 원격 프로그램 행에 섞지 않음. `VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED=true` 일 때만 노출.
 */

import {
  isGeneralProgramTempMockEnabled,
  isGeneralProgramTempMockProgramId,
  TEMP_MOCK_ORG_PROGRAM_ID,
} from '@/features/program/general/api/temp-mock-capabilities'
import { GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_COMMON_INFO_MOCK } from '@/features/program/general/lib/detail-common-info-display'
import { formatTargetLevelsLabel } from '@/features/program/shared/lib/program-detail-info-constants'
import type { ProgramManagerRow } from '@/features/program/general/model/program-managers'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
  TextbookStatusKey,
} from '@/features/program/general/model/participating-schools'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import type {
  ApplicantInstructorRow,
  ApplicantInstructorPreferredSchool,
} from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { Program } from '@/types/domain'
import { formatParticipatingSchoolSessionLine } from '@/features/program/general/lib/participating-school-session-display'

export { TEMP_MOCK_ORG_PROGRAM_ID }

export const TEMP_MOCK_ORG_SCHOOL_ID_PREFIX = 'temp-mock-org-school-'
export const TEMP_MOCK_ORG_INSTRUCTOR_APP_PREFIX = 'temp-mock-org-instructor-app-'
export const TEMP_MOCK_ORG_VOLUNTEER_APP_PREFIX = 'temp-mock-org-volunteer-app-'
export const TEMP_MOCK_ORG_PROGRESS_INSTRUCTOR_PREFIX = 'temp-mock-org-progress-instructor-'
export const TEMP_MOCK_ORG_PROGRESS_VOLUNTEER_PREFIX = 'temp-mock-org-progress-volunteer-'

export function isTempMockOrgSchoolRowId(id: string): boolean {
  return id.startsWith(TEMP_MOCK_ORG_SCHOOL_ID_PREFIX)
}

export function isTempMockOrgProgressInstructorId(id: string): boolean {
  return id.startsWith(TEMP_MOCK_ORG_PROGRESS_INSTRUCTOR_PREFIX)
}

export function isTempMockOrgProgressVolunteerId(id: string): boolean {
  return id.startsWith(TEMP_MOCK_ORG_PROGRESS_VOLUNTEER_PREFIX)
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '월', '화', '수'] as const
const TEXTBOOK_STATUSES: TextbookStatusKey[] = [
  'preparing',
  'shipping',
  'delivered',
  'not_applicable',
  'preparing',
  'shipping',
  'delivered',
  'not_applicable',
]
const SETTLEMENT_STATUSES: InstructorSettlementUiStatus[] = [
  'awaiting_confirmation',
  'partial_confirmation',
  'payment_statement_verified',
  'account_paid',
  'none',
  'application_rejected',
  'payment_correction_requested',
  'payment_statement_reapplication',
]

type SchoolSeed = {
  organizationId: number
  schoolName: string
  region: string
  address: string
  educationGrade: string
  teacherMemberId: number
  teacherName: string
  teacherPhone: string
  teacherEmail: string
  teacherGender: '남성' | '여성'
}

const SCHOOLS: SchoolSeed[] = [
  {
    organizationId: 165101,
    schoolName: '강서초등학교',
    region: '서울특별시 강서구',
    address: '서울특별시 강서구 공항대로 1',
    educationGrade: '초등학교 4학년',
    teacherMemberId: 190034,
    teacherName: '문하영',
    teacherPhone: '01012349484',
    teacherEmail: 'qa.teacher.mun.hayoung@tinto.co.kr',
    teacherGender: '여성',
  },
  {
    organizationId: 165102,
    schoolName: '푸른솔초등학교',
    region: '경기도 성남시 분당구',
    address: '경기도 성남시 분당구 판교로 1',
    educationGrade: '초등학교 5학년',
    teacherMemberId: 190035,
    teacherName: '오세진',
    teacherPhone: '01012349485',
    teacherEmail: 'qa.teacher.oh.sejin@tinto.co.kr',
    teacherGender: '남성',
  },
  {
    organizationId: 165103,
    schoolName: '하늘빛초등학교',
    region: '인천광역시 연수구',
    address: '인천광역시 연수구 송도대로 1',
    educationGrade: '초등학교 6학년',
    teacherMemberId: 190036,
    teacherName: '남유나',
    teacherPhone: '01012349486',
    teacherEmail: 'qa.teacher.nam.yuna@tinto.co.kr',
    teacherGender: '여성',
  },
  {
    organizationId: 165104,
    schoolName: '새싹초등학교',
    region: '부산광역시 해운대구',
    address: '부산광역시 해운대구 센텀로 1',
    educationGrade: '초등학교 4학년',
    teacherMemberId: 190037,
    teacherName: '배준혁',
    teacherPhone: '01012349487',
    teacherEmail: 'qa.teacher.bae.junhyuk@tinto.co.kr',
    teacherGender: '남성',
  },
  {
    organizationId: 186101,
    schoolName: 'JA서울미래초등학교',
    region: '서울특별시 종로구',
    address: '서울특별시 종로구 세종대로 110',
    educationGrade: '초등학교 5학년',
    teacherMemberId: 190038,
    teacherName: '송미라',
    teacherPhone: '01012349488',
    teacherEmail: 'qa.teacher.song.mira@tinto.co.kr',
    teacherGender: '여성',
  },
  {
    organizationId: 186102,
    schoolName: '경기한빛중학교',
    region: '경기도 성남시 분당구',
    address: '경기도 성남시 분당구 판교로 242',
    educationGrade: '중학교 1학년',
    teacherMemberId: 190039,
    teacherName: '권태양',
    teacherPhone: '01012349489',
    teacherEmail: 'qa.teacher.kwon.taeyang@tinto.co.kr',
    teacherGender: '남성',
  },
  {
    organizationId: 186103,
    schoolName: '인천새봄고등학교',
    region: '인천광역시 연수구',
    address: '인천광역시 연수구 컨벤시아대로 69',
    educationGrade: '고등학교 1학년',
    teacherMemberId: 190040,
    teacherName: '홍지아',
    teacherPhone: '01012349490',
    teacherEmail: 'qa.teacher.hong.jia@tinto.co.kr',
    teacherGender: '여성',
  },
  {
    organizationId: 186104,
    schoolName: '부산다온초등학교',
    region: '부산광역시 해운대구',
    address: '부산광역시 해운대구 센텀중앙로 79',
    educationGrade: '초등학교 6학년',
    teacherMemberId: 190041,
    teacherName: '노성민',
    teacherPhone: '01012349491',
    teacherEmail: 'qa.teacher.noh.seongmin@tinto.co.kr',
    teacherGender: '남성',
  },
]

type InstructorSeed = {
  memberId: number
  name: string
  phone: string
  email: string
  gender: '남성' | '여성'
  birthDate: string
  dual?: boolean
  affiliationOrgId?: number | null
  affiliationName?: string
}

const INSTRUCTORS: InstructorSeed[] = [
  { memberId: 190022, name: '이강사', phone: '01012349472', email: 'qa.instructor.lee.gangsa@tinto.co.kr', gender: '여성', birthDate: '1990-07-21' },
  { memberId: 190023, name: '박교육', phone: '01012349473', email: 'qa.instructor.park.educ@tinto.co.kr', gender: '남성', birthDate: '1985-11-03' },
  { memberId: 190024, name: '정현우', phone: '01012349474', email: 'qa.instructor.jung.hyunwoo@tinto.co.kr', gender: '남성', birthDate: '1994-02-18' },
  { memberId: 190025, name: '윤서연', phone: '01012349475', email: 'qa.instructor.yoon.seoyeon@tinto.co.kr', gender: '여성', birthDate: '1991-09-08' },
  { memberId: 190026, name: '한지훈', phone: '01012349476', email: 'qa.instructor.han.jihun@tinto.co.kr', gender: '남성', birthDate: '1987-05-27' },
  { memberId: 190027, name: '오지은', phone: '01012349477', email: 'qa.instructor.oh.jieun@tinto.co.kr', gender: '여성', birthDate: '1996-12-01' },
  { memberId: 190028, name: '서민재', phone: '01012349478', email: 'qa.instructor.seo.minjae@tinto.co.kr', gender: '남성', birthDate: '1983-08-14' },
  { memberId: 190029, name: '배수아', phone: '01012349479', email: 'qa.instructor.bae.sua@tinto.co.kr', gender: '여성', birthDate: '1993-04-09' },
  { memberId: 190030, name: '임태호', phone: '01012349480', email: 'qa.instructor.lim.taeho@tinto.co.kr', gender: '남성', birthDate: '1989-01-30' },
  { memberId: 190031, name: '강하늘', phone: '01012349481', email: 'qa.instructor.kang.haneul@tinto.co.kr', gender: '여성', birthDate: '1995-06-16' },
  { memberId: 190032, name: '조은비', phone: '01012349482', email: 'qa.instructor.cho.eunbi@tinto.co.kr', gender: '여성', birthDate: '1992-10-22' },
  { memberId: 190033, name: '신도윤', phone: '01012349483', email: 'qa.instructor.shin.doyun@tinto.co.kr', gender: '남성', birthDate: '1986-12-25' },
  {
    memberId: 190042,
    name: '장겸임',
    phone: '01012349492',
    email: 'qa.teacher.instructor.jang.gyeomim@tinto.co.kr',
    gender: '남성',
    birthDate: '1986-08-11',
    dual: true,
    affiliationOrgId: 186105,
    affiliationName: '대전초록중학교',
  },
  {
    memberId: 190043,
    name: '하윤서',
    phone: '01012349493',
    email: 'qa.teacher.instructor.ha.yunseo@tinto.co.kr',
    gender: '여성',
    birthDate: '1989-03-25',
    dual: true,
    affiliationOrgId: 186106,
    affiliationName: '광주누리초등학교',
  },
  {
    memberId: 190044,
    name: '도하준',
    phone: '01012349494',
    email: 'qa.teacher.instructor.doh.hajun@tinto.co.kr',
    gender: '남성',
    birthDate: '1981-06-30',
    dual: true,
    affiliationOrgId: 186108,
    affiliationName: '제주해올초등학교',
  },
]

type VolunteerSeed = {
  memberId: number
  name: string
  phone: string
  email: string
  gender: '남성' | '여성'
  birthDate: string
  affiliationName: string | null
}

const VOLUNTEERS: VolunteerSeed[] = [
  { memberId: 190061, name: '나영진', phone: '01012349520', email: 'qa.volunteer.na.youngjin@tinto.co.kr', gender: '남성', birthDate: '1988-02-14', affiliationName: 'JA 서울 봉사단' },
  { memberId: 190062, name: '심은지', phone: '01012349521', email: 'qa.volunteer.shim.eunji@tinto.co.kr', gender: '여성', birthDate: '1992-07-08', affiliationName: null },
  { memberId: 190063, name: '고동현', phone: '01012349522', email: 'qa.volunteer.go.donghyun@tinto.co.kr', gender: '남성', birthDate: '1985-10-21', affiliationName: '인천 교육봉사모임' },
  { memberId: 190064, name: '류민지', phone: '01012349523', email: 'qa.volunteer.ryu.minji@tinto.co.kr', gender: '여성', birthDate: '1994-01-03', affiliationName: null },
  { memberId: 190065, name: '안재원', phone: '01012349524', email: 'qa.volunteer.an.jaewon@tinto.co.kr', gender: '남성', birthDate: '1990-12-16', affiliationName: '대전 대학생 봉사단' },
  { memberId: 190066, name: '백소리', phone: '01012349525', email: 'qa.volunteer.baek.sori@tinto.co.kr', gender: '여성', birthDate: '1996-05-29', affiliationName: null },
  { memberId: 190067, name: '표승호', phone: '01012349526', email: 'qa.volunteer.pyo.seungho@tinto.co.kr', gender: '남성', birthDate: '1983-09-07', affiliationName: '울산 청소년멘토' },
  { memberId: 190068, name: '임다혜', phone: '01012349527', email: 'qa.volunteer.im.dahye@tinto.co.kr', gender: '여성', birthDate: '1991-04-25', affiliationName: null },
  { memberId: 190069, name: '차민준', phone: '01012349528', email: 'qa.volunteer.cha.minjun@tinto.co.kr', gender: '남성', birthDate: '1987-08-13', affiliationName: '강서 지역아동센터' },
  { memberId: 190070, name: '여지은', phone: '01012349529', email: 'qa.volunteer.yeo.jieun@tinto.co.kr', gender: '여성', birthDate: '1993-03-19', affiliationName: null },
  { memberId: 190071, name: '옥태양', phone: '01012349530', email: 'qa.volunteer.ok.taeyang@tinto.co.kr', gender: '남성', birthDate: '1989-11-02', affiliationName: '송도 대학 봉사동아리' },
  { memberId: 190072, name: '진세연', phone: '01012349531', email: 'qa.volunteer.jin.seoyeon@tinto.co.kr', gender: '여성', birthDate: '1997-06-11', affiliationName: null },
  { memberId: 190073, name: '마현우', phone: '01012349532', email: 'qa.volunteer.ma.hyunwoo@tinto.co.kr', gender: '남성', birthDate: '1984-01-28', affiliationName: '중구 청소년수련관' },
  { memberId: 190074, name: '설나리', phone: '01012349533', email: 'qa.volunteer.seol.nari@tinto.co.kr', gender: '여성', birthDate: '1995-09-09', affiliationName: null },
  { memberId: 190075, name: '방지훈', phone: '01012349534', email: 'qa.volunteer.bang.jihun@tinto.co.kr', gender: '남성', birthDate: '1992-12-31', affiliationName: '충남대 교육봉사' },
  { memberId: 190076, name: '공하은', phone: '01012349535', email: 'qa.volunteer.gong.haeeun@tinto.co.kr', gender: '여성', birthDate: '1986-05-05', affiliationName: null },
]

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  return raw
}

function ageFromBirth(iso: string): number {
  return 2026 - Number(iso.slice(0, 4))
}

function formatBirth(iso: string): string {
  return iso.replace(/-/g, '.')
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function buildSessions(index: number): ParticipatingSchoolSession[] {
  const weekday = WEEKDAYS[index]
  return [1, 2, 3, 4].map(round => ({
    round,
    date: `2026.10.${String(13 + index + (round - 1) * 7).padStart(2, '0')}`,
    dayOfWeek: weekday,
    duration: '2시간',
    format: '대면 교육',
    classNum: `${round}교시`,
    timeRange: `${String(8 + round).padStart(2, '0')}:00 ~ ${String(9 + round).padStart(2, '0')}:50`,
    status: round === 1 ? 'completed' : round === 4 ? 'not_planned' : 'pending',
    requestedScheduleId: 880_000 + index * 10 + round,
    resolvedScheduleId: 870_000 + index * 10 + round,
    scheduleUnresolved: false,
  }))
}

function schoolRowId(organizationId: number): string {
  return `${TEMP_MOCK_ORG_SCHOOL_ID_PREFIX}${organizationId}`
}

function preferredSchoolsForInstructor(index: number): ApplicantInstructorPreferredSchool[] {
  return SCHOOLS.slice(0, 4).map((school, rank) => ({
    schoolId: schoolRowId(school.organizationId),
    schoolName: school.schoolName,
    rank: rank + 1,
    assignable: (index + rank) % 4 !== 3,
    grade: school.educationGrade,
    dateRange: '2026.10.13 (월) ~ 2026.11.07 (금)',
  }))
}

/** QA remote 후원사 — 로컬나눔은행(주), 스타벅스(부) */
const TEMP_MOCK_PRIMARY_SPONSOR_ID = '1627251'
const TEMP_MOCK_SECONDARY_SPONSOR_ID = '163302'
const TEMP_MOCK_SPONSOR_DISPLAY_NAME = '로컬나눔은행, 스타벅스'
const TEMP_MOCK_SPONSOR_MANAGER_LINE = '백진혁 | 010-8681-6741'
const TEMP_MOCK_SPONSOR_CONTACT_ORG_NAME = '로컬나눔은행, 스타벅스'

/** QA remote 세부 프로그램 (id=163006) — catalog nameKo 매칭 */
const TEMP_MOCK_DETAILED_PROGRAM_NAME = '소비와 저축의 균형'

/** QA remote 교재 (id=168032) */
const TEMP_MOCK_TEXTBOOK_ID = '168032'
const TEMP_MOCK_TEXTBOOK_NAME = '[기관] 커리큘럼형 복수회차 테스트 프로그램 교재'
const TEMP_MOCK_TEXTBOOK_NAME_EN = '[기관] 커리큘럼형 복수회차 테스트 프로그램 교재'
const TEMP_MOCK_TEXTBOOK_BUSINESS_AREA = '경제금융'

const TEMP_MOCK_TARGET_LEVELS = ['elementary', 'middle', 'high'] as const
const TEMP_MOCK_EDUCATION_TARGET = formatTargetLevelsLabel([...TEMP_MOCK_TARGET_LEVELS])
const TEMP_MOCK_EDUCATION_TARGET_DETAIL =
  '초등 4~6학년, 중등 1~3학년, 고등 1~3학년'
const TEMP_MOCK_CONTACT_PHONE = '02-6085-6028'
const TEMP_MOCK_CONTACT_EMAIL = 'qa.temp-mock@tinto.co.kr'
const TEMP_MOCK_OPERATION_PERIOD = '2026.10.12(월) ~ 2026.11.20(금)'
const TEMP_MOCK_PARTICIPANT_RECRUITMENT_PERIOD = '2026.09.01(화) ~ 2026.09.30(수)'
const TEMP_MOCK_INSTRUCTOR_RECRUITMENT_PERIOD = '2026.09.01(화) ~ 2026.09.20(일)'
const TEMP_MOCK_VOLUNTEER_RECRUITMENT_PERIOD = '2026.09.01(화) ~ 2026.09.25(금)'

const TEMP_MOCK_RECRUITMENT_DETAIL = {
  programDescription:
    'JA Korea 기관 대상 경제·금융 교육 프로그램입니다. 학교·기관 교실에서 4회차 커리큘럼으로 진행됩니다.',
  recruitmentGuide:
    '홈페이지 모집 공고 확인 후 온라인 신청서를 작성·제출해 주세요. 승인 결과는 담당 교사 이메일로 안내됩니다.',
  applicationMethod: 'JA Korea 홈페이지 > 프로그램 신청 > 기관 신청서 작성',
  learningSupportContent:
    '교재·활동지·강의 자료를 제공하며, 사전 교육 안내와 수업 운영 매뉴얼을 지원합니다.',
  additionalContentHtml:
    '<p>교육 진행 전 담당 교사 사전 교육 안내를 확인해 주세요.</p>',
  remarks: 'CMS remote 회원·학교 ID로 구성한 FE 전용 기관 프로그램입니다.',
} as const

function buildTempMockOrgCommonInfo(): NonNullable<Program['generalCommonInfo']> {
  const base = cloneJson(GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_COMMON_INFO_MOCK)

  return {
    ...base,
    announcementTitle: '2026년 로컬나눔은행-JA Korea 기관 경제교육 쇼케이스',
    detailedProgramName: TEMP_MOCK_DETAILED_PROGRAM_NAME,
    sponsorDisplayName: TEMP_MOCK_SPONSOR_DISPLAY_NAME,
    sponsorManagementId: TEMP_MOCK_PRIMARY_SPONSOR_ID,
    sponsorManagementIds: [TEMP_MOCK_PRIMARY_SPONSOR_ID, TEMP_MOCK_SECONDARY_SPONSOR_ID],
    sponsorManagerLine: TEMP_MOCK_SPONSOR_MANAGER_LINE,
    venueDetail: '기관 교실',
    educationFormLabel: '대면 교육',
    ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
    educationScheduleMode: 'date',
    educationScheduleLines: [
      '26년 10월 12일(월) 9:00 ~ 11:50',
      '26년 10월 19일(월) 9:00 ~ 11:50',
      '26년 10월 26일(월) 9:00 ~ 11:50',
      '26년 11월 02일(월) 9:00 ~ 11:50',
    ],
    curriculumSessions: [
      {
        sessionLabel: '1회차',
        title: '나와 경제',
        description: '역할과 선택, 경제 활동의 의미를 알아봅니다.',
        assignmentEnabled: true,
        assignmentPeriod: '26년 10월 19일(월) ~ 26년 10월 26일(월)',
      },
      {
        sessionLabel: '2회차',
        title: '돈의 흐름',
        description: '수입과 지출, 돈이 순환하는 원리를 학습합니다.',
        assignmentEnabled: true,
        assignmentPeriod: '26년 10월 26일(월) ~ 26년 11월 02일(월)',
      },
      {
        sessionLabel: '3회차',
        title: '저축과 소비',
        description: '합리적 소비와 저축 습관을 토론합니다.',
        assignmentEnabled: true,
        assignmentPeriod: '26년 11월 02일(월) ~ 26년 11월 09일(월)',
      },
      {
        sessionLabel: '4회차',
        title: '함께하는 경제',
        description: '공동체 활동을 통해 경제 의사결정을 실습합니다.',
        assignmentEnabled: true,
        assignmentPeriod: '26년 11월 09일(월) ~ 26년 11월 16일(월)',
      },
    ],
    kpi: {
      finalParticipants: 216,
      instructorCount: 8,
      volunteerCount: 8,
      finalSchools: 8,
      finalClasses: 16,
    },
    participantRecruitmentInfo: {
      announcementPublished: true,
      announcementPublishedLabel: '게시',
      preEducationNoticeRequired: true,
      preEducationNoticeRequiredLabel: '작성',
      certificateIssuanceProvided: true,
      studentListRequired: 'required',
      studentListRequiredLabel: '제출 필요',
      maxAssignableInstructors: 2,
      maxClassCount: 4,
      maxSessionsPerDay: 8,
      maxScheduleCount: 3,
      operationPeriodLabel: TEMP_MOCK_OPERATION_PERIOD,
      recruitmentPeriodLabel: TEMP_MOCK_PARTICIPANT_RECRUITMENT_PERIOD,
      finalAnnouncementLabel: '2026.10.05(월) | 홈페이지 공지 및 담당교사 개별 안내',
      contactOrganizationName: TEMP_MOCK_SPONSOR_CONTACT_ORG_NAME,
      inquiryTel: TEMP_MOCK_CONTACT_PHONE,
      inquiryEmail: TEMP_MOCK_CONTACT_EMAIL,
      educationTarget: TEMP_MOCK_EDUCATION_TARGET,
      educationTargetDetail: TEMP_MOCK_EDUCATION_TARGET_DETAIL,
      ...TEMP_MOCK_RECRUITMENT_DETAIL,
    },
    instructorRecruitmentInfo: {
      announcementPublished: true,
      announcementPublishedLabel: '게시',
      operationPeriodLabel: TEMP_MOCK_OPERATION_PERIOD,
      recruitmentPeriodLabel: TEMP_MOCK_INSTRUCTOR_RECRUITMENT_PERIOD,
      finalAnnouncementLabel: '2026.10.08(목) | 홈페이지 공지 및 개별 연락',
      contactOrganizationName: TEMP_MOCK_SPONSOR_CONTACT_ORG_NAME,
      inquiryTel: TEMP_MOCK_CONTACT_PHONE,
      inquiryEmail: TEMP_MOCK_CONTACT_EMAIL,
      recruitmentTarget: '성인, 대학생',
      recruitmentTargetDetail: '경제·금융 교육 경험 보유자 우대',
      programDescription:
        '기관 경제교육 강의를 담당할 JA Korea 강사를 모집합니다. 4회차 커리큘럼 운영이 가능한 분을 찾습니다.',
      recruitmentGuide:
        '홈페이지 강사 모집 공고 확인 후 이력서·희망 배정 학교를 작성해 제출해 주세요.',
      applicationMethod: 'JA Korea 홈페이지 > 강사 신청 > 희망 학교 4곳 선택',
      learningSupportContent: '강의 자료·교재·운영 매뉴얼 및 사전 연수를 제공합니다.',
      additionalContentHtml: '<p>배정 학교 확정 후 담당 교사와 일정 조율이 필요합니다.</p>',
      remarks: '강사비 등급 및 정산 안내는 승인 후 별도 안내됩니다.',
    },
    volunteerRecruitmentInfo: {
      announcementPublished: true,
      announcementPublishedLabel: '게시',
      volunteerInterviewEnabled: true,
      generalVolunteerInterviewEnabled: true,
      volunteerInterviewEnabledLabel: '면접 있음',
      operationPeriodLabel: TEMP_MOCK_OPERATION_PERIOD,
      recruitmentPeriodLabel: TEMP_MOCK_VOLUNTEER_RECRUITMENT_PERIOD,
      finalAnnouncementLabel: '2026.10.10(토) | 홈페이지 공지 및 개별 연락',
      contactOrganizationName: TEMP_MOCK_SPONSOR_CONTACT_ORG_NAME,
      inquiryTel: TEMP_MOCK_CONTACT_PHONE,
      inquiryEmail: TEMP_MOCK_CONTACT_EMAIL,
      recruitmentTarget: '대학(원)생, 일반인',
      recruitmentTargetDetail: '청소년 교육 봉사 경험자 우대',
      programDescription:
        '기관 경제교육 수업 보조 및 학생 활동 지원 봉사자를 모집합니다.',
      recruitmentGuide:
        '홈페이지 봉사자 모집 공고 확인 후 지원서·자기소개서를 작성해 제출해 주세요.',
      applicationMethod: 'JA Korea 홈페이지 > 봉사자 신청 > 면접 가능 일정 선택',
      learningSupportContent: '봉사 활동 매뉴얼·교육 자료·사전 오리엔테이션을 제공합니다.',
      additionalContentHtml: '<p>1365 자원봉사 시간 등록을 지원합니다.</p>',
      remarks: '면접 일정은 지원서 작성 시 선택한 가능 시간을 기준으로 배정됩니다.',
    },
  }
}

function buildProgram(): Program {
  const now = '2026-09-17T12:00:00+09:00'
  const commonInfo = buildTempMockOrgCommonInfo()

  return {
    id: TEMP_MOCK_ORG_PROGRAM_ID,
    sponsorId: TEMP_MOCK_PRIMARY_SPONSOR_ID,
    title: '[임시] 기관 경제교육 쇼케이스',
    mainTitle: '기관 경제교육 쇼케이스',
    titleEn: 'Organization Economic Education Showcase',
    type: 'offline',
    format: 'course',
    category: 'school',
    description: TEMP_MOCK_RECRUITMENT_DETAIL.programDescription,
    businessArea: TEMP_MOCK_TEXTBOOK_BUSINESS_AREA,
    textbookName: TEMP_MOCK_TEXTBOOK_NAME,
    textbookNameEn: TEMP_MOCK_TEXTBOOK_NAME_EN,
    teamDivision: 'C&D',
    educationProcess: 'Traditional (Paper)',
    courseDeliveredBy: 'JA',
    partnerInvolvement: false,
    ipOwned: 'JA',
    rounds: [1, 2, 3, 4].map(roundNumber => ({
      id: `temp-mock-org-round-${roundNumber}`,
      programId: TEMP_MOCK_ORG_PROGRAM_ID,
      roundNumber,
      startDate: `2026-10-${String(12 + (roundNumber - 1) * 7).padStart(2, '0')}`,
      endDate: `2026-10-${String(12 + (roundNumber - 1) * 7).padStart(2, '0')}`,
      capacity: 240,
      classCount: 8,
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
    institutionType: 'inside_school',
    educationTime: 8,
    totalParticipants: 216,
    approvedStudentCount: 216,
    instructors: 8,
    generalVolunteers: 8,
    participatingSchoolCount: 8,
    participatingStudentCount: 216,
    managerName: '테스트 PM 관리자',
    venue: '참여 기관 교실',
    contactPhone: TEMP_MOCK_CONTACT_PHONE,
    contactEmail: TEMP_MOCK_CONTACT_EMAIL,
    oneLineIntroduction: '실제 소속 회원으로 기관·강사·봉사자 LNB를 확인합니다.',
    recruitmentGuide: TEMP_MOCK_RECRUITMENT_DETAIL.recruitmentGuide,
    learningSupportContent: TEMP_MOCK_RECRUITMENT_DETAIL.learningSupportContent,
    additionalContentHtml: TEMP_MOCK_RECRUITMENT_DETAIL.additionalContentHtml,
    applicationMethod: TEMP_MOCK_RECRUITMENT_DETAIL.applicationMethod,
    otherNotes: TEMP_MOCK_RECRUITMENT_DETAIL.remarks,
    attachmentFileNames: ['모집안내.pdf', '교육운영계획.hwp'],
    studentListRequired: 'required',
    instructorCapacity: 16,
    instructorApplicationStartDate: '2026-09-01',
    instructorApplicationEndDate: '2026-09-20',
    instructorTargets: ['성인', '대학생'],
    instructorTargetDetail: '경제·금융 교육 경험 보유자 우대',
    volunteerApplicationStartDate: '2026-09-01',
    volunteerApplicationEndDate: '2026-09-25',
    volunteerTargets: ['대학(원)생', '일반인'],
    volunteerTargetDetail: '청소년 교육 봉사 경험자 우대',
    documentPassAnnouncementDate: '2026-10-01',
    documentPassAnnouncementMethod: '홈페이지 공지',
    interviewStartDate: '2026-10-02',
    interviewEndDate: '2026-10-08',
    interviewMethod: '온라인',
    finalPassAnnouncementDate: '2026-10-10',
    finalPassAnnouncementMethod: '홈페이지 공지 및 개별 연락',
    resultAnnouncementDate: '2026-10-05',
    resultAnnouncementMethod: '홈페이지 공지 및 담당교사 개별 안내',
    scheduleTimeEnabled: true,
    startTime: '09:00',
    endTime: '17:00',
    generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
    generalVolunteerInterviewEnabled: true,
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalCommonInfo: commonInfo,
    createdAt: now,
    updatedAt: now,
    createdByName: '틴토 QA',
    updatedByName: '틴토 QA',
  }
}

function buildApplicantSchools(): ApplicantSchoolRow[] {
  const approvals: ApplicantSchoolRow['approvalStatus'][] = [
    'approved',
    'approved',
    'pending',
    'pending',
    'rejected',
    'rejected',
    'approved',
    'approved',
  ]
  return SCHOOLS.map((school, index) => {
    const approvalStatus = approvals[index]
    return {
      id: schoolRowId(school.organizationId),
      organizationId: school.organizationId,
      teacherMemberId: school.teacherMemberId,
      no: index + 1,
      schoolName: school.schoolName,
      region: school.region,
      educationGrade: school.educationGrade,
      classCount: 2 + (index % 3),
      studentCount: 24 + index * 2,
      teacherName: school.teacherName,
      contact: formatPhone(school.teacherPhone),
      appliedAt: `2026.09.${String(2 + index).padStart(2, '0')} 10:00:00`,
      approvalStatus,
      scheduleChangeCancelCount: index % 3,
      programId: TEMP_MOCK_ORG_PROGRAM_ID,
      sessions: buildSessions(index),
      assignedInstructorNames: index < 8 ? INSTRUCTORS[index]?.name : undefined,
      desiredEducationPeriod: '2026.10.13(월) ~ 2026.11.07(금)',
      lectureRound: '4회차',
      textbookName: TEMP_MOCK_TEXTBOOK_NAME,
      educationTarget: school.educationGrade,
      preferredScheduleBlocks: [
        {
          preferenceRank: 1,
          date: '2026-10-13',
          dayOfWeek: WEEKDAYS[index],
          sessionCount: 4,
          sessionTimes: [
            { sessionIndex: 1, classPeriod: '1교시', timeRange: '09:00 ~ 09:50' },
            { sessionIndex: 2, classPeriod: '2교시', timeRange: '10:00 ~ 10:50' },
            { sessionIndex: 3, classPeriod: '3교시', timeRange: '11:00 ~ 11:50' },
            { sessionIndex: 4, classPeriod: '4교시', timeRange: '13:00 ~ 13:50' },
          ],
        },
      ],
      participationRejectionReason:
        approvalStatus === 'rejected' ? '희망 일정과 운영 가능 일정이 맞지 않습니다.' : undefined,
      adminComment: `${school.schoolName} 기관 신청 확인용`,
      detail: {
        addressDetail: school.address,
        educationLocation: '본관 3층 경제교육실',
        educationType: '대면 교육',
        textbookId: TEMP_MOCK_TEXTBOOK_ID,
        textbookName: TEMP_MOCK_TEXTBOOK_NAME,
        totalHoursAndSessions: '총 8시간 | 4회차',
        previousYearParticipation: index % 2 === 0 ? '참여' : '미참여',
        affiliatedFinancialCompany: 'JA Korea',
        teacherInfo: `${school.teacherName} | ${formatPhone(school.teacherPhone)} | ${school.teacherGender === '남성' ? 'M' : 'F'} | ${school.teacherEmail}`,
        applicationReason: '학생 경제·금융 역량 향상을 위해 신청했습니다.',
        otherRequests: '수업 전 교사 사전 연수 일정 안내를 요청드립니다.',
        computerInSpace: '노트북·빔프로젝터 사용 가능',
        waitingPlaceGuide: '본관 2층 회의실',
        waitingRoom: '본관 2층 회의실',
        mealInfo: '강사 식사 1식 제공',
        parkingInfo: '교사 주차 2대 가능 (정문 주차장)',
        otherSpecialNotes: '교실 이동 시 복도 혼잡 시간대를 피해 주세요.',
        sexOffenseCheckRequest: '요청',
        combinedClassApplication: '미신청',
      },
    }
  })
}

function buildParticipatingSchools(): ParticipatingSchoolRow[] {
  return SCHOOLS.map((school, index) => {
    const instructor = INSTRUCTORS[index]
    return {
      id: schoolRowId(school.organizationId),
      organizationId: school.organizationId,
      teacherMemberId: school.teacherMemberId,
      no: index + 1,
      schoolName: school.schoolName,
      region: school.region,
      educationGrade: school.educationGrade,
      classCount: 2 + (index % 3),
      studentCount: 24 + index * 2,
      lectureRound: '4회차',
      textbookName: TEMP_MOCK_TEXTBOOK_NAME,
      textbookStatus: TEXTBOOK_STATUSES[index],
      approvalStatus: 'approved',
      teacherName: school.teacherName,
      instructors: instructor ? `${instructor.name}` : '-',
      sessions: buildSessions(index),
      programId: TEMP_MOCK_ORG_PROGRAM_ID,
      organizationApplicationId: schoolRowId(school.organizationId),
      participantStatus: 'APPROVED',
      activityWithdrawn: false,
      availableActions: ['GIVE_UP'],
    }
  })
}

function buildApplicantInstructors(): ApplicantInstructorRow[] {
  const statuses: ApplicantInstructorRow['approvalStatus'][] = [
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
    'pending',
    'approved',
    'pending',
    'rejected',
  ]
  return INSTRUCTORS.map((instructor, index) => {
    const school = SCHOOLS[index % SCHOOLS.length]
    const approvalStatus = statuses[index] ?? 'pending'
    return {
      id: `${TEMP_MOCK_ORG_INSTRUCTOR_APP_PREFIX}${instructor.memberId}`,
      instructorMemberId: instructor.memberId,
      affiliationOrganizationId: instructor.affiliationOrgId ?? null,
      programId: TEMP_MOCK_ORG_PROGRAM_ID,
      no: index + 1,
      instructorName: instructor.name,
      lectureExperienceYears: 3 + (index % 8),
      educationLevel: '대학교 졸업',
      educationSchoolName: instructor.dual ? instructor.affiliationName ?? 'JA 강사단' : 'JA 강사단',
      contact: formatPhone(instructor.phone),
      email: instructor.email,
      address: school.address,
      appliedAt: `2026.09.${String(3 + (index % 12)).padStart(2, '0')} 11:00:00`,
      affiliation: instructor.affiliationName ?? 'JA 강사단',
      approvalStatus,
      schoolName: school.schoolName,
      scheduleChangeCancelCount: index % 4,
      evaluationGrade: (['A', 'B', 'C'] as const)[index % 3],
      instructorFeeGradeLabel: `${(index % 3) + 1}급 강사비`,
      instructorMemberProfile: instructor.dual ? 'instructor_dual' : 'instructor_only',
      affiliationEmploymentStatus: instructor.dual ? 'ACTIVE' : undefined,
      teachingExperience: index % 2 === 0 ? '3년 이상' : '1~3년',
      oneLineIntro: `${instructor.name} 경제교육 강사`,
      nameEnglish: instructor.email.split('@')[0]?.replace(/\./g, ' ') ?? instructor.name,
      nameHanja: instructor.name,
      birthDate: formatBirth(instructor.birthDate),
      age: ageFromBirth(instructor.birthDate),
      gender: instructor.gender,
      militaryStatus: instructor.gender === '남성' ? '군필' : '해당 없음',
      bankName: '국민은행',
      accountNumber: `123-456-${String(instructor.memberId).slice(-6)}`,
      accountHolder: instructor.name,
      preferredSchools: preferredSchoolsForInstructor(index),
      assignedSchoolId: approvalStatus === 'approved' ? schoolRowId(school.organizationId) : undefined,
      assignedSchoolName: approvalStatus === 'approved' ? school.schoolName : undefined,
      rejectionReason:
        approvalStatus === 'rejected' ? '희망 배정 학교와 운영 일정이 맞지 않습니다.' : undefined,
      careerDetails: [
        {
          companyName: instructor.affiliationName ?? 'JA Korea',
          role: instructor.dual ? '교사 겸 강사' : '전임 강사',
          startDate: '2018-03',
          isCurrent: true,
        },
      ],
      educations: [
        {
          schoolType: '대학교',
          status: '졸업',
          schoolName: '한국대학교',
          major: '사회과교육',
          enrollmentYear: '2009',
          graduationYear: '2013',
        },
      ],
      qualifications: [{ name: '중등학교 정교사 2급', year: '2013', issuer: '교육부' }],
      awards: [{ name: '경제교육 우수강사', year: '2024', issuer: 'JA Korea' }],
      jaKoreaActivities: [
        {
          periodStart: '2023-03',
          periodEnd: '2024-12',
          title: '기관 경제교육 강의',
          note: '초등·중등 대상 12회 출강',
        },
      ],
      instructorCareerLevel: 'experienced',
      freeWriting1: '청소년 경제 교육에 기여하고 싶어 지원했습니다.',
      freeWriting2: '일상 속 선택과 소비를 스스로 설명할 수 있게 돕는 것이 중요합니다.',
      freeWriting3: '질문과 활동으로 학생 참여를 유도합니다.',
      freeWriting4: '일정 변경 시 담당 교사와 즉시 조율합니다.',
      managerComment: approvalStatus === 'approved' ? '배정 가능' : undefined,
      availableActions: ['APPROVE', 'REJECT', 'COMMENT_UPDATE'],
      lectureFeeBasisType: 'special_lecture',
      lectureFeeMeasure: '출강 1회당',
      lectureFeeAmount: '150000',
      lectureFeeBasisDisplay: '특강 강사비 | 출강 1회당 | 150,000원',
      businessIncomeEarnerStatus: '해당 없음',
    }
  })
}

function buildProgressInstructors(): ParticipatingInstructorRow[] {
  const applicantsByMemberId = new Map(
    buildApplicantInstructors().map(applicant => [applicant.instructorMemberId, applicant])
  )

  return INSTRUCTORS.slice(0, 8).map((instructor, index) => {
    const school = SCHOOLS[index]
    const applicant = applicantsByMemberId.get(instructor.memberId)
    const sessions = buildSessions(index)
    const educationSchedules = sessions
      .filter(session => session.status !== 'not_planned')
      .map(session => ({
        id: String(session.resolvedScheduleId ?? `${index}-${session.round}`),
        scheduleLabel: formatParticipatingSchoolSessionLine(session),
        progress:
          session.status === 'completed'
            ? ('completed' as const)
            : session.status === 'pending'
              ? ('scheduled' as const)
              : ('in_progress' as const),
      }))

    return {
      id: `${TEMP_MOCK_ORG_PROGRESS_INSTRUCTOR_PREFIX}${instructor.memberId}`,
      no: index + 1,
      instructorName: instructor.name,
      schoolName: school.schoolName,
      educationGrade: school.educationGrade,
      classCount: 2 + (index % 3),
      studentCount: 24 + index * 2,
      lectureRound: '4회차',
      settlementStatus: SETTLEMENT_STATUSES[index],
      teacherName: school.teacherName,
      memberId: String(instructor.memberId),
      instructorApplicationId: `${TEMP_MOCK_ORG_INSTRUCTOR_APP_PREFIX}${instructor.memberId}`,
      affiliationOrganizationId: instructor.affiliationOrgId ?? null,
      contact: formatPhone(instructor.phone),
      email: instructor.email,
      address: school.address,
      nameEnglish: applicant?.nameEnglish,
      nameHanja: applicant?.nameHanja,
      birthDate: formatBirth(instructor.birthDate),
      age: ageFromBirth(instructor.birthDate),
      gender: instructor.gender,
      militaryStatus: applicant?.militaryStatus,
      bankName: '국민은행',
      accountNumber: `123-456-${String(instructor.memberId).slice(-6)}`,
      accountHolder: instructor.name,
      oneLineIntro: applicant?.oneLineIntro ?? `${instructor.name} 경제교육 강사`,
      educationLevel: applicant?.educationLevel ?? '대학교 졸업',
      educationSchoolName: applicant?.educationSchoolName ?? 'JA 강사단',
      lectureExperienceYears: applicant?.lectureExperienceYears ?? 3 + (index % 8),
      careerDetails: applicant?.careerDetails,
      educations: applicant?.educations,
      qualifications: applicant?.qualifications,
      awards: applicant?.awards,
      freeWriting1: applicant?.freeWriting1,
      freeWriting2: applicant?.freeWriting2,
      freeWriting3: applicant?.freeWriting3,
      freeWriting4: applicant?.freeWriting4,
      assignedOrganizationNames: [school.schoolName],
      jaEvaluationGrade: applicant?.evaluationGrade ?? (['A', 'B', 'C'] as const)[index % 3],
      affiliation: instructor.affiliationName ?? 'JA 강사단',
      instructorMemberProfile: applicant?.instructorMemberProfile,
      affiliationEmploymentStatus: applicant?.affiliationEmploymentStatus,
      instructorFeeGradeLabel: applicant?.instructorFeeGradeLabel ?? `${(index % 3) + 1}급 강사비`,
      lectureFeeBasisType: applicant?.lectureFeeBasisType,
      lectureFeeMeasure: applicant?.lectureFeeMeasure,
      lectureFeeAmount: applicant?.lectureFeeAmount,
      lectureFeeBasisDisplay:
        applicant?.lectureFeeBasisDisplay ?? '특강 강사비 | 출강 1회당 | 150,000원',
      businessIncomeEarnerStatus: applicant?.businessIncomeEarnerStatus,
      scheduleChangeCancelCount: applicant?.scheduleChangeCancelCount ?? index % 4,
      adminComment: applicant?.managerComment ?? `${school.schoolName} 배정`,
      educationSchedules,
      activityWithdrawn: false,
    }
  })
}

function volunteerDocStatus(index: number): GeneralVolunteerApplicantRow['documentScreeningStatus'] {
  if (index <= 3) return 'pending'
  if (index <= 5) return 'fail'
  return 'pass'
}

function volunteerInterviewStatus(
  index: number
): GeneralVolunteerApplicantRow['interviewAssignmentStatus'] {
  if (index === 15) return 'withdrawn'
  if (index >= 10) return 'assigned'
  if (index >= 6) return 'waiting'
  return 'waiting'
}

function volunteerSecondStatus(
  index: number
): GeneralVolunteerApplicantRow['secondInterviewScreeningStatus'] {
  if (index === 14) return 'pass'
  if (index === 13) return 'fail'
  if (index === 12) return 'reserve1'
  if (index >= 10 && index <= 11) return 'completed'
  return undefined
}

/** 2차 면접 대상자 — 담당자 A·B 점수(각 0~10, 합 1~10). 목록 `점수 종합`은 이 값으로 계산됨 */
function volunteerInterviewEvaluationScores(
  index: number
): Pick<
  GeneralVolunteerApplicantRow,
  'managerAScore' | 'managerBScore' | 'totalScore' | 'interviewEvaluationRemark'
> {
  const presets: Record<
    number,
    { managerAScore: number; managerBScore: number; interviewEvaluationRemark: string }
  > = {
    10: {
      managerAScore: 3,
      managerBScore: 4,
      interviewEvaluationRemark: '의사소통 및 협업 태도 양호',
    },
    11: {
      managerAScore: 4,
      managerBScore: 3,
      interviewEvaluationRemark: '봉사 동기 명확, 추가 경험 보완 필요',
    },
    12: {
      managerAScore: 4,
      managerBScore: 3,
      interviewEvaluationRemark: '예비 합격 순위 대상',
    },
    13: {
      managerAScore: 2,
      managerBScore: 2,
      interviewEvaluationRemark: '프로그램 적합성 부족',
    },
    14: {
      managerAScore: 5,
      managerBScore: 4,
      interviewEvaluationRemark: '활동 경험·봉사 의지 우수',
    },
  }
  const preset = presets[index]
  if (!preset) return {}
  return {
    ...preset,
    totalScore: preset.managerAScore + preset.managerBScore,
  }
}

function volunteerAvailability(index: number): GeneralVolunteerApplicantRow['interviewAvailability'] {
  const day = 2 + (index % 5)
  return [
    {
      dateLabel: `2026.10.0${day}(금)`,
      slots: index % 2 === 0 ? ['10:00 ~ 10:30', '14:00 ~ 14:30'] : ['11:00 ~ 11:30'],
    },
  ]
}

function buildVolunteerApplicants(): GeneralVolunteerApplicantRow[] {
  return VOLUNTEERS.map((volunteer, index) => {
    const documentScreeningStatus = volunteerDocStatus(index)
    const interviewAssignmentStatus = volunteerInterviewStatus(index)
    const secondInterviewScreeningStatus = volunteerSecondStatus(index)
    const assigned = interviewAssignmentStatus === 'assigned'
    return {
      id: `${TEMP_MOCK_ORG_VOLUNTEER_APP_PREFIX}${volunteer.memberId}`,
      memberId: volunteer.memberId,
      affiliationOrganizationId: null,
      no: index + 1,
      name: volunteer.name,
      contact: formatPhone(volunteer.phone),
      email: volunteer.email,
      contactRaw: formatPhone(volunteer.phone),
      emailRaw: volunteer.email,
      id1365: `1365-${volunteer.memberId}`,
      scheduleChangeCancelCount: index % 3,
      applicationType: index % 2 === 0 ? 'new' : 'ujat-graduate',
      hasJaVolunteerExperience: index % 2 === 1,
      essayIntro: '청소년 교육에 기여하고자 JA Korea 봉사활동에 지원했습니다.',
      essayEducationExperience: '경제교육 보조 및 청소년 멘토링 경험이 있습니다.',
      essayNecessity: '학생 참여형 활동을 원활하게 운영하기 위해 봉사자가 필요합니다.',
      essayJaExperience:
        index % 2 === 1 ? '이전 JA Korea 프로그램 봉사활동에 참여했습니다.' : '첫 참여입니다.',
      managerAEvaluation: index <= 3 ? 'unreviewed' : index <= 5 ? 'fail' : 'pass',
      managerBEvaluation: index <= 3 ? 'unreviewed' : index === 5 ? 'neutral' : 'pass',
      canEditManagerAEvaluation: true,
      canEditManagerBEvaluation: true,
      availableActions: [
        'DOCUMENT_PASS',
        'DOCUMENT_FAIL',
        'UPDATE_DOCUMENT_EVALUATION',
        'ASSIGN_INTERVIEW',
        'GIVE_UP',
        'COMMENT_UPDATE',
      ],
      documentScreeningStatus,
      interviewSlotCount: index % 2 === 0 ? 2 : 1,
      interviewAssignmentStatus,
      programId: TEMP_MOCK_ORG_PROGRAM_ID,
      englishName: volunteer.email.split('@')[0] ?? volunteer.name,
      gender: volunteer.gender,
      birthDate: formatBirth(volunteer.birthDate),
      age: ageFromBirth(volunteer.birthDate),
      universityName: volunteer.affiliationName ?? '-',
      major: '교육학',
      applicationRoute: '홈페이지',
      interviewAvailability: volunteerAvailability(index),
      assignedInterviewDateLabel: assigned ? '2026.10.03(금)' : undefined,
      assignedInterviewTime: assigned ? '10:00 ~ 10:30' : undefined,
      interviewAssignmentId: assigned ? 860_000 + volunteer.memberId : undefined,
      secondInterviewScreeningStatus,
      ...volunteerInterviewEvaluationScores(index),
      adminComment: volunteer.affiliationName ?? '소속 없음',
    }
  })
}

function buildProgressVolunteers(): ParticipatingVolunteerRow[] {
  return VOLUNTEERS.slice(8, 16).map((volunteer, index) => {
    const school = SCHOOLS[index]
    return {
      id: `${TEMP_MOCK_ORG_PROGRESS_VOLUNTEER_PREFIX}${volunteer.memberId}`,
      memberId: volunteer.memberId,
      affiliationOrganizationId: null,
      affiliation: volunteer.affiliationName ?? '-',
      programId: TEMP_MOCK_ORG_PROGRAM_ID,
      no: index + 1,
      volunteerName: volunteer.name,
      id1365: `1365-${volunteer.memberId}`,
      assignedInstitutionNames: [school.schoolName],
      sessions: buildSessions(index).map(session => ({
        ...session,
        format: '대면 봉사',
      })),
      contact: formatPhone(volunteer.phone),
      email: volunteer.email,
      isReturningVolunteer: index % 2 === 1,
      contactRaw: formatPhone(volunteer.phone),
      emailRaw: volunteer.email,
      gender: volunteer.gender,
      birthDate: formatBirth(volunteer.birthDate),
      age: ageFromBirth(volunteer.birthDate),
      scheduleChangeCancelCount: index % 3,
      hasJaVolunteerExperience: index % 2 === 1,
      applicationType: index % 2 === 0 ? 'new' : 'ujat-graduate',
      adminComment: `${school.schoolName} 배정`,
      activityWithdrawn: false,
      activityWithdrawStopSessionKey: '',
      performanceExcludedSessionKeys: [],
      essayIntro: '청소년 교육에 기여하고자 JA Korea 봉사활동에 지원했습니다.',
      essayEducationExperience: '경제교육 보조 및 청소년 멘토링 경험이 있습니다.',
      essayNecessity: '학생 참여형 활동을 원활하게 운영하기 위해 봉사자가 필요합니다.',
      essayJaExperience:
        index % 2 === 1 ? '이전 JA Korea 프로그램 봉사활동에 참여했습니다.' : '첫 참여입니다.',
    }
  })
}

const PROGRAM = buildProgram()
const APPLICANT_SCHOOLS = buildApplicantSchools()
/** QA admin-accounts — 165001(PM) · 165002(파트너) · 165003(뷰어) */
function buildProgramManagers(): ProgramManagerRow[] {
  return [
    {
      id: 'temp-mock-org-manager-165001',
      no: 3,
      name: '테스트 PM 관리자',
      role: 'OWNER',
      phone: '010-0000-5001',
      email: 'pm@jakorea.org',
      registeredAt: '2026-09-16',
      adminId: 165001,
      cmsRoleCode: 'MIDDLE',
      removableYn: true,
    },
    {
      id: 'temp-mock-org-manager-165002',
      no: 2,
      name: '테스트 파트너 관리자',
      role: 'PARTNER',
      phone: '010-0000-5002',
      email: 'partner@jakorea.org',
      registeredAt: '2026-09-16',
      adminId: 165002,
      cmsRoleCode: 'MIDDLE',
      removableYn: true,
    },
    {
      id: 'temp-mock-org-manager-165003',
      no: 1,
      name: '테스트 뷰어 관리자',
      role: 'ASSISTANT',
      phone: '010-0000-5003',
      email: 'viewer@jakorea.org',
      registeredAt: '2026-09-16',
      adminId: 165003,
      cmsRoleCode: 'VIEWER',
      removableYn: true,
    },
  ]
}

const PROGRAM_MANAGERS = buildProgramManagers()
const PARTICIPATING_SCHOOLS = buildParticipatingSchools()
const APPLICANT_INSTRUCTORS = buildApplicantInstructors()
const PROGRESS_INSTRUCTORS = buildProgressInstructors()
const VOLUNTEER_APPLICANTS = buildVolunteerApplicants()
const PROGRESS_VOLUNTEERS = buildProgressVolunteers()

export function getTempMockOrgProgram(): Program | null {
  if (!isGeneralProgramTempMockEnabled()) return null
  return cloneJson(PROGRAM)
}

export function getTempMockOrgProgramIfId(programId?: string | null): Program | null {
  if (!isGeneralProgramTempMockProgramId(programId)) return null
  return cloneJson(PROGRAM)
}

export function getTempMockOrgApplicantSchools(programId?: string | null): ApplicantSchoolRow[] {
  if (!isGeneralProgramTempMockProgramId(programId)) return []
  return cloneJson(APPLICANT_SCHOOLS)
}

export function getTempMockOrgParticipatingSchools(
  programId?: string | null
): ParticipatingSchoolRow[] {
  if (!isGeneralProgramTempMockProgramId(programId)) return []
  return cloneJson(PARTICIPATING_SCHOOLS)
}

export function getTempMockOrgApplicantInstructors(
  programId?: string | null
): ApplicantInstructorRow[] {
  if (!isGeneralProgramTempMockProgramId(programId)) return []
  return cloneJson(APPLICANT_INSTRUCTORS)
}

export function getTempMockOrgProgressInstructors(
  programId?: string | null
): ParticipatingInstructorRow[] {
  if (!isGeneralProgramTempMockProgramId(programId)) return []
  return cloneJson(PROGRESS_INSTRUCTORS)
}

export function getTempMockOrgVolunteerApplicants(
  programId?: string | null,
  stage?: 'doc1' | 'docPassed' | 'interview2'
): GeneralVolunteerApplicantRow[] {
  if (!isGeneralProgramTempMockProgramId(programId)) return []
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

export function getTempMockOrgProgressVolunteers(
  programId?: string | null
): ParticipatingVolunteerRow[] {
  if (!isGeneralProgramTempMockProgramId(programId)) return []
  return cloneJson(PROGRESS_VOLUNTEERS)
}

export function getTempMockOrgProgramManagers(programId?: string | null): ProgramManagerRow[] {
  if (!isGeneralProgramTempMockProgramId(programId)) return []
  return cloneJson(PROGRAM_MANAGERS)
}
