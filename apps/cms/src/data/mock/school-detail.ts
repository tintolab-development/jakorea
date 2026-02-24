/**
 * 학교(교사) 상세 모달용 Mock 데이터
 * - 학교별 소속 교사 회원, 프로그램 참여 이력
 * - Application의 subjectId는 domain School id이므로, 학교명으로 매핑
 */

import { mockUsers } from './users'
import { mockApplications } from './applications'
import { mockProgramsMap } from './programs'
import { mockSchools } from './schools'
import type { Application } from '@/types/domain'

export interface SchoolDetailStats {
  applicationCount: number
  participationCount: number
}

export interface AffiliatedTeacherRow {
  id: string
  name: string
  gradeInCharge: string
  phone: string
  email: string
  createdAt: string
}

export interface TeacherResumeEducation {
  schoolType?: string
  status?: string
  schoolName?: string
  major?: string
  enrollmentYear?: string
  graduationYear?: string
}

export interface TeacherResumeCareer {
  companyName?: string
  role?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}

export interface TeacherResumeQualification {
  name?: string
  year?: string
}

export interface TeacherResumeAward {
  name?: string
  year?: string
}

export interface TeacherDetailData {
  id: string
  name: string
  nameEn: string
  residentNumber: string
  age: number
  gender: string
  militaryStatus: string
  phone: string
  email: string
  address: string
  schoolName: string
  gradeInCharge: string
  bankName: string
  accountNumber: string
  accountHolder: string
  socialAccounts: string[]
  createdAt: string
  personalInfoConsentDate: string
  personalInfoConsent: boolean
  marketingConsentDate: string
  marketingConsent: boolean
  education: string
  university: string
  instructorExperience: string
  bio: string
  scheduleChangeCount: number
  profileImage?: string
  /** 강사 신청 여부 — true면 강사 이력서/프로그램 강의 이력/정산 현황 탭 노출 */
  isInstructorApplicant: boolean
  educations?: TeacherResumeEducation[]
  careerDetails?: TeacherResumeCareer[]
  qualifications?: TeacherResumeQualification[]
  awards?: TeacherResumeAward[]
  freeWriting1?: string
  freeWriting2?: string
  freeWriting3?: string
  freeWriting4?: string
  /** 프로그램 강의 이력 (강사 신청 교사만) */
  teachingHistory?: TeachingHistoryRow[]
  /** 정산 현황 (강사 신청 교사만) */
  settlementOverview?: SettlementOverviewData
}

export type TeachingProgramStatus =
  | 'WAITING_RESULT'
  | 'REJECTED'
  | 'EDUCATION_SCHEDULED'
  | 'EDUCATION_IN_PROGRESS'
  | 'PROGRAM_ENDED'

export type TeachingSettlementStatus = 'na' | 'pending' | 'partial' | 'completed'

export interface TeachingHistoryRow {
  id: string
  no: number
  programName: string
  programStatus: TeachingProgramStatus
  settlementStatus: TeachingSettlementStatus
  managerName: string
}

export const TEACHING_PROGRAM_STATUS_LABELS: Record<TeachingProgramStatus, string> = {
  WAITING_RESULT: '신청 결과 대기 중',
  REJECTED: '신청 반려',
  EDUCATION_SCHEDULED: '교육 진행 예정',
  EDUCATION_IN_PROGRESS: '교육 진행 중',
  PROGRAM_ENDED: '프로그램 종료',
}

export type SettlementRowStatus = 'pending' | 'reviewing' | 'completed'

export const SETTLEMENT_ROW_STATUS_LABELS: Record<SettlementRowStatus, string> = {
  pending: '정산 대기',
  reviewing: '내역 검토 중',
  completed: '정산 완료',
}

export interface SettlementRow {
  id: string
  no: number
  programName: string
  lectureDate: string
  lectureDuration: string
  status: SettlementRowStatus
  amount: number
}

export interface SettlementOverviewData {
  month: string
  expectedAmount: number
  completedAmount: number
  totalAmount: number
  rows: SettlementRow[]
}

export const TEACHING_SETTLEMENT_STATUS_LABELS: Record<TeachingSettlementStatus, string> = {
  na: '해당 없음',
  pending: '정산 대기',
  partial: '일부 정산 완료',
  completed: '정산 완료',
}

export interface ProgramParticipationRow {
  id: string
  programName: string
  educationField: string
  gradeTaught: string
  programPeriod: string
  teacherInCharge: string
}

// ============================================
// 학교별 소속 교사 Mock 데이터 (학교 User ID → 교사 목록)
// ============================================

const TEACHER_POOL = [
  { name: '김민정', phone: '010-1234-5678', email: 'mjkim@naver.com' },
  { name: '박서윤', phone: '010-2345-6789', email: 'sypark@gmail.com' },
  { name: '최진호', phone: '010-3456-7890', email: 'jhchoi@naver.com' },
  { name: '이하늘', phone: '010-4567-8901', email: 'hnlee@gmail.com' },
  { name: '장유진', phone: '010-5678-9012', email: 'yjjang@naver.com' },
  { name: '홍길동', phone: '010-6789-0123', email: 'gdhong@gmail.com' },
  { name: '정다은', phone: '010-7890-1234', email: 'dejeong@naver.com' },
  { name: '강수빈', phone: '010-8901-2345', email: 'sbkang@gmail.com' },
  { name: '윤태호', phone: '010-9012-3456', email: 'thyoon@naver.com' },
  { name: '임소현', phone: '010-0123-4567', email: 'shlim@gmail.com' },
  { name: '한준혁', phone: '010-1357-2468', email: 'jhhahn@naver.com' },
  { name: '오세라', phone: '010-2468-1357', email: 'sroh@gmail.com' },
]

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

const CREATED_DATES = [
  '2024-03-15T00:00:00.000Z',
  '2024-06-20T00:00:00.000Z',
  '2024-09-01T00:00:00.000Z',
  '2025-01-10T00:00:00.000Z',
  '2025-03-02T00:00:00.000Z',
  '2025-05-15T00:00:00.000Z',
  '2025-07-01T00:00:00.000Z',
  '2025-08-20T00:00:00.000Z',
  '2025-09-15T00:00:00.000Z',
  '2025-10-01T00:00:00.000Z',
  '2025-11-11T00:00:00.000Z',
  '2026-01-05T00:00:00.000Z',
]

const schoolTeachersCache = new Map<string, AffiliatedTeacherRow[]>()

function generateSchoolTeachers(schoolUserId: string): AffiliatedTeacherRow[] {
  if (schoolTeachersCache.has(schoolUserId)) {
    return schoolTeachersCache.get(schoolUserId)!
  }

  const schoolUser = mockUsers.find(u => u.id === schoolUserId && u.role === 'SCHOOL')
  if (!schoolUser) return []

  const seed = schoolUser.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const count = 3 + (seed % 6) // 3~8명

  const teachers: AffiliatedTeacherRow[] = []
  for (let i = 0; i < count; i++) {
    const t = TEACHER_POOL[(seed + i) % TEACHER_POOL.length]
    const grade = GRADES[(seed + i * 3) % GRADES.length]
    const dateIdx = (seed + i * 2) % CREATED_DATES.length
    teachers.push({
      id: `teacher-${schoolUserId}-${i}`,
      name: t.name,
      gradeInCharge: grade,
      phone: t.phone,
      email: t.email,
      createdAt: CREATED_DATES[dateIdx],
    })
  }

  schoolTeachersCache.set(schoolUserId, teachers)
  return teachers
}

// ============================================
// 학교명으로 domain School id 매핑
// ============================================

function getSchoolIdBySchoolUser(schoolUserId: string): string | null {
  const user = mockUsers.find(u => u.id === schoolUserId && u.role === 'SCHOOL')
  if (!user) return null
  const name = user.schoolInfo?.schoolName ?? user.name
  const school = mockSchools.find(
    s => s.name === name || s.name.includes(name) || name.includes(s.name)
  )
  return school?.id ?? null
}

// ============================================
// Public API
// ============================================

export function getSchoolDetailStats(schoolUserId: string): SchoolDetailStats {
  const schoolId = getSchoolIdBySchoolUser(schoolUserId)
  const schoolApps =
    schoolId != null
      ? mockApplications.filter(
          (app: Application) => app.subjectType === 'school' && app.subjectId === schoolId
        )
      : []
  const applicationCount = schoolApps.length
  const participationCount = schoolApps.filter(app => app.status === 'approved').length
  return { applicationCount, participationCount }
}

export function getAffiliatedTeachers(schoolUserId: string): AffiliatedTeacherRow[] {
  return generateSchoolTeachers(schoolUserId)
}

const TEACHER_DETAIL_POOL: Omit<TeacherDetailData, 'id' | 'gradeInCharge' | 'schoolName' | 'createdAt'>[] = [
  {
    name: '김민정', nameEn: 'Kim Minjeong', residentNumber: '880312-2******', age: 38,
    gender: '여성', militaryStatus: '해당 없음', phone: '010-1234-5678', email: 'mjkim@naver.com',
    address: '서울특별시 강서구 화곡동', bankName: '국민', accountNumber: '110-321-567890',
    accountHolder: '김민정', socialAccounts: ['카카오', '구글'], personalInfoConsentDate: '2024.03.15',
    personalInfoConsent: true, marketingConsentDate: '2024.03.15', marketingConsent: true,
    education: '4년제 졸업', university: '서울교육대학교', instructorExperience: '5년',
    bio: '수학과 과학을 재미있게 가르치는 것을 좋아하며, 아이들의 눈높이에 맞춘 수업을 지향합니다.',
    scheduleChangeCount: 0, isInstructorApplicant: true,
  },
  {
    name: '박서윤', nameEn: 'Park Seoyun', residentNumber: '920715-2******', age: 33,
    gender: '여성', militaryStatus: '해당 없음', phone: '010-2345-6789', email: 'sypark@gmail.com',
    address: '서울특별시 마포구 상암동', bankName: '신한', accountNumber: '110-456-789012',
    accountHolder: '박서윤', socialAccounts: ['카카오'], personalInfoConsentDate: '2024.06.20',
    personalInfoConsent: true, marketingConsentDate: '2024.06.20', marketingConsent: false,
    education: '석사 졸업', university: '이화여자대학교', instructorExperience: '7년',
    bio: '창의적 사고를 길러주는 프로젝트 기반 수업을 진행하고 있습니다.',
    scheduleChangeCount: 2, isInstructorApplicant: true,
  },
  {
    name: '최진호', nameEn: 'Choi Jinho', residentNumber: '850420-1******', age: 41,
    gender: '남성', militaryStatus: '군필', phone: '010-3456-7890', email: 'jhchoi@naver.com',
    address: '경기도 성남시 분당구', bankName: '우리', accountNumber: '1002-345-678901',
    accountHolder: '최진호', socialAccounts: ['구글'], personalInfoConsentDate: '2024.09.01',
    personalInfoConsent: true, marketingConsentDate: '2024.09.01', marketingConsent: true,
    education: '4년제 졸업', university: '한국교원대학교', instructorExperience: '10년',
    bio: '경제교육 전문 강사로 다양한 기업가정신 프로그램을 운영해왔습니다.',
    scheduleChangeCount: 1, isInstructorApplicant: true,
  },
  {
    name: '이하늘', nameEn: 'Lee Haneul', residentNumber: '950108-1******', age: 31,
    gender: '남성', militaryStatus: '군필', phone: '010-4567-8901', email: 'hnlee@gmail.com',
    address: '서울특별시 송파구 잠실동', bankName: '하나', accountNumber: '186-910-234567',
    accountHolder: '이하늘', socialAccounts: ['카카오', '구글'], personalInfoConsentDate: '2025.01.10',
    personalInfoConsent: true, marketingConsentDate: '2025.01.10', marketingConsent: true,
    education: '4년제 졸업', university: '고려대학교', instructorExperience: '3년',
    bio: '담당 교사분은 물론, 아이들과도 적극적인 소통으로 재미있고 활기차게 강의를 이끌어가는 스타일입니다^^',
    scheduleChangeCount: 1, isInstructorApplicant: false,
  },
  {
    name: '장유진', nameEn: 'Jang Yujin', residentNumber: '900622-2******', age: 35,
    gender: '여성', militaryStatus: '해당 없음', phone: '010-5678-9012', email: 'yjjang@naver.com',
    address: '인천광역시 남동구 구월동', bankName: '농협', accountNumber: '302-0123-4567-81',
    accountHolder: '장유진', socialAccounts: ['카카오'], personalInfoConsentDate: '2025.03.02',
    personalInfoConsent: true, marketingConsentDate: '2025.03.02', marketingConsent: true,
    education: '석사 졸업', university: '성균관대학교', instructorExperience: '8년',
    bio: '아이들이 스스로 생각하고 질문할 수 있는 환경을 만들어주는 것이 목표입니다.',
    scheduleChangeCount: 0, isInstructorApplicant: true,
  },
  {
    name: '홍길동', nameEn: 'Hong Gildong', residentNumber: '870930-1******', age: 38,
    gender: '남성', militaryStatus: '군필', phone: '010-6789-0123', email: 'gdhong@gmail.com',
    address: '서울특별시 종로구 혜화동', bankName: '국민', accountNumber: '110-789-012345',
    accountHolder: '홍길동', socialAccounts: ['구글'], personalInfoConsentDate: '2025.05.15',
    personalInfoConsent: true, marketingConsentDate: '2025.05.15', marketingConsent: false,
    education: '4년제 졸업', university: '연세대학교', instructorExperience: '6년',
    bio: '코딩교육과 경제교육을 접목한 융합수업을 설계하고 있습니다.',
    scheduleChangeCount: 3, isInstructorApplicant: true,
  },
  {
    name: '정다은', nameEn: 'Jeong Daeun', residentNumber: '930214-2******', age: 33,
    gender: '여성', militaryStatus: '해당 없음', phone: '010-7890-1234', email: 'dejeong@naver.com',
    address: '경기도 고양시 일산서구', bankName: '신한', accountNumber: '110-234-567890',
    accountHolder: '정다은', socialAccounts: ['카카오', '구글'], personalInfoConsentDate: '2025.07.01',
    personalInfoConsent: true, marketingConsentDate: '2025.07.01', marketingConsent: true,
    education: '4년제 졸업', university: '춘천교육대학교', instructorExperience: '4년',
    bio: '놀이와 체험 중심의 경제교육으로 아이들의 호기심을 자극합니다.',
    scheduleChangeCount: 0, isInstructorApplicant: false,
  },
  {
    name: '강수빈', nameEn: 'Kang Subin', residentNumber: '960818-2******', age: 29,
    gender: '여성', militaryStatus: '해당 없음', phone: '010-8901-2345', email: 'sbkang@gmail.com',
    address: '서울특별시 관악구 봉천동', bankName: '우리', accountNumber: '1002-567-890123',
    accountHolder: '강수빈', socialAccounts: ['카카오'], personalInfoConsentDate: '2025.08.20',
    personalInfoConsent: true, marketingConsentDate: '2025.08.20', marketingConsent: true,
    education: '석사 재학', university: '서울대학교', instructorExperience: '2년',
    bio: '최신 교육 트렌드를 반영한 수업 설계를 추구합니다.',
    scheduleChangeCount: 0, isInstructorApplicant: false,
  },
  {
    name: '윤태호', nameEn: 'Yoon Taeho', residentNumber: '880505-1******', age: 37,
    gender: '남성', militaryStatus: '군필', phone: '010-9012-3456', email: 'thyoon@naver.com',
    address: '대전광역시 유성구 봉명동', bankName: '하나', accountNumber: '186-345-678901',
    accountHolder: '윤태호', socialAccounts: ['구글'], personalInfoConsentDate: '2025.09.15',
    personalInfoConsent: true, marketingConsentDate: '2025.09.15', marketingConsent: true,
    education: '4년제 졸업', university: '충남대학교', instructorExperience: '9년',
    bio: '기업가정신 교육 전문가로서 학생들의 미래 설계를 돕고 있습니다.',
    scheduleChangeCount: 1, isInstructorApplicant: true,
  },
  {
    name: '임소현', nameEn: 'Lim Sohyun', residentNumber: '940325-2******', age: 31,
    gender: '여성', militaryStatus: '해당 없음', phone: '010-0123-4567', email: 'shlim@gmail.com',
    address: '부산광역시 해운대구', bankName: '농협', accountNumber: '302-4567-8901-23',
    accountHolder: '임소현', socialAccounts: ['카카오', '구글'], personalInfoConsentDate: '2025.10.01',
    personalInfoConsent: true, marketingConsentDate: '2025.10.01', marketingConsent: false,
    education: '4년제 졸업', university: '부산교육대학교', instructorExperience: '5년',
    bio: '따뜻한 소통과 체계적인 수업으로 아이들의 성장을 지원합니다.',
    scheduleChangeCount: 2, isInstructorApplicant: false,
  },
  {
    name: '한준혁', nameEn: 'Han Junhyeok', residentNumber: '910711-1******', age: 34,
    gender: '남성', militaryStatus: '군필', phone: '010-1357-2468', email: 'jhhahn@naver.com',
    address: '경기도 수원시 영통구', bankName: '국민', accountNumber: '110-567-890123',
    accountHolder: '한준혁', socialAccounts: ['카카오'], personalInfoConsentDate: '2025.11.11',
    personalInfoConsent: true, marketingConsentDate: '2025.11.11', marketingConsent: true,
    education: '석사 졸업', university: '경인교육대학교', instructorExperience: '6년',
    bio: '실생활 사례를 활용한 경제 교육으로 학생들의 이해도를 높입니다.',
    scheduleChangeCount: 0, isInstructorApplicant: true,
  },
  {
    name: '오세라', nameEn: 'Oh Sera', residentNumber: '970129-2******', age: 28,
    gender: '여성', militaryStatus: '해당 없음', phone: '010-2468-1357', email: 'sroh@gmail.com',
    address: '서울특별시 강남구 역삼동', bankName: '신한', accountNumber: '110-678-901234',
    accountHolder: '오세라', socialAccounts: ['구글'], personalInfoConsentDate: '2026.01.05',
    personalInfoConsent: true, marketingConsentDate: '2026.01.05', marketingConsent: true,
    education: '4년제 졸업', university: '한양대학교', instructorExperience: '1년',
    bio: '밝은 에너지로 교실 분위기를 이끌며, 참여형 수업을 진행합니다.',
    scheduleChangeCount: 0, isInstructorApplicant: false,
  },
]

const RESUME_EDUCATIONS: TeacherResumeEducation[][] = [
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '서울교육대학교', major: '초등교육학과', enrollmentYear: '2004.03', graduationYear: '2008.02' }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '이화여자대학교', major: '교육학과', enrollmentYear: '2009.03', graduationYear: '2013.02' }, { schoolType: '대학원', status: '졸업', schoolName: '이화여자대학교 대학원', major: '교육공학', enrollmentYear: '2013.03', graduationYear: '2015.02' }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '한국교원대학교', major: '경제교육학과', enrollmentYear: '2001.03', graduationYear: '2005.02' }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '고려대학교', major: '경영학과', enrollmentYear: '2013.03', graduationYear: '2017.02' }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '성균관대학교', major: '교육학과', enrollmentYear: '2007.03', graduationYear: '2011.02' }, { schoolType: '대학원', status: '졸업', schoolName: '성균관대학교 대학원', major: '경제교육', enrollmentYear: '2011.03', graduationYear: '2013.02' }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '연세대학교', major: '사회학과', enrollmentYear: '2005.03', graduationYear: '2009.02' }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '춘천교육대학교', major: '초등교육학과', enrollmentYear: '2011.03', graduationYear: '2015.02' }],
  [{ schoolType: '대학 4년제', status: '재학', schoolName: '서울대학교', major: '교육공학', enrollmentYear: '2020.09', graduationYear: undefined }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '충남대학교', major: '경제학과', enrollmentYear: '2004.03', graduationYear: '2008.02' }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '부산교육대학교', major: '초등교육학과', enrollmentYear: '2010.03', graduationYear: '2014.02' }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '경인교육대학교', major: '교육학과', enrollmentYear: '2008.03', graduationYear: '2012.02' }, { schoolType: '대학원', status: '졸업', schoolName: '경인교육대학교 대학원', major: '경제교육', enrollmentYear: '2012.03', graduationYear: '2014.02' }],
  [{ schoolType: '대학 4년제', status: '졸업', schoolName: '한양대학교', major: '경영학과', enrollmentYear: '2015.03', graduationYear: '2019.02' }],
]

const RESUME_CAREERS: TeacherResumeCareer[][] = [
  [{ companyName: 'JA Korea', role: '경제교육 강사', startDate: '2019.03', isCurrent: true }],
  [{ companyName: '서울시교육청', role: '방과후 강사', startDate: '2017.03', endDate: '2020.02' }, { companyName: 'JA Korea', role: '기업가정신 강사', startDate: '2020.03', isCurrent: true }],
  [{ companyName: 'JA Korea', role: '경제교육 수석 강사', startDate: '2015.03', isCurrent: true }],
  [{ companyName: '삼성전자', role: '마케팅', startDate: '2017.06', endDate: '2020.05' }, { companyName: 'JA Korea', role: '기업가정신 강사', startDate: '2023.03', isCurrent: true }],
  [{ companyName: '인천교육연구원', role: '연구원', startDate: '2013.06', endDate: '2017.02' }, { companyName: 'JA Korea', role: '경제교육 강사', startDate: '2017.03', isCurrent: true }],
  [{ companyName: '코드잇', role: '개발 교육 강사', startDate: '2012.03', endDate: '2018.05' }, { companyName: 'JA Korea', role: '융합교육 강사', startDate: '2019.01', isCurrent: true }],
  [{ companyName: 'JA Korea', role: '초등 경제교육 강사', startDate: '2021.03', isCurrent: true }],
  [{ companyName: '서울대학교', role: '연구조교', startDate: '2023.09', isCurrent: true }],
  [{ companyName: '대전교육청', role: '진로교육 강사', startDate: '2010.03', endDate: '2016.02' }, { companyName: 'JA Korea', role: '기업가정신 수석 강사', startDate: '2016.09', isCurrent: true }],
  [{ companyName: 'JA Korea', role: '경제교육 강사', startDate: '2020.06', isCurrent: true }],
  [{ companyName: '경기도교육청', role: '방과후 경제교육', startDate: '2015.03', endDate: '2019.02' }, { companyName: 'JA Korea', role: '기업가정신 강사', startDate: '2019.06', isCurrent: true }],
  [{ companyName: 'JA Korea', role: '경제교육 강사', startDate: '2025.03', isCurrent: true }],
]

const RESUME_QUALIFICATIONS: TeacherResumeQualification[][] = [
  [{ name: '중등교원자격증 (2급)', year: '2008' }, { name: '재무설계사(AFPK)', year: '2015' }],
  [{ name: '교육공학사', year: '2015' }],
  [{ name: '중등교원자격증 (1급)', year: '2010' }, { name: '경제교육 전문강사', year: '2016' }],
  [{ name: 'TESAT (경제이해력검증시험)', year: '2019' }],
  [{ name: '중등교원자격증 (2급)', year: '2011' }, { name: '교육상담사 2급', year: '2016' }],
  [{ name: '정보처리기사', year: '2010' }, { name: '코딩교육지도사', year: '2018' }],
  [{ name: '초등교원자격증 (2급)', year: '2015' }],
  [],
  [{ name: '중등교원자격증 (2급)', year: '2008' }, { name: '진로상담사 1급', year: '2014' }],
  [{ name: '초등교원자격증 (2급)', year: '2014' }],
  [{ name: '교육학석사', year: '2014' }, { name: '경제교육 전문강사', year: '2019' }],
  [{ name: 'TESAT (경제이해력검증시험)', year: '2020' }],
]

const RESUME_AWARDS: TeacherResumeAward[][] = [
  [{ name: '우수 경제교육 강사상 (JA Korea)', year: '2022' }],
  [{ name: '교육혁신 논문 우수상', year: '2019' }],
  [{ name: '대한민국 경제교육 공로상', year: '2021' }, { name: 'JA Korea 최우수 강사', year: '2024' }],
  [],
  [{ name: '인천시교육청 우수교원상', year: '2020' }],
  [{ name: '코딩교육 우수 강사상', year: '2017' }],
  [],
  [],
  [{ name: 'JA Korea 10년 공로상', year: '2025' }],
  [{ name: '부산시교육청 우수교원상', year: '2023' }],
  [{ name: '교육학회 우수논문상', year: '2018' }],
  [],
]

const FREE_WRITINGS = [
  { w1: '교육을 통해 아이들의 삶에 긍정적인 변화를 만들고 싶어 JA Korea에 지원하게 되었습니다. 경제교육은 아이들이 미래를 주체적으로 설계할 수 있는 기반이라고 생각합니다.', w2: '청소년기는 경제적 가치관이 형성되는 중요한 시기입니다. 이 시기에 올바른 경제 개념을 심어주는 것이 성인기 건전한 경제 활동의 기초가 됩니다.', w3: '아이들의 이야기에 진심으로 귀 기울이는 것이 가장 중요하다고 생각합니다. 매 수업 시작 전 아이스브레이킹 시간을 통해 자연스럽게 대화의 물꼬를 트고 있습니다.', w4: '한 수업에서 학생들의 집중력이 크게 떨어졌을 때, 즉석 퀴즈 대회를 열어 경쟁심을 자극하고 참여도를 끌어올린 경험이 있습니다.' },
  { w1: '프로젝트 기반 학습(PBL)을 통해 학생들이 실제 문제를 해결하는 경험을 제공하고 싶습니다.', w2: '경제교육은 단순한 지식 전달이 아니라 삶의 기술을 가르치는 것입니다.', w3: '학생 개개인의 속도와 관심사를 존중하며, 차별 없는 소통 환경을 만들어갑니다.', w4: '참여가 저조한 수업에서 모둠별 미션 활동으로 전환하여 적극적 참여를 이끌어냈습니다.' },
  { w1: '10년간의 경제교육 경험을 바탕으로 JA Korea의 교육 철학에 깊이 공감하여 지원합니다.', w2: '경제적 의사결정 능력은 미래 사회의 핵심 역량이며, 이를 청소년기부터 체계적으로 길러줘야 합니다.', w3: '신뢰 구축이 가장 중요합니다. 약속을 반드시 지키고, 학생들의 의견을 수업에 적극 반영합니다.', w4: '수업 분위기가 침체되었을 때, 실생활 사례를 즉석으로 활용한 역할극을 진행하여 분위기를 전환한 적이 있습니다.' },
]

export function getTeacherDetail(
  teacherId: string,
  schoolUserId: string
): TeacherDetailData | null {
  const teachers = generateSchoolTeachers(schoolUserId)
  const teacher = teachers.find(t => t.id === teacherId)
  if (!teacher) return null

  const schoolUser = mockUsers.find(u => u.id === schoolUserId && u.role === 'SCHOOL')
  const schoolName = schoolUser?.schoolInfo?.schoolName ?? schoolUser?.name ?? '-'

  const poolIndex = TEACHER_POOL.findIndex(p => p.name === teacher.name)
  const idx = poolIndex >= 0 ? poolIndex : 0
  const detail = TEACHER_DETAIL_POOL[idx]
  const fw = FREE_WRITINGS[idx % FREE_WRITINGS.length]

  const teachingHistory: TeachingHistoryRow[] = detail.isInstructorApplicant
    ? generateTeachingHistory(idx)
    : []

  const settlementOverview: SettlementOverviewData | undefined = detail.isInstructorApplicant
    ? generateSettlementOverview(idx)
    : undefined

  return {
    ...detail,
    id: teacher.id,
    gradeInCharge: teacher.gradeInCharge,
    schoolName,
    createdAt: teacher.createdAt,
    educations: RESUME_EDUCATIONS[idx % RESUME_EDUCATIONS.length],
    careerDetails: RESUME_CAREERS[idx % RESUME_CAREERS.length],
    qualifications: RESUME_QUALIFICATIONS[idx % RESUME_QUALIFICATIONS.length],
    awards: RESUME_AWARDS[idx % RESUME_AWARDS.length],
    freeWriting1: fw.w1,
    freeWriting2: fw.w2,
    freeWriting3: fw.w3,
    freeWriting4: fw.w4,
    teachingHistory,
    settlementOverview,
  }
}

function generateTeachingHistory(seedIdx: number): TeachingHistoryRow[] {
  const PROGRAM_NAME = '2026 SAP-함께 성장하JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)'
  const MANAGER = '이순신 매니저'
  const statuses: TeachingProgramStatus[] = [
    'WAITING_RESULT', 'REJECTED', 'EDUCATION_SCHEDULED', 'EDUCATION_SCHEDULED',
    'EDUCATION_IN_PROGRESS', 'PROGRAM_ENDED', 'PROGRAM_ENDED', 'PROGRAM_ENDED', 'PROGRAM_ENDED',
  ]
  const settlements: TeachingSettlementStatus[] = [
    'na', 'na', 'pending', 'pending', 'partial', 'completed', 'completed', 'completed', 'completed',
  ]
  const count = 5 + (seedIdx % 5)
  return Array.from({ length: count }, (_, i) => ({
    id: `th-${seedIdx}-${i}`,
    no: count - i,
    programName: PROGRAM_NAME,
    programStatus: statuses[(seedIdx + i) % statuses.length],
    settlementStatus: settlements[(seedIdx + i) % settlements.length],
    managerName: MANAGER,
  }))
}

function generateSettlementOverview(seedIdx: number): SettlementOverviewData {
  const PROGRAM_NAME = '2026 SAP-함께 성장하JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)'
  const statuses: SettlementRowStatus[] = ['pending', 'pending', 'reviewing', 'reviewing', 'completed', 'completed', 'completed', 'completed', 'completed']
  const amounts = [52788, 91500, 91500, 52788, 91500, 91500, 91500, 91500, 91500]
  const sessions = ['3회차', '2회차', '1회차', '1회차', '1회차', '1회차', '1회차', '1회차', '1회차']

  const count = 7 + (seedIdx % 3)
  const rows: SettlementRow[] = Array.from({ length: count }, (_, i) => ({
    id: `sr-${seedIdx}-${i}`,
    no: count - i,
    programName: PROGRAM_NAME,
    lectureDate: `2026. 01. 15 (${sessions[i % sessions.length]})`,
    lectureDuration: '1시간',
    status: statuses[(seedIdx + i) % statuses.length],
    amount: amounts[(seedIdx + i) % amounts.length],
  }))

  const completedAmount = rows
    .filter(r => r.status === 'completed')
    .reduce((s, r) => s + r.amount, 0)
  const expectedAmount = rows
    .filter(r => r.status !== 'completed')
    .reduce((s, r) => s + r.amount, 0)

  return {
    month: '2026-01',
    expectedAmount,
    completedAmount,
    totalAmount: expectedAmount + completedAmount,
    rows,
  }
}

export function getSchoolProgramHistory(schoolUserId: string): ProgramParticipationRow[] {
  const schoolId = getSchoolIdBySchoolUser(schoolUserId)
  const schoolApps =
    schoolId != null
      ? mockApplications
          .filter(
            (app: Application) => app.subjectType === 'school' && app.subjectId === schoolId
          )
          .slice(0, 5)
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      : []

  const teachers = generateSchoolTeachers(schoolUserId)
  const getTeacherName = (i: number) => teachers[i % teachers.length]?.name ?? '홍길동'

  if (schoolApps.length === 0) {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `ph-${schoolUserId}-${i}`,
      programName: '2026년 JA Korea 초등 경제교육 대상학교 모집',
      educationField: '기업가정신',
      gradeTaught: GRADES[i % GRADES.length],
      programPeriod: '26.01.09(금)~26.01.30(금)',
      teacherInCharge: getTeacherName(i),
    }))
  }

  return schoolApps.map((app, i) => {
    const program = mockProgramsMap.get(app.programId)
    const title = program?.title ?? '2026년 JA Korea 초등 경제교육 대상학교 모집'
    const businessArea = program?.businessArea ?? '기업가정신'
    const start = app.submittedAt ? new Date(app.submittedAt) : new Date()
    const end = new Date(start)
    end.setDate(end.getDate() + 21)
    const fmt = (d: Date) =>
      `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const period = `${fmt(start)}(${days[start.getDay()]})~${fmt(end)}(${days[end.getDay()]})`
    return {
      id: app.id,
      programName: title,
      educationField: businessArea,
      gradeTaught: GRADES[i % GRADES.length],
      programPeriod: period,
      teacherInCharge: getTeacherName(i),
    }
  })
}
