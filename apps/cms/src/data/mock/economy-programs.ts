/**
 * 경제 교육 프로그램 Mock 데이터
 * 스크린샷 기준: /programs/economy-education 테이블 데이터
 * 대표 조합 8건, 기존 연동용 ID(economy-prog-001~008)는 유지
 * 공통 정보 탭(기본 정보·KPI·임금·커리큘럼) 표시용 필드 보강
 */

import type {
  Program,
  ProgramRound,
  ProgramCategory,
  ProgramLifecycleStatus,
  TargetLevel,
  InstitutionType,
} from '../../types/domain'
import {
  mockApplicationPeriod,
  mockOperationPeriod,
  mockRecruitmentCaseFromLifecycle,
  mockOperationCaseFromLifecycle,
  mockRelativeIso,
} from './mock-program-period'
import { mockSponsors } from './sponsors'

const SPONSOR_ID = mockSponsors[0].id

const createRounds = (programId: string, capacity: number): ProgramRound[] => {
  const startDate = new Date(2026, 2, 1)
  return [
    {
      id: `${programId}-round-1`,
      programId,
      roundNumber: 1,
      startDate: startDate.toISOString(),
      endDate: new Date(2026, 2, 15).toISOString(),
      capacity,
      status: 'active',
      deliveryType: 'offline',
      curriculum: "1시간 | '개인', '근로자', '소비자' 개념 정의 및 설명",
    },
  ]
}

/** @deprecated mockRelativeIso 사용 — daysAgo 호환 */
const getDate = (daysAgo: number) => mockRelativeIso(daysAgo)

function economyPeriodFields(
  lifecycleStatus: ProgramLifecycleStatus,
  spreadDays = 0
): Pick<
  Program,
  'startDate' | 'endDate' | 'applicationStartDate' | 'applicationEndDate'
> {
  const app = mockApplicationPeriod(
    mockRecruitmentCaseFromLifecycle(lifecycleStatus),
    spreadDays
  )
  const op = mockOperationPeriod(mockOperationCaseFromLifecycle(lifecycleStatus), spreadDays)
  return { ...app, ...op }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function buildProgramStartEndTime(seed: number): { startTime: string; endTime: string } {
  const templates = [
    { startH: 9, startM: 0, durationM: 120 },
    { startH: 10, startM: 30, durationM: 90 },
    { startH: 13, startM: 0, durationM: 120 },
    { startH: 14, startM: 30, durationM: 90 },
    { startH: 16, startM: 0, durationM: 120 },
  ] as const
  const t = templates[seed % templates.length]
  const startTotal = t.startH * 60 + t.startM
  const endTotal = Math.min(startTotal + t.durationM, 24 * 60)
  const endH = Math.floor(endTotal / 60)
  const endM = endTotal % 60
  return {
    startTime: `${pad2(t.startH)}:${pad2(t.startM)}`,
    endTime: `${pad2(endH)}:${pad2(endM)}`,
  }
}

/** 공통 정보 탭·후원사 담당자 셀 등에 쓰이는 기본값 (건곳별로 덮어씀) */
const ECONOMY_SHARED_COMMON: Partial<Program> = {
  teamDivision: 'C&D',
  educationProcess: 'Traditional (Paper)',
  ipOwned: 'JA',
  courseDeliveredBy: 'JA',
  partnerInvolvement: false,
  educationTime: 2,
  createdByName: '홍길동',
  updatedByName: '이순신',
  managerName: '○○팀 이순신 책임',
  contactPhone: '010-1234-5678',
  contactEmail: 'education@jakorea.or.kr',
  maleParticipants: 14,
  femaleParticipants: 16,
  totalParticipants: 30,
  generalVolunteers: 0,
  staffVolunteers: 0,
  returningVolunteers: 0,
  generalTeachers: 1,
  educatedTeachers: 0,
  instructorCapacity: 80,
  generalParticipantTypes: ['school_institution', 'teacher_instructor'],
  generalCommonInfo: {
    curriculumSessions: [
      {
        sessionLabel: '1차시',
        title: '1단원 나를 알리는 기술',
        description: '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
      },
      {
        sessionLabel: '2차시',
        title: '2단원 나를 보여주는 기술',
        description: '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
      },
    ],
    educationScheduleMode: 'period',
    educationScheduleLines: ['2026. 03. 01 ~ 2026. 12. 30'],
    wageGradeRows: [
      { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 500,000원 | 장거리 : 500,000원' },
      { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 400,000원 | 장거리 : 400,000원' },
      { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 300,000원 | 장거리 : 300,000원' },
    ],
    paymentItems: '교통비(일사일교), 숙박비(일사일교)',
    deductionItems: '일용근로자 원천징수세액',
  },
  resultAnnouncementMethod: '홈페이지 공지 및 합격자 개별 안내',
}

const PARTICIPANT_CATEGORY_CYCLE: ProgramCategory[] = [
  'school',
  'instructor',
]

const SURVEY_MENU_FULL = ['survey', 'satisfaction', 'lecture_evaluation'] as const
const SURVEY_MENU_SINGLE = ['survey'] as const

/** 1사1교 대표 케이스 8건 (No. 1~8) */
const COMPANY_SCHOOL_CASE_PROGRAMS: Omit<
  Program,
  'id' | 'rounds' | 'createdAt' | 'updatedAt'
>[] = [
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: 'HSBC/HKU Business Case Competition 2026 모집 안내',
    mainTitle: 'HSBC/HKU Business Case Competition 2026',
    titleEn: 'HSBC/HKU Business Case Competition 2026',
    type: 'offline',
    format: 'workshop',
    category: PARTICIPANT_CATEGORY_CYCLE[0 % PARTICIPANT_CATEGORY_CYCLE.length],
    description: 'HSBC/HKU Business Case Competition 2026',
    ...economyPeriodFields('planned', 0),
    status: 'pending',
    lifecycleStatus: 'planned' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'elementary' as TargetLevel,
    approvedStudentCount: 0,
    institutionType: 'outside_school' as InstitutionType,
    district: '홍콩·국내 병행 (온·오프라인)',
    ips: 'Succeed',
    programCategory: 'Competition (대회+시상)',
    programChannel: null,
    courseDeliveredBy: 'Jointly',
    partnerInvolvement: true,
    educationTime: 8,
    textbookName: 'Business Case Study Workbook',
    textbookNameEn: 'Business Case Study Workbook',
    resultAnnouncementDate: getDate(-1),
    generalSurveyMenuKeys: [],
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
    mainTitle: '2026 JA Korea 대학생경제교육봉사단',
    titleEn: 'JA Korea University JA Volunteer Program UJAT 36th',
    type: 'offline',
    format: 'workshop',
    category: PARTICIPANT_CATEGORY_CYCLE[1 % PARTICIPANT_CATEGORY_CYCLE.length],
    description: '대학생경제교육봉사단 UJAT 36기',
    ...economyPeriodFields('recruiting_students', 0),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
    instructors: 30,
    instructorCapacity: 80,
    institutionType: 'outside_school' as InstitutionType,
    district: '전국',
    ips: 'Inspire',
    programCategory: null,
    programChannel: '학교 방문 (School visit)',
    textbookName: '우리 지역',
    textbookNameEn: 'Our Region',
    managerName: '사업팀 김담당 매니저',
    contactPhone: '02-6347-6113',
    generalSurveyMenuKeys: [...SURVEY_MENU_SINGLE],
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: 'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
    mainTitle: 'Growth to Professional 2026',
    titleEn: 'Growth to Professional 2026',
    type: 'offline',
    format: 'workshop',
    category: PARTICIPANT_CATEGORY_CYCLE[2 % PARTICIPANT_CATEGORY_CYCLE.length],
    description: 'Growth to Professional 2026',
    ...economyPeriodFields('recruiting_instructors', 7),
    instructorApplicationStartDate: mockRelativeIso(90),
    instructorApplicationEndDate: mockRelativeIso(-90, true),
    status: 'pending',
    lifecycleStatus: 'recruiting_instructors' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
    institutionType: 'outside_school' as InstitutionType,
    district: '서울 영등포구',
    ips: 'Prepare',
    programCategory: null,
    programChannel: null,
    courseDeliveredBy: 'Jointly',
    partnerInvolvement: true,
    textbookName: 'Career Readiness Module',
    textbookNameEn: 'Career Readiness Module',
    resultAnnouncementDate: getDate(-18),
    instructors: 12,
    generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026년 JA Korea 초등 경제교육 모집 안내',
    mainTitle: '2026년 JA Korea 초등 경제교육',
    titleEn: 'JA Korea Elementary Economic Education 2026',
    type: 'offline',
    format: 'workshop',
    category: PARTICIPANT_CATEGORY_CYCLE[3 % PARTICIPANT_CATEGORY_CYCLE.length],
    description: '초등 경제교육 모집',
    ...economyPeriodFields('matching_completed', 0),
    status: 'pending',
    lifecycleStatus: 'matching_completed' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'elementary' as TargetLevel,
    approvedStudentCount: 10,
    institutionType: 'inside_school' as InstitutionType,
    district: '경기 성남시',
    ips: 'Prepare',
    programCategory: null,
    programChannel: null,
    textbookName: 'Personal Finance',
    textbookNameEn: 'Personal Finance',
    maleParticipants: 120,
    femaleParticipants: 118,
    totalParticipants: 238,
    resultAnnouncementDate: getDate(1),
    instructors: 24,
    generalSurveyMenuKeys: [],
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026 SAP-함께 성장하JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)',
    mainTitle: 'SAP-함께 성장하JA! IT·SW 멘토링',
    titleEn: 'SAP-JA Korea IT & SW Mentoring 2026',
    type: 'offline',
    format: 'workshop',
    category: PARTICIPANT_CATEGORY_CYCLE[4 % PARTICIPANT_CATEGORY_CYCLE.length],
    description: 'SAP 함께 성장하JA IT SW 멘토링',
    ...economyPeriodFields('education_before_textbook', 5),
    status: 'active',
    lifecycleStatus: 'education_before_textbook' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
    institutionType: 'outside_school' as InstitutionType,
    district: '서울 판교 (집합)',
    ips: 'Prepare',
    programCategory: null,
    programChannel: null,
    courseDeliveredBy: 'Jointly',
    partnerInvolvement: true,
    educationTime: 4,
    textbookName: 'Digital Skills for Future',
    textbookNameEn: 'Digital Skills for Future',
    resultAnnouncementDate: getDate(18),
    instructors: 28,
    generalSurveyMenuKeys: [...SURVEY_MENU_SINGLE],
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집',
    mainTitle: 'Global Career Discovery 원데이 멘토링',
    titleEn: 'Global Career Discovery One-day Mentoring',
    type: 'offline',
    format: 'workshop',
    category: PARTICIPANT_CATEGORY_CYCLE[5 % PARTICIPANT_CATEGORY_CYCLE.length],
    description: 'Global Career Discovery 원데이 취업 멘토링',
    ...economyPeriodFields('education_after_textbook', 10),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
    instructors: 30,
    instructorCapacity: 40,
    institutionType: 'outside_school' as InstitutionType,
    district: '서울 강남구',
    ips: 'Succeed',
    programCategory: 'Workshop (워크숍)',
    programChannel: null,
    courseDeliveredBy: 'Jointly',
    partnerInvolvement: true,
    educationTime: 6,
    textbookName: 'Career Discovery Guide',
    textbookNameEn: 'Career Discovery Guide',
    participatingSchoolCount: 12,
    participatingStudentCount: 360,
    generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026년 JA Korea 경제금융교육 전문강사단 모집',
    mainTitle: '2026년 JA Korea 경제금융교육 전문강사단',
    titleEn: 'JA Korea Financial Literacy Instructor Corps 2026',
    type: 'offline',
    format: 'workshop',
    category: PARTICIPANT_CATEGORY_CYCLE[6 % PARTICIPANT_CATEGORY_CYCLE.length],
    description: '경제금융교육 전문강사단 모집',
    ...economyPeriodFields('education_completed', 0),
    status: 'completed',
    lifecycleStatus: 'education_completed' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
    instructors: 30,
    instructorCapacity: 50,
    institutionType: 'outside_school' as InstitutionType,
    district: '전국',
    ips: 'Prepare',
    programCategory: null,
    programChannel: null,
    textbookName: '어린이 금융박사 홈즈',
    textbookNameEn: 'Junior Financial Doctor Holmes',
    educationTime: 3,
    participatingSchoolCount: 15,
    participatingStudentCount: 462,
    generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집',
    mainTitle: '한국씨티은행-JA Korea 특별한 JOB담',
    titleEn: 'Citi-JA Korea Special JOB Talk 2026',
    type: 'offline',
    format: 'workshop',
    category: PARTICIPANT_CATEGORY_CYCLE[7 % PARTICIPANT_CATEGORY_CYCLE.length],
    description: '한국씨티은행 특별한 JOB담',
    ...economyPeriodFields('document_processing_completed', 14),
    status: 'completed',
    lifecycleStatus: 'document_processing_completed' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 20,
    institutionType: 'inside_school' as InstitutionType,
    district: '서울 중구',
    ips: 'Inspire',
    programCategory: null,
    programChannel: '기업 연계 세미나 (Corporate seminar)',
    courseDeliveredBy: 'Jointly',
    partnerInvolvement: true,
    textbookName: '진로와 금융',
    textbookNameEn: 'Careers and Finance',
    maleParticipants: 10,
    femaleParticipants: 10,
    totalParticipants: 20,
    instructors: 24,
    instructorCapacity: 28,
    participatingSchoolCount: 8,
    participatingStudentCount: 356,
    generalSurveyMenuKeys: [],
  },
]

/** 1사1교 대표 조합 프로그램 */
let economyProgramsCache: Program[] | null = null

function buildCompanySchoolCaseProgram(
  base: Omit<Program, 'id' | 'rounds' | 'createdAt' | 'updatedAt'>,
  index: number
): Program {
  const id = `economy-prog-${String(index + 1).padStart(3, '0')}`
  const capacity = 30
  const { startTime, endTime } = buildProgramStartEndTime(index)

  return {
    ...base,
    id,
    rounds: createRounds(id, capacity),
    startTime,
    endTime,
    createdAt: getDate(90 - index),
    updatedAt: getDate(90 - index),
    posterImage: `https://picsum.photos/seed/${id}/400/300`,
    keyVisualImage: `https://picsum.photos/seed/${id}/400/300`,
  } as Program
}

export function getCompanySchoolPrograms(): Program[] {
  if (economyProgramsCache) return economyProgramsCache

  // 기존 mock 연동을 위해 economy-prog-001~008 ID는 유지한다.
  economyProgramsCache = COMPANY_SCHOOL_CASE_PROGRAMS.map(buildCompanySchoolCaseProgram)
  return economyProgramsCache
}

/** 상세 모달·KPI 등에서 ID만으로 1사1교 프로그램을 찾을 때 사용 */
export function getCompanySchoolProgramById(id: string): Program | undefined {
  return getCompanySchoolPrograms().find(p => p.id === id)
}

/** @deprecated `getCompanySchoolPrograms` 사용 */
export const getEconomyPrograms = getCompanySchoolPrograms

/** @deprecated `getCompanySchoolProgramById` 사용 */
export const getEconomyProgramById = getCompanySchoolProgramById
