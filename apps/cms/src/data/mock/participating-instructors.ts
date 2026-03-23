/**
 * 프로그램 진행현황 - 강사 정보 Mock 데이터
 * 참여 강사진 목록 (필터: 교육 학년, 강의 진행 회차, 정산 현황, 교사/강사명)
 */

export type SettlementStatusKey = 'pending' | 'partial' | 'completed' | 'na' | 'reviewing' | 'rejected'

/** 참여 강사 상세 모달·강사 이력서 탭용 (ApplicantInstructorRow와 동일 구조) */
export interface ParticipatingInstructorCareerDetail {
  companyName?: string
  role?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}

export interface ParticipatingInstructorQualification {
  name?: string
  year?: string
}

export interface ParticipatingInstructorAward {
  name?: string
  year?: string
}

/** 참여 강사 상세·강사 이력서 탭 - 학력사항 (강사 추가 모달 educations와 연동) */
export interface ParticipatingInstructorEducationItem {
  schoolType?: string
  status?: string
  schoolName?: string
  major?: string
  enrollmentYear?: string
  graduationYear?: string
}

export interface ParticipatingInstructorRow {
  id: string
  no: number
  instructorName: string
  schoolName: string
  educationGrade: string
  classCount: number
  studentCount: number
  lectureRound: string
  settlementStatus: SettlementStatusKey
  teacherName: string
  /** 참여 강사 상세 모달(기본 정보 탭)용 */
  contact?: string
  email?: string
  address?: string
  nameHanja?: string
  nameEnglish?: string
  birthDate?: string
  age?: number
  gender?: string
  militaryStatus?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  profileImageUrl?: string
  oneLineIntro?: string
  educationLevel?: string
  educationSchoolName?: string
  lectureExperienceYears?: number
  /** 강사 이력서 탭용 */
  careerDetails?: ParticipatingInstructorCareerDetail[]
  qualifications?: ParticipatingInstructorQualification[]
  awards?: ParticipatingInstructorAward[]
  /** 강사 이력서 - 학력사항 */
  educations?: ParticipatingInstructorEducationItem[]
  /** 1. 자기소개 및 지원동기 */
  freeWriting1?: string
  /** 2. 청소년 경제 교육의 중요성... */
  freeWriting2?: string
  /** 3. 청소년과 소통할 때... */
  freeWriting3?: string
  /** 4. 교육 중 예기치 않은 상황... */
  freeWriting4?: string
  /** 프로그램 참여 최초 승인 유무 (false면 강사 신규 배정 안내 모달 노출) */
  initialApproval?: boolean
  /** 거주 지역 (참여 강사 목록 필터·테이블용) */
  region?: string
  /** JA 평가 등급 (참여 강사 목록 필터·테이블용) */
  jaEvaluationGrade?: string
}

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatusKey, string> = {
  pending: '정산 대기',
  partial: '일부 정산 완료',
  completed: '정산 완료',
  na: '해당 없음',
  reviewing: '내역 검토 중',
  rejected: '지급 반려',
}

const INSTRUCTOR_NAMES = [
  '김서연',
  '이준혁',
  '최지원',
  '박민준',
  '정수아',
  '강현우',
  '조지은',
  '윤도현',
  '장유리',
  '임태민',
]

/**
 * 모달 등에서 학교 배정 선택용 옵션.
 * 참여 학교 mock(participating-schools)의 SCHOOL_NAMES와 동일 목록 유지 → 담당 강사진·학교 상세 강사진 연동.
 */
export const INSTRUCTOR_SCHOOL_OPTIONS = [
  '강서초등학교',
  '마포초등학교',
  '학사초등학교',
  '진월초등학교',
  '대구수성초등학교',
  '부산해운대초등학교',
  '인천남동초등학교',
  '광주광산초등학교',
  '대전유성초등학교',
  '울산중구초등학교',
  '세종반곡초등학교',
  '수원영덕초등학교',
  '성남분당초등학교',
  '고양일산초등학교',
  '용인기흥초등학교',
  '창원성산초등학교',
  '청주상당초등학교',
  '전주완산초등학교',
  '천안서북구초등학교',
  '안양만안초등학교',
  '안산상록초등학교',
  '김해율하초등학교',
  '포항남구초등학교',
  '진주초등학교',
  '춘천초등학교',
  '원주초등학교',
  '제주초등학교',
  '목포초등학교',
  '여수초등학교',
  '순천초등학교',
] as const

const SCHOOL_NAMES = [...INSTRUCTOR_SCHOOL_OPTIONS]

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

const LECTURE_ROUNDS = ['진행 전', '1회차', '2회차', '진행 완료']

/** 거주 지역 옵션 (참여 강사 필터·목록용) */
const REGIONS = [
  '서울특별시 강서구',
  '경기도 수원시',
  '부산광역시 해운대구',
  '대구광역시 수성구',
  '인천광역시 남동구',
  '광주광역시 광산구',
  '대전광역시 유성구',
  '울산광역시 중구',
  '세종시',
  '경기도 성남시',
  '경기도 고양시',
  '강원도 춘천시',
  '충청북도 청주시',
  '전라북도 전주시',
  '경상남도 창원시',
  '제주특별자치도',
]

const JA_EVALUATION_GRADES = ['A등급', 'B등급', 'C등급'] as const
const JA_LECTURE_YEARS = [1, 2, 3, 5]

const TEACHER_NAMES = [
  '홍채원',
  '김민지',
  '박지훈',
  '이수진',
  '최현아',
  '정다은',
  '강태양',
  '조아람',
]

const settlementStatuses: SettlementStatusKey[] = ['pending', 'partial', 'completed', 'na']

const EDUCATION_LEVELS = [
  '4년제 졸업',
  '2년제 졸업',
  '고등학교 졸업',
  '4년제 휴학',
  '대학원',
]
const EDUCATION_SCHOOLS = ['한성대학교', '동서울대학교', '경복고등학교']
const GENDERS = ['남성', '여성']
const MILITARY_STATUSES = ['군필', '미필', '면제']

/** 참여 강사 상세 모달(기본 정보·강사 이력서 탭)용 확장 데이터. 일부 인덱스만 채움 */
function getDetailExtension(
  index: number
): Partial<
  Pick<
    ParticipatingInstructorRow,
    | 'contact'
    | 'email'
    | 'address'
    | 'nameHanja'
    | 'nameEnglish'
    | 'birthDate'
    | 'age'
    | 'gender'
    | 'militaryStatus'
    | 'bankName'
    | 'accountNumber'
    | 'accountHolder'
    | 'oneLineIntro'
    | 'educationLevel'
    | 'educationSchoolName'
    | 'lectureExperienceYears'
    | 'careerDetails'
    | 'qualifications'
    | 'awards'
    | 'educations'
    | 'freeWriting1'
    | 'freeWriting2'
    | 'freeWriting3'
    | 'freeWriting4'
  >
> {
  if (index > 1) return {}
  const birthYear = 1988 + (index % 5)
  const birthDate = `${birthYear}.07.14`
  const age = new Date().getFullYear() - birthYear
  if (index === 0) {
    return {
      contact: '010-2847-5913',
      email: 'instructor0@example.com',
      address: '서울특별시 강서구',
      nameHanja: '金서연',
      nameEnglish: 'Kim Seoyeon',
      birthDate,
      age,
      gender: GENDERS[0],
      militaryStatus: MILITARY_STATUSES[0],
      bankName: '농협',
      accountNumber: '352-1846-9203-71',
      accountHolder: INSTRUCTOR_NAMES[0],
      oneLineIntro: '담당 교사분은 물론, 아이들과도 적극적인 소통으로 재미있고 활기차게 강의를 이끌어가는 스타일입니다.',
      educationLevel: EDUCATION_LEVELS[0],
      educationSchoolName: EDUCATION_SCHOOLS[0],
      lectureExperienceYears: 3,
      careerDetails: [
        { companyName: '한솔교육', role: '학습지 방문 교육', startDate: '2024.02', isCurrent: true },
        { companyName: '대교 눈높이학원', role: '초등학생 수학 강의', startDate: '2023.01', endDate: '2024.01' },
      ],
      qualifications: [{ name: '1종 운전면허', year: '2020' }],
      awards: [
        { name: '한국생산성본부 퍼실리테이터 양성과정 수료', year: '2024' },
        { name: '서울특별시 교육청 우수 강사 표창장', year: '2020' },
      ],
      educations: [
        { schoolType: '대학 4년제', status: 'graduated', schoolName: '한성대학교', major: '경영학과', enrollmentYear: '2020.03', graduationYear: '2025.02' },
        { schoolType: '고등학교', status: 'graduated', schoolName: '경복고등학교', enrollmentYear: '2017.03', graduationYear: '2020.02' },
      ],
      freeWriting1: '대학에서 경영학을 전공하며 금융과 경제에 깊은 관심을 갖게 되었습니다. 청소년들이 돈의 흐름과 경제의 원리를 일찍부터 이해하면 더 현명한 선택을 할 수 있다고 믿으며, 실생활 사례 중심의 참여형 수업으로 아이들이 흥미를 잃지 않도록 이끌겠습니다.',
      freeWriting2: '청소년 경제 교육은 미래 세대의 재정적 독립과 의사결정 능력을 키우는 데 중요합니다. 본인은 실생활 사례를 활용한 참여형 수업으로 흥미를 높이려 노력합니다.',
      freeWriting3: '청소년과 소통할 때 가장 중요한 것은 경청과 공감입니다. 일방적 설명보다 질문을 유도하고, 학생들이 스스로 답을 찾도록 돕는 것을 실천하고 있습니다.',
      freeWriting4: '수업 중 참여도가 낮았을 때, 짝 활동과 퀴즈 형식으로 분위기를 전환한 적이 있습니다. 그 결과 학생들의 참여가 늘었고, 이후에도 같은 방식을 적용하고 있습니다.',
    }
  }
  return {
    contact: '010-3156-8274',
    email: 'instructor1@example.com',
    address: '경기도 수원시',
    nameHanja: '李준혁',
    nameEnglish: 'Lee Junhyuk',
    birthDate: `${birthYear}.03.07`,
    age,
    gender: GENDERS[1],
    militaryStatus: MILITARY_STATUSES[1],
    bankName: '국민',
    accountNumber: '601-3927-4810-56',
    accountHolder: INSTRUCTOR_NAMES[1],
    oneLineIntro: '어린이 눈높이에 맞춘 친근하고 이해하기 쉬운 강의를 지향합니다.',
    educationLevel: EDUCATION_LEVELS[1],
    educationSchoolName: EDUCATION_SCHOOLS[1],
    lectureExperienceYears: 2,
    careerDetails: [
      { companyName: '㈜에듀윌', role: '방과후 강사', startDate: '2022.03', endDate: '2023.12' },
    ],
    qualifications: [
      { name: '초등교사 2급 정교사', year: '2021' },
      { name: '영어회화 지도사', year: '2020' },
    ],
    awards: [{ name: 'JA코리아 우수 강사상', year: '2023' }],
    educations: [
      { schoolType: '대학 2・3년제', status: 'graduated', schoolName: '동서울대학교', major: '유아교육과', enrollmentYear: '2018.03', graduationYear: '2020.02' },
    ],
    freeWriting1: '전공을 살려 초등 대상 교육에 지원하게 되었습니다. 아이들이 경제 개념을 쉽게 이해하도록 돕고 싶습니다.',
    freeWriting2: '경제 교육을 통해 청소년이 합리적 선택을 할 수 있는 기반이 마련된다고 생각합니다.',
    freeWriting3: '신뢰를 바탕으로 한 소통을 중요시하며, 수업 전후로 학생들과 짧은 대화 시간을 갖고 있습니다.',
    freeWriting4: '-',
  }
}

function buildMockList(count: number): ParticipatingInstructorRow[] {
  const rows: ParticipatingInstructorRow[] = []
  for (let i = 0; i < count; i++) {
    const statusIdx = i % settlementStatuses.length
    const extension = getDetailExtension(i)
    const region = REGIONS[i % REGIONS.length]
    const jaGrade = JA_EVALUATION_GRADES[i % JA_EVALUATION_GRADES.length]
    const lectureYears = JA_LECTURE_YEARS[i % JA_LECTURE_YEARS.length]
    rows.push({
      id: `instructor-${i + 1}`,
      no: count - i,
      instructorName: INSTRUCTOR_NAMES[i % INSTRUCTOR_NAMES.length],
      schoolName: SCHOOL_NAMES[i % SCHOOL_NAMES.length],
      educationGrade: GRADES[i % GRADES.length],
      classCount: 2 + (i % 4),
      studentCount: 40 + (i % 85),
      lectureRound: LECTURE_ROUNDS[i % LECTURE_ROUNDS.length],
      settlementStatus: settlementStatuses[statusIdx],
      teacherName: TEACHER_NAMES[i % TEACHER_NAMES.length],
      /** 일부 강사는 최초 승인 미완료(신규 배정 안내 모달 테스트용) */
      initialApproval: i % 4 !== 2,
      region,
      jaEvaluationGrade: jaGrade,
      lectureExperienceYears: extension.lectureExperienceYears ?? lectureYears,
      ...extension,
    })
  }
  return rows
}

export const MOCK_PARTICIPATING_INSTRUCTORS: ParticipatingInstructorRow[] = buildMockList(72)
