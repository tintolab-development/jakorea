/**
 * 사용자 계정 Mock 데이터
 * Phase 0.1.1: 역할/권한 체계 재정의
 * requirements.md §2 역할 및 권한 기준
 */

import type { User } from '../../types/user'
import { PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID } from './program-lecture-history-demo'

/** 진월초등학교 — 고정 user id (소속 교사 mock·강사 `affiliatedSchoolUserId` 연결) */
export const MOCK_SCHOOL_JINWOL_USER_ID = 'mock-school-jinwol-001'

/** 최강사(instructor1) — 고정 CMS User.id (소속 교사 `linkedUserId`·딥링크 안정화) */
export const MOCK_INSTRUCTOR_CHOI_USER_ID = 'mock-instructor-choi-001'

/** 강사 mock 2·3 — 고정 id (소속 교사 `linkedUserId` 연동) */
export const MOCK_INSTRUCTOR_JUNG_USER_ID = 'mock-instructor-jung-001'
export const MOCK_INSTRUCTOR_KANG_USER_ID = 'mock-instructor-kang-001'

/** 학교(교사) 회원 목록 1~4행 — 고정 id (소속 교사·프로그램 신청 mock 연동) */
export const MOCK_SCHOOL_SEOUL_USER_ID = 'mock-school-seoul-001'
export const MOCK_SCHOOL_BUSAN_USER_ID = 'mock-school-busan-001'
export const MOCK_SCHOOL_DAEGU_USER_ID = 'mock-school-daegu-001'
export const MOCK_SCHOOL_INCHEON_USER_ID = 'mock-school-incheon-001'

function generateUUID(): string {
  // 새로고침마다 동일한 mock ID를 보장해 URL 딥링크(id=...)를 안정적으로 복원한다.
  mockUserSequence += 1
  return `user-${String(mockUserSequence).padStart(4, '0')}`
}
let mockUserSequence = 0

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
    nameEn: 'Kim Gwan-ri',
    role: 'ADMIN',
    adminLevel: 'MASTER',
    programRoles: { 'program-1': 'OWNER' },
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(365),
    updatedAt: generatePastDate(1),
    phone: '02-1234-5001',
    gender: '남성',
    birthDate: '1980-05-12',
    detailAddress: '서울특별시 강남구 테헤란로 123',
    affiliation: 'JAKorea | 총괄 관리자',
    socialAccounts: ['구글'],
  },
  {
    id: generateUUID(),
    email: 'admin2@jakorea.org',
    password: 'admin123!',
    name: '이운영',
    nameEn: 'Lee Un-young',
    role: 'ADMIN',
    adminLevel: 'ADMIN',
    programRoles: { 'program-1': 'PARTNER' },
    isActive: true,
    lastLoginAt: generatePastDate(3),
    createdAt: generatePastDate(300),
    updatedAt: generatePastDate(3),
    phone: '02-1234-5002',
    gender: '여성',
    birthDate: '1985-11-08',
    detailAddress: '서울특별시 서초구 서초동 456',
    affiliation: 'JAKorea | 운영팀',
    socialAccounts: ['카카오'],
  },
  {
    id: generateUUID(),
    email: 'admin3@jakorea.org',
    password: 'admin123!',
    name: '박시스템',
    nameEn: 'Park System',
    role: 'ADMIN',
    adminLevel: 'GENERAL',
    programRoles: { 'program-1': 'ASSISTANT' },
    isActive: true,
    lastLoginAt: generatePastDate(7),
    createdAt: generatePastDate(200),
    updatedAt: generatePastDate(7),
    phone: '02-1234-5003',
    gender: '남성',
    birthDate: '1992-03-25',
    detailAddress: '경기도 성남시 분당구 정자동 789',
    affiliation: 'JAKorea | 시스템 관리',
  },
]

// ============================================
// 강사 (Instructor) 계정 - 3개
// ============================================

// instructor1@example.com용 고정 instructorId
const INSTRUCTOR1_ID = 'instructor-1-fixed-id-for-testing'

const mockInstructors: User[] = [
  {
    id: MOCK_INSTRUCTOR_CHOI_USER_ID,
    email: 'instructor1@example.com',
    password: 'instructor123!',
    name: '최강사',
    nameEn: 'Choi Kang-sa',
    role: 'INSTRUCTOR',
    instructorId: INSTRUCTOR1_ID, // 고정 ID로 변경
    interviewStatus: 'APPROVED', // 승인 완료
    participationHistory: 5, // 참여이력 5건
    isActive: true,
    lastLoginAt: generatePastDate(2),
    createdAt: generatePastDate(180),
    updatedAt: generatePastDate(2),
    phone: '010-1234-5678',
    detailAddress: '서울특별시 서초구 서초길 123-22 JA빌딩 10층',
    zipCode: '06611',
    bio: '안녕하세요, 경제교육 전문 강사 최강사입니다.',
    birthDate: '1985-03-20',
    gender: '남성',
    affiliation: '경제교육연구소 | 수석강사',
    socialAccounts: ['구글', '카카오'],
    instructorInfo: {
      bankName: '국민은행',
      accountHolder: '최강사',
      accountNumber: '123-456-789012',
      isBusinessIncome: false,
    },
    listMetrics: {
      settlementStatusLabel: '계좌 지급 완료',
      jaEvaluationGrade: 'A',
    },
    affiliatedSchoolUserId: MOCK_SCHOOL_JINWOL_USER_ID,
  },
  {
    id: MOCK_INSTRUCTOR_JUNG_USER_ID,
    email: 'instructor2@example.com',
    password: 'instructor123!',
    name: '정멘토',
    nameEn: 'Jung Mentor',
    role: 'INSTRUCTOR',
    instructorId: 'instructor-2-fixed-id-for-testing',
    interviewStatus: 'APPROVED',
    participationHistory: 3,
    isActive: true,
    lastLoginAt: generatePastDate(5),
    createdAt: generatePastDate(120),
    updatedAt: generatePastDate(5),
    phone: '010-2345-6789',
    gender: '여성',
    birthDate: '1990-07-19',
    detailAddress: '인천광역시 연수구 송도동 321',
    affiliation: '자유강사',
    socialAccounts: ['카카오'],
  },
  {
    id: MOCK_INSTRUCTOR_KANG_USER_ID,
    email: 'instructor3@example.com',
    password: 'instructor123!',
    name: '강선생',
    nameEn: 'Kang Sun-saeng',
    role: 'INSTRUCTOR',
    instructorId: 'instructor-3-fixed-id-for-testing',
    interviewStatus: 'PENDING', // 면접 대기 중
    participationHistory: 0, // 참여이력 없음
    isActive: true,
    lastLoginAt: generatePastDate(10),
    createdAt: generatePastDate(30),
    updatedAt: generatePastDate(10),
    phone: '010-3456-7890',
    gender: '남성',
    birthDate: '1988-12-01',
    detailAddress: '대전광역시 유성구 과학로 555',
    affiliation: '경제교육 강사협회 | 준회원',
  },
]

// ============================================
// 학교 (School) 계정 - 12개
// ============================================

const mockSchools: User[] = [
  {
    id: MOCK_SCHOOL_SEOUL_USER_ID,
    email: 'school1@example.com',
    password: 'school123!',
    name: '서울초등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '서울초등학교',
      address: '서울특별시 마포구 월드컵북로 456',
      position: '교사',
      affiliatedTeachers: [
        {
          id: 'aff-seoul-1',
          name: '한서울',
          assignedGrade: '3학년',
          phone: '010-2001-0001',
          email: 'han.seoul@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2024-03-01T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-001',
        },
        {
          id: 'aff-seoul-2',
          name: '김마포',
          assignedGrade: '5학년',
          phone: '010-2001-0002',
          email: 'kim.mapo@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2024-04-12T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-002',
        },
        {
          id: 'aff-seoul-3',
          name: '이월드',
          assignedGrade: '1학년',
          phone: '010-2001-0003',
          email: 'lee.world@school.kr',
          employmentStatus: 'TRANSFERRED',
          joinedAt: '2023-09-01T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-003',
        },
      ],
    },
    affiliation: '서울초등학교 | 교사',
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(240),
    updatedAt: generatePastDate(1),
    phone: '02-1234-5678',
    detailAddress: '서울특별시 마포구 월드컵북로 456',
    socialAccounts: ['구글'],
    listMetrics: {
      institutionProgramApplicationCount: 3,
      institutionProgramAttendanceCount: 2,
      institutionRegisteredTeacherCount: 3,
    },
  },
  {
    id: MOCK_SCHOOL_BUSAN_USER_ID,
    email: 'school2@example.com',
    password: 'school123!',
    name: '부산중학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '부산중학교',
      address: '부산광역시 해운대구 센텀중앙로 123',
      position: '담당교사',
      affiliatedTeachers: [
        {
          id: 'aff-busan-1',
          name: '박해운',
          assignedGrade: '2학년',
          phone: '010-2002-0001',
          email: 'park.busan@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2024-02-15T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-004',
        },
        {
          id: 'aff-busan-2',
          name: '정센텀',
          assignedGrade: '3학년',
          phone: '010-2002-0002',
          email: 'jung.centum@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2024-05-20T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-005',
        },
        {
          id: 'aff-busan-3',
          name: '최중앙',
          assignedGrade: '1학년',
          phone: '010-2002-0003',
          email: 'choi.mid@school.kr',
          employmentStatus: 'WITHDRAWN',
          joinedAt: '2023-11-01T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-006',
        },
        {
          id: 'aff-busan-4',
          name: '강동래',
          assignedGrade: '2학년',
          phone: '010-2002-0004',
          email: 'kang.dong@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2025-01-08T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-007',
        },
      ],
    },
    affiliation: '부산중학교 | 담당교사',
    isActive: true,
    lastLoginAt: generatePastDate(4),
    createdAt: generatePastDate(150),
    updatedAt: generatePastDate(4),
    phone: '051-2345-6789',
    detailAddress: '부산광역시 해운대구 센텀중앙로 123',
    socialAccounts: ['구글'],
    listMetrics: {
      institutionProgramApplicationCount: 4,
      institutionProgramAttendanceCount: 3,
      institutionRegisteredTeacherCount: 4,
    },
  },
  {
    id: MOCK_SCHOOL_DAEGU_USER_ID,
    email: 'school3@example.com',
    password: 'school123!',
    name: '대구고등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '대구고등학교',
      address: '대구광역시 수성구 범어천로 789',
      position: '교감',
      affiliatedTeachers: [
        {
          id: 'aff-daegu-1',
          name: '윤수성',
          assignedGrade: '2학년',
          phone: '010-2003-0001',
          email: 'yoon.suseong@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2023-08-21T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-008',
        },
        {
          id: 'aff-daegu-2',
          name: '조범어',
          assignedGrade: '1학년',
          phone: '010-2003-0002',
          email: 'jo.beomeo@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2024-01-10T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-009',
        },
        {
          id: 'aff-daegu-3',
          name: '임교감',
          assignedGrade: '3학년',
          phone: '010-2003-0003',
          email: 'im.vice@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2022-04-01T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-010',
        },
      ],
    },
    affiliation: '대구고등학교 | 교감',
    isActive: true,
    lastLoginAt: generatePastDate(3),
    createdAt: generatePastDate(45),
    updatedAt: generatePastDate(3),
    phone: '053-3456-7890',
    detailAddress: '대구광역시 수성구 범어천로 789',
    socialAccounts: ['카카오', '구글'],
    listMetrics: {
      institutionProgramApplicationCount: 5,
      institutionProgramAttendanceCount: 4,
      institutionRegisteredTeacherCount: 3,
    },
  },
  {
    id: MOCK_SCHOOL_INCHEON_USER_ID,
    email: 'school4@example.com',
    password: 'school123!',
    name: '인천남중학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '인천남중학교',
      address: '인천광역시 남동구 구월로 112',
      position: '교사',
      affiliatedTeachers: [
        {
          id: 'aff-incheon-1',
          name: '송구월',
          assignedGrade: '2학년',
          phone: '010-2004-0001',
          email: 'song.guwol@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2024-06-01T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-011',
        },
        {
          id: 'aff-incheon-2',
          name: '황남동',
          assignedGrade: '1학년',
          phone: '010-2004-0002',
          email: 'hwang.namdong@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2024-09-12T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-012',
        },
        {
          id: 'aff-incheon-3',
          name: '배중학',
          assignedGrade: '3학년',
          phone: '010-2004-0003',
          email: 'bae.mid@school.kr',
          employmentStatus: 'ACTIVE',
          joinedAt: '2023-12-01T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-013',
        },
        {
          id: 'aff-incheon-4',
          name: '신인천',
          assignedGrade: '2학년',
          phone: '010-2004-0004',
          email: 'shin.ic@school.kr',
          employmentStatus: 'TRANSFERRED',
          joinedAt: '2023-04-15T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-014',
        },
      ],
    },
    affiliation: '인천남중학교 | 교사',
    isActive: true,
    lastLoginAt: generatePastDate(2),
    createdAt: generatePastDate(120),
    updatedAt: generatePastDate(2),
    phone: '032-4567-8901',
    detailAddress: '인천광역시 남동구 구월로 112',
    socialAccounts: ['구글'],
    listMetrics: {
      institutionProgramApplicationCount: 6,
      institutionProgramAttendanceCount: 5,
      institutionRegisteredTeacherCount: 4,
    },
  },
  {
    id: MOCK_SCHOOL_JINWOL_USER_ID,
    email: 'jinwol.school@example.com',
    password: 'school123!',
    name: '진월초등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '진월초등학교',
      address: '광주광역시 남구 광복마을4길 40',
      position: '교사',
      affiliatedTeachers: [
        {
          id: 'aff-teacher-jw-1',
          name: '김틴토',
          assignedGrade: '5학년',
          phone: '010-1001-0001',
          email: 'kimtinto@naver.com',
          employmentStatus: 'ACTIVE',
          joinedAt: '2025-09-15T00:00:00.000Z',
          linkedUserId: MOCK_INSTRUCTOR_CHOI_USER_ID,
        },
        {
          id: 'aff-teacher-jw-2',
          name: '박틴토',
          assignedGrade: '1학년',
          phone: '010-1002-0002',
          email: 'parktinto@naver.com',
          employmentStatus: 'ACTIVE',
          joinedAt: '2025-09-15T00:00:00.000Z',
          linkedUserId: PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
        },
        {
          id: 'aff-teacher-jw-3',
          name: '이교사',
          assignedGrade: '3학년',
          phone: '010-1003-0003',
          email: 'lee@naver.com',
          employmentStatus: 'TRANSFERRED',
          joinedAt: '2025-09-15T00:00:00.000Z',
          linkedUserId: MOCK_INSTRUCTOR_JUNG_USER_ID,
        },
        {
          id: 'aff-teacher-jw-4',
          name: '최교사',
          assignedGrade: '2학년',
          phone: '010-1004-0004',
          email: 'choi@naver.com',
          employmentStatus: 'WITHDRAWN',
          joinedAt: '2025-09-15T00:00:00.000Z',
          linkedUserId: MOCK_INSTRUCTOR_KANG_USER_ID,
        },
        {
          id: 'aff-teacher-jw-5',
          name: '정교사',
          assignedGrade: '4학년',
          phone: '010-1005-0005',
          email: 'jung@naver.com',
          employmentStatus: 'ACTIVE',
          joinedAt: '2025-09-15T00:00:00.000Z',
          linkedUserId: 'mock-aff-link-015',
        },
      ],
    },
    affiliation: '진월초등학교 | 교사',
    isActive: true,
    lastLoginAt: generatePastDate(5),
    createdAt: '2025-09-15T00:00:00.000Z',
    updatedAt: generatePastDate(5),
    phone: '062-5678-9012',
    detailAddress: '광주광역시 남구 광복마을4길 40',
    socialAccounts: ['카카오'],
    listMetrics: {
      institutionProgramApplicationCount: 8,
      institutionProgramAttendanceCount: 5,
    },
  },
  {
    id: generateUUID(),
    email: 'school6@example.com',
    password: 'school123!',
    name: '대전중앙고등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '대전중앙고등학교',
      address: '대전광역시 중구 대종로 200',
      position: '담당교사',
    },
    affiliation: '대전중앙고등학교 | 담당교사',
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(180),
    updatedAt: generatePastDate(1),
    phone: '042-6789-0123',
    detailAddress: '대전광역시 중구 대종로 200',
    socialAccounts: ['구글'],
  },
  {
    id: generateUUID(),
    email: 'school7@example.com',
    password: 'school123!',
    name: '울산북초등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '울산북초등학교',
      address: '울산광역시 북구 산업로 55',
      position: '교사',
    },
    affiliation: '울산북초등학교 | 교사',
    isActive: true,
    lastLoginAt: generatePastDate(3),
    createdAt: generatePastDate(60),
    updatedAt: generatePastDate(3),
    phone: '052-7890-1234',
    detailAddress: '울산광역시 북구 산업로 55',
    socialAccounts: ['카카오', '구글'],
  },
  {
    id: generateUUID(),
    email: 'school8@example.com',
    password: 'school123!',
    name: '수원중학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '수원중학교',
      address: '경기도 수원시 팔달구 인계로 77',
      position: '담당교사',
    },
    affiliation: '수원중학교 | 담당교사',
    isActive: true,
    lastLoginAt: generatePastDate(2),
    createdAt: generatePastDate(200),
    updatedAt: generatePastDate(2),
    phone: '031-8901-2345',
    detailAddress: '경기도 수원시 팔달구 인계로 77',
    socialAccounts: ['구글'],
  },
  {
    id: generateUUID(),
    email: 'school9@example.com',
    password: 'school123!',
    name: '강릉고등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '강릉고등학교',
      address: '강원도 강릉시 경강로 150',
      position: '교감',
    },
    affiliation: '강릉고등학교 | 교감',
    isActive: true,
    lastLoginAt: generatePastDate(7),
    createdAt: generatePastDate(100),
    updatedAt: generatePastDate(7),
    phone: '033-9012-3456',
    detailAddress: '강원도 강릉시 경강로 150',
    socialAccounts: ['카카오'],
  },
  {
    id: generateUUID(),
    email: 'school10@example.com',
    password: 'school123!',
    name: '제주서초등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '제주서초등학교',
      address: '제주특별자치도 제주시 연동로 33',
      position: '교사',
    },
    affiliation: '제주서초등학교 | 교사',
    isActive: true,
    lastLoginAt: generatePastDate(4),
    createdAt: generatePastDate(75),
    updatedAt: generatePastDate(4),
    phone: '064-0123-4567',
    detailAddress: '제주특별자치도 제주시 연동로 33',
    socialAccounts: ['구글'],
  },
  {
    id: generateUUID(),
    email: 'school11@example.com',
    password: 'school123!',
    name: '서울영등포중학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '서울영등포중학교',
      address: '서울특별시 영등포구 당산로 44',
      position: '담당교사',
    },
    affiliation: '서울영등포중학교 | 담당교사',
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(30),
    updatedAt: generatePastDate(1),
    phone: '02-2345-6789',
    detailAddress: '서울특별시 영등포구 당산로 44',
    socialAccounts: ['카카오', '구글'],
  },
  {
    id: generateUUID(),
    email: 'school12@example.com',
    password: 'school123!',
    name: '부산해운대고등학교',
    role: 'SCHOOL',
    schoolInfo: {
      schoolName: '부산해운대고등학교',
      address: '부산광역시 해운대구 좌동순환로 99',
      position: '교사',
    },
    affiliation: '부산해운대고등학교 | 교사',
    isActive: true,
    lastLoginAt: generatePastDate(6),
    createdAt: generatePastDate(50),
    updatedAt: generatePastDate(6),
    phone: '051-3456-7890',
    detailAddress: '부산광역시 해운대구 좌동순환로 99',
    socialAccounts: ['구글'],
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
    nameEn: 'Jang Hak-saeng',
    role: 'INDIVIDUAL',
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(60),
    updatedAt: generatePastDate(1),
    phone: '010-1111-2222',
    birthDate: '2008-01-15',
    gender: '남성',
    detailAddress: '서울특별시 강남구 역삼동 123-45',
    affiliation: '서울 OO고등학교 | 2학년',
    socialAccounts: ['카카오'],
  },
  {
    id: generateUUID(),
    email: 'individual2@example.com',
    password: 'individual123!',
    name: '임참여',
    nameEn: 'Im Cham-yeo',
    role: 'INDIVIDUAL',
    isActive: true,
    lastLoginAt: generatePastDate(3),
    createdAt: generatePastDate(45),
    updatedAt: generatePastDate(3),
    phone: '010-2222-3333',
    birthDate: '2007-04-20',
    gender: '여성',
    detailAddress: '경기도 성남시 분당구 판교로 100',
    affiliation: '경기 OO중학교 | 3학년',
  },
  {
    id: generateUUID(),
    email: 'individual3@example.com',
    password: 'individual123!',
    name: '한청년',
    nameEn: 'Han Cheong-nyeon',
    role: 'INDIVIDUAL',
    isActive: true,
    lastLoginAt: generatePastDate(7),
    createdAt: generatePastDate(30),
    updatedAt: generatePastDate(7),
    phone: '010-3333-4444',
    birthDate: '2005-07-22',
    gender: '남성',
    detailAddress: '광주광역시 북구 오룡동 77',
    affiliation: 'OO대학교 | 2학년',
    socialAccounts: ['구글'],
  },
]

/** 소속 교사 `linkedUserId` 전용 — 참여자(개인) 회원 `mock-aff-link-001` ~ `015` */
const mockAffiliatedTeacherLinkUsers: User[] = Array.from({ length: 15 }, (_, i) => {
  const n = i + 1
  const id = `mock-aff-link-${String(n).padStart(3, '0')}`
  return {
    id,
    email: `aff.link.${n}@mock.jakorea.org`,
    password: 'individual123!',
    name: `연결교사${n}`,
    role: 'INDIVIDUAL' as const,
    isActive: true,
    lastLoginAt: generatePastDate(10 + n),
    createdAt: generatePastDate(120 + n),
    updatedAt: generatePastDate(1),
    phone: `010-9${String(n).padStart(3, '0')}-0000`,
    birthDate: '1990-01-15',
    gender: n % 2 === 0 ? '여성' : '남성',
    detailAddress: '서울특별시',
    affiliation: '소속 교사 연결용 mock',
  }
})

// ============================================
// 추가 전체 회원 샘플 (필터/검색 테스트용)
// ============================================

const extraMockUsers: User[] = [
  // 프로그램 강의 이력 UI 개발용 (고정 ID — mock 신청 5건 연결)
  {
    id: PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
    email: 'instructor.parktinto.dev@jakorea.org',
    password: 'instructor123!',
    name: '박틴토',
    nameEn: 'Park Tinto',
    role: 'INSTRUCTOR',
    instructorId: 'instructor-dev-parktinto',
    interviewStatus: 'APPROVED',
    participationHistory: 5,
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(200),
    updatedAt: generatePastDate(1),
    phone: '010-0000-1111',
    gender: '남성',
    birthDate: '1988-01-15',
    detailAddress: '서울특별시 강남구 테헤란로',
    affiliation: 'JA 강사 | 강의 이력 데모',
    instructorInfo: {
      bankName: '국민은행',
      accountHolder: '박틴토',
      accountNumber: '110-123-456789',
      isBusinessIncome: false,
    },
  },
  // 비활성 관리자
  {
    id: generateUUID(),
    email: 'admin.inactive@jakorea.org',
    password: 'admin123!',
    name: '비활성관리자',
    nameEn: 'Inactive Admin',
    role: 'ADMIN',
    adminLevel: 'GENERAL',
    programRoles: { 'program-1': 'ASSISTANT' },
    isActive: false,
    lastLoginAt: generatePastDate(120),
    createdAt: generatePastDate(400),
    updatedAt: generatePastDate(120),
    phone: '02-1234-5004',
    gender: '남성',
    birthDate: '1975-01-10',
    detailAddress: '서울특별시 영등포구 여의도동 1',
    affiliation: 'JAKorea | 이전 담당',
  },
  // 최근 가입한 강사 (면접 예정)
  {
    id: generateUUID(),
    email: 'instructor.new@jakorea.org',
    password: 'instructor123!',
    name: '신규강사',
    nameEn: 'New Instructor',
    role: 'INSTRUCTOR',
    instructorId: generateUUID(),
    interviewStatus: 'SCHEDULED',
    interviewScheduledAt: generatePastDate(0),
    participationHistory: 0,
    isActive: true,
    lastLoginAt: undefined,
    createdAt: generatePastDate(5),
    updatedAt: generatePastDate(1),
    phone: '010-4567-8901',
    gender: '여성',
    birthDate: '1995-08-22',
    detailAddress: '경기도 용인시 수지구 200',
    affiliation: '신규 강사 지원',
  },
  // 참여이력 많은 강사
  {
    id: generateUUID(),
    email: 'instructor.senior@jakorea.org',
    password: 'instructor123!',
    name: '시니어강사',
    nameEn: 'Senior Instructor',
    role: 'INSTRUCTOR',
    instructorId: generateUUID(),
    interviewStatus: 'NOT_REQUIRED',
    participationHistory: 25,
    isActive: true,
    lastLoginAt: generatePastDate(1),
    createdAt: generatePastDate(730),
    updatedAt: generatePastDate(1),
    phone: '010-5678-9012',
    gender: '남성',
    birthDate: '1978-02-14',
    detailAddress: '서울특별시 마포구 망원동 300',
    affiliation: '경제교육연구소 | 수석강사',
  },
  // 스크린샷/UI 예시용 회원 (상세 모달 스펙: 최틴토, Choi Tinto)
  {
    id: generateUUID(),
    email: 'tinto@naver.com',
    password: 'individual123!',
    name: '최틴토',
    nameEn: 'Choi Tinto',
    role: 'INDIVIDUAL',
    isActive: true,
    lastLoginAt: '2025-09-14T10:00:00.000Z',
    createdAt: '2025-09-15T09:00:00.000Z',
    updatedAt: '2025-09-15T09:00:00.000Z',
    phone: '010-0000-0000',
    detailAddress: '서울특별시 강서구 화곡동',
    birthDate: '2010-09-15',
    gender: '여성',
    affiliation: '틴토고등학교 | 1학년',
    socialAccounts: ['카카오', '구글'],
  },
  // 추가 개인(참여자) 계정
  {
    id: generateUUID(),
    email: 'individual.active@jakorea.org',
    password: 'individual123!',
    name: '활동참여자',
    nameEn: 'Active Participant',
    role: 'INDIVIDUAL',
    isActive: true,
    lastLoginAt: generatePastDate(0),
    createdAt: generatePastDate(15),
    updatedAt: generatePastDate(0),
    phone: '010-4444-5555',
    gender: '남성',
    birthDate: '2006-11-03',
    detailAddress: '부산광역시 금정구 장전동 88',
    affiliation: '부산 OO고 | 1학년',
    socialAccounts: ['카카오'],
  },
  // 오래된 개인(참여자) (비활성)
  {
    id: generateUUID(),
    email: 'individual.inactive@jakorea.org',
    password: 'individual123!',
    name: '휴면참여자',
    nameEn: 'Dormant User',
    role: 'INDIVIDUAL',
    isActive: false,
    lastLoginAt: generatePastDate(730),
    createdAt: generatePastDate(800),
    updatedAt: generatePastDate(730),
    phone: '010-5555-6666',
    gender: '여성',
    birthDate: '2004-06-18',
    detailAddress: '대구광역시 수성구 999',
    affiliation: 'OO대학교 | 휴학',
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
  ...mockAffiliatedTeacherLinkUsers,
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
