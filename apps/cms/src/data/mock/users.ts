/**
 * 사용자 계정 Mock 데이터
 * Phase 0.1.1: 역할/권한 체계 재정의
 * requirements.md §2 역할 및 권한 기준
 */

import type { User } from '../../types/user'

function generateUUID(): string {
  return `user-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

function generatePastDate(daysAgo: number = 30): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

// ============================================
// 관리자 (Admin) 계정 - 3개
// ============================================

const mockAdmins: User[] = [
  {
    id: generateUUID(),
    email: 'admin1@jakorea.org',
    password: 'admin123!', // Mock 데이터용
    name: '김관리',
    role: 'ADMIN',
    adminLevel: 'MASTER',
    programRoles: { 'program-1': 'OWNER' },
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(365),
    updatedAt: generatePastDate(1),
  },
  {
    id: generateUUID(),
    email: 'admin2@jakorea.org',
    password: 'admin123!',
    name: '이운영',
    role: 'ADMIN',
    adminLevel: 'ADMIN',
    programRoles: { 'program-1': 'PARTNER' },
    isActive: true,
    lastLoginAt: generatePastDate(3),
    createdAt: generatePastDate(300),
    updatedAt: generatePastDate(3),
  },
  {
    id: generateUUID(),
    email: 'admin3@jakorea.org',
    password: 'admin123!',
    name: '박시스템',
    role: 'ADMIN',
    adminLevel: 'GENERAL',
    programRoles: { 'program-1': 'ASSISTANT' },
    isActive: true,
    lastLoginAt: generatePastDate(7),
    createdAt: generatePastDate(200),
    updatedAt: generatePastDate(7),
  },
]

// ============================================
// 강사 (Instructor) 계정 - 3개
// ============================================

// instructor1@example.com용 고정 instructorId
const INSTRUCTOR1_ID = 'instructor-1-fixed-id-for-testing'

const mockInstructors: User[] = [
  {
    id: generateUUID(),
    email: 'instructor1@example.com',
    password: 'instructor123!',
    name: '최강사',
    role: 'INSTRUCTOR',
    instructorId: INSTRUCTOR1_ID, // 고정 ID로 변경
    interviewStatus: 'APPROVED', // 승인 완료
    participationHistory: 5, // 참여이력 5건
    isActive: true,
    lastLoginAt: generatePastDate(2),
    createdAt: generatePastDate(180),
    updatedAt: generatePastDate(2),
    phone: '010-1234-5678',
    // address 필드는 schoolInfo.address로 이동 (Phase 0.1.1)
    detailAddress: 'JA빌딩 10층',
    zipCode: '06611',
    bio: '안녕하세요, 경제교육 전문 강사 최강사입니다.',
    instructorInfo: {
      bankName: '국민은행',
      accountHolder: '최강사',
      accountNumber: '123-456-789012',
      isBusinessIncome: false,
    },
  },
  {
    id: generateUUID(),
    email: 'instructor2@example.com',
    password: 'instructor123!',
    name: '정멘토',
    role: 'INSTRUCTOR',
    instructorId: generateUUID(),
    interviewStatus: 'APPROVED',
    participationHistory: 3,
    isActive: true,
    lastLoginAt: generatePastDate(5),
    createdAt: generatePastDate(120),
    updatedAt: generatePastDate(5),
  },
  {
    id: generateUUID(),
    email: 'instructor3@example.com',
    password: 'instructor123!',
    name: '강선생',
    role: 'INSTRUCTOR',
    instructorId: generateUUID(),
    interviewStatus: 'PENDING', // 면접 대기 중
    participationHistory: 0, // 참여이력 없음
    isActive: true,
    lastLoginAt: generatePastDate(10),
    createdAt: generatePastDate(30),
    updatedAt: generatePastDate(10),
  },
]

// ============================================
// 학교 (School) 계정 - 3개
// ============================================

const mockSchools: User[] = [
  {
    id: generateUUID(),
    email: 'school1@example.com',
    password: 'school123!',
    name: '서울초등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '서울초등학교',
      address: '서울특별시 마포구 월드컵북로 456',
      position: '교사',
    },
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(240),
    updatedAt: generatePastDate(1),
    phone: '02-1234-5678',
  },
  {
    id: generateUUID(),
    email: 'school2@example.com',
    password: 'school123!',
    name: '부산중학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '부산중학교',
      address: '부산광역시 해운대구 센텀중앙로 123',
      position: '담당교사',
    },
    isActive: true,
    lastLoginAt: generatePastDate(4),
    createdAt: generatePastDate(150),
    updatedAt: generatePastDate(4),
    phone: '051-2345-6789',
  },
  {
    id: generateUUID(),
    email: 'school3@example.com',
    password: 'school123!',
    name: '대구고등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '대구고등학교',
      address: '대구광역시 수성구 범어천로 789',
      position: '교감',
    },
    isActive: true,
    lastLoginAt: generatePastDate(3),
    createdAt: generatePastDate(45),
    updatedAt: generatePastDate(3),
    phone: '053-3456-7890',
  },
]

// ============================================
// 개인(참여자) (Individual) 계정 - 3개
// ============================================

const mockIndividuals: User[] = [
  {
    id: generateUUID(),
    email: 'individual1@example.com',
    password: 'individual123!',
    name: '장학생',
    role: 'INDIVIDUAL',
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(60),
    updatedAt: generatePastDate(1),
    phone: '010-1111-2222',
  },
  {
    id: generateUUID(),
    email: 'individual2@example.com',
    password: 'individual123!',
    name: '임참여',
    role: 'INDIVIDUAL',
    isActive: true,
    lastLoginAt: generatePastDate(3),
    createdAt: generatePastDate(45),
    updatedAt: generatePastDate(3),
    phone: '010-2222-3333',
  },
  {
    id: generateUUID(),
    email: 'individual3@example.com',
    password: 'individual123!',
    name: '한청년',
    role: 'INDIVIDUAL',
    isActive: true,
    lastLoginAt: generatePastDate(7),
    createdAt: generatePastDate(30),
    updatedAt: generatePastDate(7),
    phone: '010-3333-4444',
  },
]

// ============================================
// 추가 전체 회원 샘플 (필터/검색 테스트용)
// ============================================

const extraMockUsers: User[] = [
  // 비활성 관리자
  {
    id: generateUUID(),
    email: 'admin.inactive@jakorea.org',
    password: 'admin123!',
    name: '비활성관리자',
    role: 'ADMIN',
    adminLevel: 'GENERAL',
    programRoles: { 'program-1': 'ASSISTANT' },
    isActive: false,
    lastLoginAt: generatePastDate(120),
    createdAt: generatePastDate(400),
    updatedAt: generatePastDate(120),
  },
  // 최근 가입한 강사 (면접 예정)
  {
    id: generateUUID(),
    email: 'instructor.new@jakorea.org',
    password: 'instructor123!',
    name: '신규강사',
    role: 'INSTRUCTOR',
    instructorId: generateUUID(),
    interviewStatus: 'SCHEDULED',
    interviewScheduledAt: generatePastDate(0),
    participationHistory: 0,
    isActive: true,
    lastLoginAt: undefined,
    createdAt: generatePastDate(5),
    updatedAt: generatePastDate(1),
  },
  // 참여이력 많은 강사
  {
    id: generateUUID(),
    email: 'instructor.senior@jakorea.org',
    password: 'instructor123!',
    name: '시니어강사',
    role: 'INSTRUCTOR',
    instructorId: generateUUID(),
    interviewStatus: 'NOT_REQUIRED',
    participationHistory: 25,
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(730),
    updatedAt: generatePastDate(1),
  },
  // 추가 개인(참여자) 계정
  {
    id: generateUUID(),
    email: 'individual.active@jakorea.org',
    password: 'individual123!',
    name: '활동참여자',
    role: 'INDIVIDUAL',
    isActive: true,
    lastLoginAt: generatePastDate(0),
    createdAt: generatePastDate(15),
    updatedAt: generatePastDate(0),
    phone: '010-4444-5555',
  },
  // 오래된 개인(참여자) (비활성)
  {
    id: generateUUID(),
    email: 'individual.inactive@jakorea.org',
    password: 'individual123!',
    name: '휴면참여자',
    role: 'INDIVIDUAL',
    isActive: false,
    lastLoginAt: generatePastDate(730),
    createdAt: generatePastDate(800),
    updatedAt: generatePastDate(730),
    phone: '010-5555-6666',
  },
]

// ============================================
// 전체 사용자 목록
// ============================================

export const mockUsers: User[] = [
  ...mockAdmins,
  ...mockInstructors,
  ...mockSchools,
  ...mockIndividuals,
  ...extraMockUsers,
]

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 이메일로 사용자 찾기
 */
export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find(user => user.email === email)
}

/**
 * 권한별 사용자 목록 조회
 */
export function getUsersByRole(role: User['role']): User[] {
  return mockUsers.filter(user => user.role === role)
}

/**
 * 로그인 검증
 */
export function validateLogin(email: string, password: string): User | null {
  const user = getUserByEmail(email)
  if (!user || user.password !== password || !user.isActive) {
    return null
  }
  return user
}

/**
 * 전화번호로 사용자 찾기
 * Phase 0.1.3: 휴대폰 본인인증 로그인
 */
export function getUserByPhone(phone: string): User | undefined {
  // 하이픈 제거하여 비교
  const normalizedPhone = phone.replace(/-/g, '')
  return mockUsers.find(user => {
    if (!user.phone) return false
    const normalizedUserPhone = user.phone.replace(/-/g, '')
    return normalizedUserPhone === normalizedPhone && user.isActive
  })
}
