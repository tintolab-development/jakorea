import type { InstructorRoleRequestProfile } from '@/features/mypage/instructor-apply/api/types'
import type { SettingsProfileInput } from './map-view'

export const VOLUNTEER_1365_URL = 'https://www.1365.go.kr'

export const EMPTY_SETTINGS_VALUE = '-'

export const SETTINGS_WITHDRAW_GUIDE = {
  title: '회원 탈퇴 안내',
  description:
    'JA KOREA 서비스를 탈퇴하시겠습니까?\n탈퇴 시 개인정보는 관련 법령 및 당사의 개인정보처리방침에 따라 삭제·처리됩니다. 삭제된 정보는 복구할 수 없습니다. 탈퇴하시려면 로그인 비밀번호를 입력해 주세요.',
  passwordPlaceholder: '현재 사용 중인 비밀번호를 입력해 주세요',
  cancelLabel: '취소',
  confirmLabel: '탈퇴하기',
  /** OpenAPI `PortalWithdrawalRequest.reason` */
  reason: '회원 요청에 의한 탈퇴',
} as const

/** 로컬/dev 조회 mock — 시안 일반회원 필드셋 */
export const MOCK_SETTINGS_PROFILE = {
  joinedAt: '2026-09-15',
  name: '홍길동',
  phone: '010-1234-5678',
  birthDate: '1999-01-01',
  gender: 'M',
  schoolEnrollmentStatus: 'ENROLLED',
  schoolName: '재희 고등학교',
  grade: '2학년',
  address: '서울시 강서구 제이로 23',
  addressDetail: '9층 901호',
  email: 'user@example.com',
  external1365Id: '',
} as const

/** 로컬/dev 조회 mock — 교사 회원 필드셋 */
export const MOCK_TEACHER_SETTINGS_PROFILE = {
  joinedAt: '2026-09-15',
  name: '김교사',
  phone: '010-1234-5678',
  birthDate: '1985-03-12',
  gender: 'F',
  schoolName: '서울초등학교',
  affiliationName: '서울초등학교',
  teacherEmploymentStatus: 'ACTIVE',
  email: 'teacher@example.com',
} as const

export const MOCK_SETTINGS_GUARDIAN = {
  name: '홍길동',
  phone: '010-1234-5678',
  relationship: '아빠',
} as const

/** 로컬/dev — 강사 회원 설정 + instructorProfile mock */
export const MOCK_INSTRUCTOR_SETTINGS_PROFILE: SettingsProfileInput = {
  joinedAt: '2026-09-15',
  name: '김강사',
  phone: '010-9876-5432',
  birthDate: '1990-05-20',
  gender: 'M',
  email: 'instructor@example.com',
  address: '서울시 강남구 테헤란로 1',
  addressDetail: '10층',
  instructor: true,
  instructorProfile: {
    profile: {
      memberType: 'GENERAL' as const,
      affiliation: { organizationNames: ['JA학습지'] },
      instructorCareerSummary: '3년',
      homeAddress: { line: '서울시 강남구 테헤란로 1', detail: '10층' },
      education: {
        highestSchoolType: 'college4' as const,
        highestStatus: 'graduated' as const,
        detailKeys: ['high', 'college4'] as InstructorRoleRequestProfile['education']['detailKeys'],
        highSchool: {
          schoolName: '고등학교',
          admitYear: '2017-03',
          gradYear: '2020-02',
        },
        college4: [
          {
            schoolName: '대학교(대학교4년제)',
            major: '경제학과',
            admitYear: '2020-03',
            gradYear: '2025-02',
          },
        ],
      },
      career: {
        level: 'experienced' as const,
        summaryYears: '3년',
        rows: [
          {
            companyName: 'JA학습지',
            roleName: '학습지 방문 교육',
            periodStart: '2020-03',
            currentlyEmployed: true,
          },
          {
            companyName: 'JA학원',
            roleName: '초등학생 수학강의',
            periodStart: '2023-01',
            periodEnd: '2024-01',
            currentlyEmployed: false,
          },
        ],
      },
      jaKoreaActivities: [],
      licenses: [],
      awards: [],
      essays: {
        freeWrite1: '자기소개 및 지원동기 예시 텍스트입니다.',
        freeWrite2: '청소년 경제 교육의 중요성에 대한 생각 예시입니다.',
        freeWrite3: '청소년과의 소통에 대한 생각 예시입니다.',
        freeWrite4: '예기치 않은 상황 대처 사례 예시입니다.',
      },
    },
  },
}
