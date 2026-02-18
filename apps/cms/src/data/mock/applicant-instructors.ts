/**
 * 프로그램 상세 - 신청자 목록 탭 (신청 강사) Mock 데이터
 * 강의 신청 강사 목록 (필터: 학교명, 강사명, 결재 현황)
 */

export type ApplicantInstructorApprovalStatusKey = 'pending' | 'rejected' | 'approved'

export interface ApplicantInstructorRow {
  id: string
  no: number
  instructorName: string
  lectureExperienceYears: number
  educationLevel: string
  educationSchoolName: string
  contact: string
  email: string
  address: string
  approvalStatus: ApplicantInstructorApprovalStatusKey
  /** 신청 학교(필터용) */
  schoolName: string
  /** 일정 변경&취소 이력 횟수. 1 이상일 때만 강사 상세 모달 강사명 옆 배지 표시 */
  scheduleChangeCancelCount?: number
  /** 한줄소개 (강사 상세 모달 기본 정보 탭) */
  oneLineIntro?: string
}

const INSTRUCTOR_NAMES = [
  '김틴토',
  '이틴토',
  '최틴토',
  '박틴토',
  '정틴토',
  '강틴토',
  '조틴토',
  '윤틴토',
  '장틴토',
  '임틴토',
  '한틴토',
  '오틴토',
  '서틴토',
  '신틴토',
  '권틴토',
  '황틴토',
  '안틴토',
  '송틴토',
  '전틴토',
  '홍틴토',
]

const EDUCATION_LEVELS = [
  '4년제 졸업',
  '2년제 졸업',
  '고등학교 졸업',
  '4년제 휴학',
  '4년제 중퇴',
  '대학원',
]

const EDUCATION_SCHOOLS = ['틴토대학교', '틴토전문대학교', '틴토고등학교', '틴토대학원']

const SCHOOL_NAMES = [
  '강서초등학교',
  '마포초등학교',
  '학사초등학교',
  '진월초등학교',
  '대구수성초등학교',
  '부산해운대초등학교',
  '인천남동초등학교',
  '광주광산초등학교',
  '수원영덕초등학교',
  '성남분당초등학교',
]

const ADDRESSES = [
  '서울특별시 강서구',
  '서울특별시 마포구',
  '경기도 수원시',
  '경기도 성남시',
  '부산광역시 해운대구',
  '대구광역시 수성구',
]

const APPROVAL_STATUSES: ApplicantInstructorApprovalStatusKey[] = [
  'pending',
  'rejected',
  'approved',
]

const ONE_LINE_INTROS = [
  '담당 교사분은 물론, 아이들과도 적극적인 소통으로 재미있고 활기차게 강의를 이끌어가는 스타일입니다^^',
  '어린이 눈높이에 맞춘 친근하고 이해하기 쉬운 강의를 지향합니다.',
  '',
]

function buildMockList(count: number): ApplicantInstructorRow[] {
  const rows: ApplicantInstructorRow[] = []
  for (let i = 0; i < count; i++) {
    const statusIdx = i % APPROVAL_STATUSES.length
    const eduIdx = i % EDUCATION_LEVELS.length
    const name = INSTRUCTOR_NAMES[i % INSTRUCTOR_NAMES.length]
    /* 일부 강사(예: 박틴토 등)에만 일정 변경&취소 이력 있음 */
    const scheduleChangeCancelCount =
      name === '박틴토' ? 1 : name === '김틴토' ? 2 : i % 7 === 0 ? 1 : 0
    rows.push({
      id: `applicant-instructor-${i + 1}`,
      no: count - i,
      instructorName: name,
      lectureExperienceYears: 1 + (i % 10),
      educationLevel: EDUCATION_LEVELS[eduIdx],
      educationSchoolName: EDUCATION_SCHOOLS[eduIdx % EDUCATION_SCHOOLS.length],
      contact: '010-0000-0000',
      email: i === 3 ? 'tinto@naver.com' : 'tinto.naver.com',
      address: ADDRESSES[i % ADDRESSES.length],
      approvalStatus: APPROVAL_STATUSES[statusIdx],
      schoolName: SCHOOL_NAMES[i % SCHOOL_NAMES.length],
      scheduleChangeCancelCount:
        scheduleChangeCancelCount > 0 ? scheduleChangeCancelCount : undefined,
      oneLineIntro: ONE_LINE_INTROS[i % ONE_LINE_INTROS.length] || undefined,
    })
  }
  return rows
}

export const MOCK_APPLICANT_INSTRUCTORS: ApplicantInstructorRow[] = buildMockList(72)
