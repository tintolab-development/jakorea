/**
 * 사용자 계정 Mock 데이터
 * MVP_ROADMAP_V4 기반
 * 각 권한별 3개씩 총 12개 계정
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
// 봉사자 (Volunteer) 계정 - 3개
// ============================================

const mockVolunteers: User[] = [
  {
    id: generateUUID(),
    email: 'volunteer1@example.com',
    password: 'volunteer123!',
    name: '서봉사',
    role: 'VOLUNTEER',
    instructorId: generateUUID(),
    interviewStatus: 'APPROVED', // 승인 완료
    participationHistory: 10, // 참여이력 10건
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(240),
    updatedAt: generatePastDate(1),
  },
  {
    id: generateUUID(),
    email: 'volunteer2@example.com',
    password: 'volunteer123!',
    name: '윤지원',
    role: 'VOLUNTEER',
    instructorId: generateUUID(),
    interviewStatus: 'APPROVED',
    participationHistory: 7,
    isActive: true,
    lastLoginAt: generatePastDate(4),
    createdAt: generatePastDate(150),
    updatedAt: generatePastDate(4),
  },
  {
    id: generateUUID(),
    email: 'volunteer3@example.com',
    password: 'volunteer123!',
    name: '오자원',
    role: 'VOLUNTEER',
    instructorId: generateUUID(),
    interviewStatus: 'COMPLETED', // 면접 완료 (승인 대기)
    interviewCompletedAt: generatePastDate(5), // 면접 완료
    participationHistory: 0, // 참여이력 없음
    isActive: true,
    lastLoginAt: generatePastDate(3),
    createdAt: generatePastDate(45),
    updatedAt: generatePastDate(3),
  },
]

// ============================================
// 수강자 (Student) 계정 - 3개
// ============================================

const mockStudents: User[] = [
  {
    id: generateUUID(),
    email: 'student1@example.com',
    password: 'student123!',
    name: '장학생',
    role: 'STUDENT',
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(60),
    updatedAt: generatePastDate(1),
  },
  {
    id: generateUUID(),
    email: 'student2@example.com',
    password: 'student123!',
    name: '임참여',
    role: 'STUDENT',
    isActive: true,
    lastLoginAt: generatePastDate(3),
    createdAt: generatePastDate(45),
    updatedAt: generatePastDate(3),
  },
  {
    id: generateUUID(),
    email: 'student3@example.com',
    password: 'student123!',
    name: '한청년',
    role: 'STUDENT',
    isActive: true,
    lastLoginAt: generatePastDate(7),
    createdAt: generatePastDate(30),
    updatedAt: generatePastDate(7),
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
  // 비활성 봉사자
  {
    id: generateUUID(),
    email: 'volunteer.inactive@jakorea.org',
    password: 'volunteer123!',
    name: '휴면봉사자',
    role: 'VOLUNTEER',
    instructorId: generateUUID(),
    interviewStatus: 'REJECTED',
    participationHistory: 1,
    isActive: false,
    lastLoginAt: generatePastDate(365),
    createdAt: generatePastDate(365),
    updatedAt: generatePastDate(365),
  },
  // 추가 봉사자들 (랜덤 매칭 테스트용)
  {
    id: generateUUID(),
    email: 'volunteer4@example.com',
    password: 'volunteer123!',
    name: '김봉사',
    role: 'VOLUNTEER',
    instructorId: generateUUID(),
    interviewStatus: 'APPROVED',
    participationHistory: 5,
    isActive: true,
    lastLoginAt: generatePastDate(2),
    createdAt: generatePastDate(100),
    updatedAt: generatePastDate(2),
  },
  {
    id: generateUUID(),
    email: 'volunteer5@example.com',
    password: 'volunteer123!',
    name: '이지원',
    role: 'VOLUNTEER',
    instructorId: generateUUID(),
    interviewStatus: 'APPROVED',
    participationHistory: 3,
    isActive: true,
    lastLoginAt: generatePastDate(5),
    createdAt: generatePastDate(80),
    updatedAt: generatePastDate(5),
  },
  {
    id: generateUUID(),
    email: 'volunteer6@example.com',
    password: 'volunteer123!',
    name: '박봉사',
    role: 'VOLUNTEER',
    instructorId: generateUUID(),
    interviewStatus: 'APPROVED',
    participationHistory: 8,
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(200),
    updatedAt: generatePastDate(1),
  },
  {
    id: generateUUID(),
    email: 'volunteer7@example.com',
    password: 'volunteer123!',
    name: '최자원',
    role: 'VOLUNTEER',
    instructorId: generateUUID(),
    interviewStatus: 'APPROVED',
    participationHistory: 2,
    isActive: true,
    lastLoginAt: generatePastDate(7),
    createdAt: generatePastDate(60),
    updatedAt: generatePastDate(7),
  },
  {
    id: generateUUID(),
    email: 'volunteer8@example.com',
    password: 'volunteer123!',
    name: '정봉사',
    role: 'VOLUNTEER',
    instructorId: generateUUID(),
    interviewStatus: 'APPROVED',
    participationHistory: 12,
    isActive: true,
    lastLoginAt: generatePastDate(0),
    createdAt: generatePastDate(300),
    updatedAt: generatePastDate(0),
  },
  // 최근 로그인한 수강자
  {
    id: generateUUID(),
    email: 'student.active@jakorea.org',
    password: 'student123!',
    name: '활동수강자',
    role: 'STUDENT',
    isActive: true,
    lastLoginAt: generatePastDate(0),
    createdAt: generatePastDate(15),
    updatedAt: generatePastDate(0),
  },
  // 오래된 수강자 (비활성)
  {
    id: generateUUID(),
    email: 'student.inactive@jakorea.org',
    password: 'student123!',
    name: '휴면수강자',
    role: 'STUDENT',
    isActive: false,
    lastLoginAt: generatePastDate(730),
    createdAt: generatePastDate(800),
    updatedAt: generatePastDate(730),
  },
]

// ============================================
// 전체 사용자 목록
// ============================================

export const mockUsers: User[] = [
  ...mockAdmins,
  ...mockInstructors,
  ...mockVolunteers,
  ...mockStudents,
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



