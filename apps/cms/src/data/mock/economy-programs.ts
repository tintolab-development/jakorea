/**
 * 경제 교육 프로그램 Mock 데이터
 * 스크린샷 기준: /programs/economy-education 테이블 데이터
 * 전체 206건, 상위 8건은 스크린샷과 동일
 * 공통 정보 탭(기본 정보·KPI·임금·커리큘럼) 표시용 필드 보강
 */

import type {
  Program,
  ProgramRound,
  ProgramCategory,
  ProgramLifecycleStatus,
  TargetLevel,
  IPSClassification,
  InstitutionType,
} from '../../types/domain'
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

const now = new Date()
const getDate = (daysAgo: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
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
  staffVolunteers: 2,
  returningVolunteers: 0,
  generalTeachers: 1,
  educatedTeachers: 0,
  resultAnnouncementMethod: '홈페이지 공지 및 합격자 개별 안내',
}

const IPS_CYCLE: IPSClassification[] = ['Prepare', 'Succeed', 'Inspire']

const DISTRICT_SAMPLES = [
  '서울 강남구',
  '부산 해운대구',
  '대구 수성구',
  '인천 연수구',
  '경기 성남시',
  '충북 청주시',
  '전북 전주시',
  '제주 제주시',
]

/** 스크린샷 상위 8건 (No. 1~8) */
const SCREENSHOT_PROGRAMS: Omit<Program, 'id' | 'rounds' | 'createdAt' | 'updatedAt'>[] = [
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: 'HSBC/HKU Business Case Competition 2026 모집 안내',
    mainTitle: 'HSBC/HKU Business Case Competition 2026',
    titleEn: 'HSBC/HKU Business Case Competition 2026',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: 'HSBC/HKU Business Case Competition 2026',
    startDate: getDate(60),
    endDate: getDate(30),
    applicationStartDate: getDate(90),
    applicationEndDate: getDate(45),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
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
    resultAnnouncementDate: getDate(40),
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
    mainTitle: '2026 JA Korea 대학생경제교육봉사단',
    titleEn: 'JA Korea University JA Volunteer Program UJAT 36th',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: '대학생경제교육봉사단 UJAT 36기',
    startDate: getDate(45),
    endDate: getDate(15),
    applicationStartDate: getDate(90),
    applicationEndDate: getDate(30),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
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
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: 'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
    mainTitle: 'Growth to Professional 2026',
    titleEn: 'Growth to Professional 2026',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: 'Growth to Professional 2026',
    startDate: getDate(75),
    endDate: getDate(45),
    applicationStartDate: getDate(120),
    applicationEndDate: getDate(60),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
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
    resultAnnouncementDate: getDate(55),
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026년 JA Korea 초등 경제교육 모집 안내',
    mainTitle: '2026년 JA Korea 초등 경제교육',
    titleEn: 'JA Korea Elementary Economic Education 2026',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: '초등 경제교육 모집',
    startDate: getDate(90),
    endDate: getDate(60),
    applicationStartDate: getDate(150),
    applicationEndDate: getDate(75),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
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
    resultAnnouncementDate: getDate(70),
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026 SAP-함께 성장하JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)',
    mainTitle: 'SAP-함께 성장하JA! IT·SW 멘토링',
    titleEn: 'SAP-JA Korea IT & SW Mentoring 2026',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: 'SAP 함께 성장하JA IT SW 멘토링',
    startDate: getDate(100),
    endDate: getDate(70),
    applicationStartDate: getDate(130),
    applicationEndDate: getDate(85),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
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
    resultAnnouncementDate: getDate(80),
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집',
    mainTitle: 'Global Career Discovery 원데이 멘토링',
    titleEn: 'Global Career Discovery One-day Mentoring',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: 'Global Career Discovery 원데이 취업 멘토링',
    startDate: getDate(50),
    endDate: getDate(20),
    applicationStartDate: getDate(100),
    applicationEndDate: getDate(35),
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
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026년 JA Korea 경제금융교육 전문강사단 모집',
    mainTitle: '2026년 JA Korea 경제금융교육 전문강사단',
    titleEn: 'JA Korea Financial Literacy Instructor Corps 2026',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: '경제금융교육 전문강사단 모집',
    startDate: getDate(55),
    endDate: getDate(25),
    applicationStartDate: getDate(95),
    applicationEndDate: getDate(40),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
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
  },
  {
    ...ECONOMY_SHARED_COMMON,
    sponsorId: SPONSOR_ID,
    title: '2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집',
    mainTitle: '한국씨티은행-JA Korea 특별한 JOB담',
    titleEn: 'Citi-JA Korea Special JOB Talk 2026',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: '한국씨티은행 특별한 JOB담',
    startDate: getDate(120),
    endDate: getDate(90),
    applicationStartDate: getDate(180),
    applicationEndDate: getDate(100),
    status: 'completed',
    lifecycleStatus: 'education_completed' as ProgramLifecycleStatus,
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
  },
]

const TITLES = [
  'JA Korea 경제교육 프로그램',
  '기업가정신 함양 프로그램',
  '진로탐색 경제교육',
  '금융리터러시 교육',
  '창업 멘토링 프로그램',
  '취업 준비 워크숍',
  '경제교육 봉사단 모집',
  '초등 경제교육 지원',
  '중등 경제교육 지원',
  '고등 경제교육 지원',
]

function extraFieldsForGeneratedIndex(i: number): Partial<Program> {
  const category: ProgramCategory = i % 3 === 0 ? 'school' : 'individual'
  const ips = IPS_CYCLE[i % 3]
  const institutionType: InstitutionType = category === 'school' ? 'inside_school' : 'outside_school'
  const yearSuffix = 2026 - (i % 3)
  const baseTitle = TITLES[i % TITLES.length]

  return {
    ...ECONOMY_SHARED_COMMON,
    mainTitle: baseTitle,
    titleEn: `${baseTitle.replace(/\s+/g, ' ')} ${yearSuffix}`,
    institutionType,
    district: DISTRICT_SAMPLES[i % DISTRICT_SAMPLES.length],
    ips,
    programCategory: ips === 'Succeed' ? 'Workshop (워크숍)' : null,
    programChannel:
      ips === 'Inspire' ? '다운받을 자료 (Downloadable material)' : null,
    partnerInvolvement: ips === 'Prepare' ? (i % 4 === 0) : i % 2 === 0,
    courseDeliveredBy: i % 5 === 0 ? 'Jointly' : 'JA',
    textbookName: ips === 'Prepare' ? '성공하는 경제생활' : 'JA Economics for Success',
    textbookNameEn: ips === 'Prepare' ? 'JA Economics for Success' : 'JA Economics for Success',
    resultAnnouncementDate: getDate(100 - (i % 40)),
    instructorCapacity: 40,
  }
}

/** 경제 교육 프로그램 206건 (스크린샷 상위 8건 + 나머지 198건) */
let economyProgramsCache: Program[] | null = null

export function getEconomyPrograms(): Program[] {
  if (economyProgramsCache) return economyProgramsCache

  const programs: Program[] = []

  // 스크린샷 상위 8건
  SCREENSHOT_PROGRAMS.forEach((base, i) => {
    const id = `economy-prog-${String(i + 1).padStart(3, '0')}`
    const capacity = 30
    programs.push({
      ...base,
      id,
      rounds: createRounds(id, capacity),
      createdAt: getDate(90 - i),
      updatedAt: getDate(90 - i),
      posterImage: `https://picsum.photos/seed/${id}/400/300`,
      keyVisualImage: `https://picsum.photos/seed/${id}/400/300`,
    } as Program)
  })

  // 나머지 198건 (총 206건) - 위젯 건수: 예정 120, 진행 중 12, 완료 11 (120+12+11=143, 나머지 63은 planned 등)
  const scheduledStatuses: ProgramLifecycleStatus[] = [
    'recruiting_students',
    'recruiting_instructors',
    'matching_completed',
    'education_before_textbook',
  ]
  const inProgressStatus: ProgramLifecycleStatus = 'education_after_textbook'
  const completedStatus: ProgramLifecycleStatus = 'education_completed'
  const statusSequence: ProgramLifecycleStatus[] = [
    ...Array(116).fill(scheduledStatuses[0]),
    ...Array(9).fill(inProgressStatus),
    ...Array(10).fill(completedStatus),
    ...Array(63).fill('planned' as ProgramLifecycleStatus),
  ]

  for (let i = 8; i < 206; i++) {
    const id = `economy-prog-${String(i + 1).padStart(3, '0')}`
    const capacity = 30
    const lifecycleStatus = statusSequence[i - 8] ?? scheduledStatuses[0]
    const category: ProgramCategory = i % 3 === 0 ? 'school' : 'individual'
    const targetLevels: TargetLevel[] = ['elementary', 'middle', 'high']
    const targetLevel = targetLevels[i % 3]
    const approvedCount = i % 5 === 0 ? 0 : Math.min(30, Math.floor((i * 7) % 31))
    const extras = extraFieldsForGeneratedIndex(i)
    const inProgress = lifecycleStatus === 'education_after_textbook'

    programs.push({
      id,
      sponsorId: SPONSOR_ID,
      title: `${TITLES[i % TITLES.length]} ${2026 - (i % 3)}`,
      type: 'offline',
      format: 'workshop',
      category,
      description: '경제금융 분야 교육 프로그램',
      rounds: createRounds(id, capacity),
      startDate: getDate(120 - i),
      endDate: getDate(90 - i),
      applicationStartDate: getDate(150 - i),
      applicationEndDate: getDate(100 - i),
      status:
        lifecycleStatus === 'document_processing_completed'
          ? 'completed'
          : ['education_after_textbook', 'education_completed'].includes(lifecycleStatus)
            ? 'active'
            : 'pending',
      lifecycleStatus,
      businessArea: '경제금융',
      targetLevel,
      approvedStudentCount: approvedCount,
      instructors: inProgress ? Math.min(approvedCount || 15, 30) : undefined,
      createdAt: getDate(200 - i),
      updatedAt: getDate(200 - i),
      posterImage: `https://picsum.photos/seed/${id}/400/300`,
      keyVisualImage: `https://picsum.photos/seed/${id}/400/300`,
      ...extras,
    } as Program)
  }

  economyProgramsCache = programs
  return economyProgramsCache
}

/** 상세 모달·KPI 등에서 ID만으로 경제 프로그램을 찾을 때 사용 */
export function getEconomyProgramById(id: string): Program | undefined {
  return getEconomyPrograms().find(p => p.id === id)
}
