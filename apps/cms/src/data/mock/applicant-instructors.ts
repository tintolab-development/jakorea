/**
 * 프로그램 상세 - 신청자 목록 탭 (신청 강사) Mock 데이터
 * 강의 신청 강사 목록 (필터: 학교명, 강사명, 결재 현황)
 */

export type ApplicantInstructorApprovalStatusKey = 'pending' | 'rejected' | 'approved'

/** 희망 배정 학교 1~4순위 (상세 모달 희망 배정 학교 섹션) */
export interface ApplicantInstructorPreferredSchool {
  schoolId: string
  schoolName: string
  rank: number
  assignable: boolean
  /** 희망 학년 (예: 5학년) */
  grade?: string
  /** 희망 진행 일자 (예: 2026.04.09 (목) ~ 2026.04.30 (목)) */
  dateRange?: string
}

/** 강사 이력서 - 경력 상세 (강사 추가 모달과 동일 구조) */
export interface ApplicantInstructorCareerDetail {
  companyName?: string
  role?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}

/** 강사 이력서 - 자격 및 면허 */
export interface ApplicantInstructorQualification {
  name?: string
  year?: string
}

/** 강사 이력서 - 수상 및 수료 내역 */
export interface ApplicantInstructorAward {
  name?: string
  year?: string
}

/** 강사 이력서 - 학력사항 (강사 추가 모달 educations와 연동) */
export interface ApplicantInstructorEducationItem {
  schoolType?: string
  status?: string
  schoolName?: string
  major?: string
  enrollmentYear?: string
  graduationYear?: string
}

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
  appliedAt?: string
  affiliation?: string
  approvalStatus: ApplicantInstructorApprovalStatusKey
  /** 신청 학교(필터용) */
  schoolName: string
  /** 일정 변경&취소 이력 횟수. 1 이상일 때만 강사 상세 모달 강사명 옆 배지 표시 */
  scheduleChangeCancelCount?: number
  /** JA 평가 등급 (A|B|C) */
  evaluationGrade?: string
  /** JA 강의 경력 (신규|1년 미만|1~3년|3년 이상 등) */
  teachingExperience?: string
  /** 한줄소개 (강사 상세 모달 기본 정보 탭) */
  oneLineIntro?: string
  /** 성명 한자 */
  nameHanja?: string
  /** 성명 영문 */
  nameEnglish?: string
  /** 생년월일 (예: 1990.09.15) */
  birthDate?: string
  /** 만 나이 (표시용) */
  age?: number
  /** 성별 (예: 남성/여성) */
  gender?: string
  /** 병역사항 (예: 군필/미필/면제) */
  militaryStatus?: string
  /** 정산 계좌: 은행명 */
  bankName?: string
  /** 정산 계좌: 계좌번호 */
  accountNumber?: string
  /** 정산 계좌: 예금주 */
  accountHolder?: string
  /** 프로필 사진 URL (없으면 플레이스홀더) */
  profileImageUrl?: string
  /** 희망 배정 학교 1~4순위 (일부 assignable: false로 배정 불가) */
  preferredSchools?: ApplicantInstructorPreferredSchool[]
  /** 승인 완료 시 배정된 학교 ID (결재 내역 배정 학교 표시용) */
  assignedSchoolId?: string
  /** 승인 완료 시 배정된 학교명 */
  assignedSchoolName?: string
  /** 승인 반려 시 반려 사유 (결재 내역 반려 사유 표시용) */
  rejectionReason?: string
  /** 강사 이력서 - 경력 상세 (강사 이력서 탭) */
  careerDetails?: ApplicantInstructorCareerDetail[]
  /** 강사 이력서 - 자격 및 면허 */
  qualifications?: ApplicantInstructorQualification[]
  /** 강사 이력서 - 수상 및 수료 내역 */
  awards?: ApplicantInstructorAward[]
  /** 강사 이력서 - 학력사항 (강사 추가 모달 educations와 연동) */
  educations?: ApplicantInstructorEducationItem[]
  /** 1. 자기소개 및 지원동기 */
  freeWriting1?: string
  /** 2. 청소년 경제 교육의 중요성... */
  freeWriting2?: string
  /** 3. 청소년과 소통할 때... */
  freeWriting3?: string
  /** 4. 교육 중 예기치 않은 상황... */
  freeWriting4?: string
  /** 승인 완료 시 기본 정보 상단 노출 관리자 코멘트 */
  managerComment?: string
  /** 승인 완료 시 기본 정보 하단: 강의비 책정 기준 (예: 특강 강사비 | 915,000원) */
  lectureFeeBasisDisplay?: string
  /** 승인 완료 시 기본 정보 하단: 사업소득자 여부 (예: 해당 없음) */
  businessIncomeEarnerStatus?: string
  /** 승인 완료 시 알림 발송 일시 (프로그램 승인 현황 옆 표시) */
  approvalNotificationSentAt?: string
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
  '한가은',
  '오세훈',
  '서다은',
  '신민철',
  '권예진',
  '황재원',
  '안소희',
  '송현준',
  '전미래',
  '홍성은',
]

const INSTRUCTOR_NAMES_HANJA = [
  '金서연',
  '李준혁',
  '崔지원',
  '朴민준',
  '鄭수아',
  '姜현우',
  '趙지은',
  '尹도현',
  '張유리',
  '林태민',
  '韓가은',
  '吳세훈',
  '徐다은',
  '申민철',
  '權예진',
  '黃재원',
  '安소희',
  '宋현준',
  '全미래',
  '洪성은',
]

const INSTRUCTOR_NAMES_ENGLISH = [
  'Kim Seoyeon',
  'Lee Junhyuk',
  'Choi Jiwon',
  'Park Minjun',
  'Jung Sua',
  'Kang Hyunwoo',
  'Jo Jieun',
  'Yoon Dohyun',
  'Jang Yuri',
  'Im Taemin',
  'Han Gaeun',
  'Oh Sehun',
  'Seo Daeun',
  'Shin Mincheol',
  'Kwon Yejin',
  'Hwang Jaewon',
  'An Sohee',
  'Song Hyunjun',
  'Jeon Mirae',
  'Hong Sungeun',
]

const EDUCATION_LEVELS = [
  '4년제 졸업',
  '2년제 졸업',
  '고등학교 졸업',
  '4년제 휴학',
  '4년제 중퇴',
  '대학원',
]

const EDUCATION_SCHOOLS = ['한성대학교', '동서울대학교', '경복고등학교', '서울대학교 대학원']

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
  '서울특별시 강서구 화곡동 3394-23 302호',
  '서울특별시 강서구 화곡동 123-45',
  '서울특별시 마포구 상수동 511-2',
  '경기도 수원시',
  '경기도 성남시',
  '부산광역시 해운대구',
  '대구광역시 수성구',
]

/** 희망 배정 학교 옵션 (상세 모달용, 1~4순위) */
const PREFERRED_SCHOOL_OPTIONS = [
  {
    schoolId: 'school-1',
    schoolName: '강서초등학교',
    rank: 1,
    grade: '5학년',
    dateRange: '2026.04.09 (목) ~ 2026.04.30 (목)',
  },
  {
    schoolId: 'school-2',
    schoolName: '우장초등학교',
    rank: 2,
    grade: '3학년',
    dateRange: '2026.04.09 (목) ~ 2026.04.30 (목)',
  },
  {
    schoolId: 'school-3',
    schoolName: '마포초등학교',
    rank: 3,
    grade: '6학년',
    dateRange: '2026.04.09 (목) ~ 2026.04.30 (목)',
  },
  {
    schoolId: 'school-4',
    schoolName: '서이초등학교',
    rank: 4,
    grade: '5학년',
    dateRange: '2026.04.09 (목) ~ 2026.04.30 (목)',
  },
]

const BANK_NAMES: Record<string, string> = {
  nh: '농협',
  kb: '국민',
  shinhan: '신한',
  woori: '우리',
  hana: '하나',
}

const GENDERS = ['남성', '여성']
const MILITARY_STATUSES = ['군필', '미필', '면제']

const APPROVAL_STATUSES: ApplicantInstructorApprovalStatusKey[] = [
  'pending',
  'rejected',
  'approved',
]

const ONE_LINE_INTROS = [
  '담당 교사분은 물론, 아이들과도 적극적인 소통으로 재미있고 활기차게 강의를 이끌어가는 스타일입니다.',
  '어린이 눈높이에 맞춘 친근하고 이해하기 쉬운 강의를 지향합니다.',
  '실생활 사례 중심의 참여형 수업으로 경제 개념을 자연스럽게 익힐 수 있도록 돕습니다.',
  '학생들과의 신뢰 관계를 바탕으로 활기차고 집중력 있는 수업 환경을 만들어갑니다.',
  '10년 이상의 교육 현장 경험을 토대로 학생 맞춤형 강의를 제공합니다.',
]

const CONTACT_NUMBERS = [
  '010-2847-5913',
  '010-3156-8274',
  '010-4523-9016',
  '010-5781-2349',
  '010-6234-7805',
  '010-7845-1263',
  '010-8192-3746',
  '010-9037-6182',
  '010-1483-7529',
  '010-2619-4873',
  '010-3927-5140',
  '010-4261-8357',
  '010-5834-2619',
  '010-6178-3492',
  '010-7492-1865',
  '010-8305-7124',
  '010-9156-4287',
  '010-1724-8930',
  '010-2893-6015',
  '010-3461-7852',
]

const ACCOUNT_NUMBERS = [
  '352-1846-9203-71',
  '601-3927-4810-56',
  '110-482-938271',
  '1002-834-562910',
  '361-0027-4853-19',
  '352-7391-5042-83',
  '601-5214-8763-02',
  '110-729-483016',
  '1002-247-839561',
  '361-0083-2947-56',
  '352-4608-3179-24',
  '601-8436-2097-51',
  '110-356-820471',
  '1002-619-374820',
  '361-0051-8362-93',
  '352-9173-4826-07',
  '601-2758-9134-48',
  '110-893-612450',
  '1002-472-910385',
  '361-0094-7615-28',
]

/** 강사 이력서 탭 UI 검증용 샘플 (i === 0, 1에만 주입) */
function getResumeSample(
  index: number
): Pick<
  ApplicantInstructorRow,
  | 'careerDetails'
  | 'qualifications'
  | 'awards'
  | 'educations'
  | 'freeWriting1'
  | 'freeWriting2'
  | 'freeWriting3'
  | 'freeWriting4'
> | null {
  if (index > 1) return null
  if (index === 0) {
    return {
      careerDetails: [
        {
          companyName: '한솔교육',
          role: '학습지 방문 교육',
          startDate: '2024.02',
          isCurrent: true,
        },
        {
          companyName: '대교 눈높이학원',
          role: '초등학생 수학 강의',
          startDate: '2023.01',
          endDate: '2024.01',
        },
      ],
      qualifications: [{ name: '1종 운전면허', year: '2020' }],
      awards: [
        { name: '한국생산성본부 퍼실리테이터 양성과정 수료', year: '2024' },
        { name: '서울특별시 교육청 우수 강사 표창장', year: '2020' },
      ],
      educations: [
        {
          schoolType: '대학 4년제',
          status: 'graduated',
          schoolName: '한성대학교',
          major: '경영학과',
          enrollmentYear: '2020.03',
          graduationYear: '2025.02',
        },
        {
          schoolType: '고등학교',
          status: 'graduated',
          schoolName: '경복고등학교',
          enrollmentYear: '2017.03',
          graduationYear: '2020.02',
        },
      ],
      freeWriting1:
        '대학에서 경영학을 전공하며 금융과 경제에 깊은 관심을 갖게 되었습니다. 청소년들이 돈의 흐름과 경제의 원리를 일찍부터 이해하면 더 현명한 선택을 할 수 있다고 믿으며, 실생활 사례 중심의 참여형 수업으로 아이들이 흥미를 잃지 않도록 이끌겠습니다.',
      freeWriting2:
        '청소년 경제 교육은 미래 세대의 재정적 독립과 의사결정 능력을 키우는 데 중요합니다. 본인은 실생활 사례를 활용한 참여형 수업으로 흥미를 높이려 노력합니다.',
      freeWriting3:
        '청소년과 소통할 때 가장 중요한 것은 경청과 공감입니다. 일방적 설명보다 질문을 유도하고, 학생들이 스스로 답을 찾도록 돕는 것을 실천하고 있습니다.',
      freeWriting4:
        '수업 중 참여도가 낮았을 때, 짝 활동과 퀴즈 형식으로 분위기를 전환한 적이 있습니다. 그 결과 학생들의 참여가 늘었고, 이후에도 같은 방식을 적용하고 있습니다.',
    }
  }
  return {
    careerDetails: [
      { companyName: '㈜에듀윌', role: '방과후 강사', startDate: '2022.03', endDate: '2023.12' },
    ],
    qualifications: [
      { name: '초등교사 2급 정교사', year: '2021' },
      { name: '영어회화 지도사', year: '2020' },
    ],
    awards: [{ name: 'JA코리아 우수 강사상', year: '2023' }],
    educations: [
      {
        schoolType: '대학 2・3년제',
        status: 'graduated',
        schoolName: '동서울대학교',
        major: '유아교육과',
        enrollmentYear: '2018.03',
        graduationYear: '2020.02',
      },
    ],
    freeWriting1:
      '전공을 살려 초등 대상 교육에 지원하게 되었습니다. 아이들이 경제 개념을 쉽게 이해하도록 돕고 싶습니다.',
    freeWriting2:
      '경제 교육을 통해 청소년이 합리적 선택을 할 수 있는 기반이 마련된다고 생각합니다.',
    freeWriting3:
      '신뢰를 바탕으로 한 소통을 중요시하며, 수업 전후로 학생들과 짧은 대화 시간을 갖고 있습니다.',
    freeWriting4: '-',
  }
}

const BIRTH_MONTHS = ['02', '04', '06', '08', '09', '11', '01', '03', '05', '07', '10', '12']
const BIRTH_DAYS = ['07', '14', '19', '23', '28', '05', '11', '17', '22', '26', '08', '15']

function buildMockList(count: number): ApplicantInstructorRow[] {
  const rows: ApplicantInstructorRow[] = []
  const bankKeys = Object.keys(BANK_NAMES)
  for (let i = 0; i < count; i++) {
    const statusIdx = i % APPROVAL_STATUSES.length
    const eduIdx = i % EDUCATION_LEVELS.length
    const nameIdx = i % INSTRUCTOR_NAMES.length
    const name = INSTRUCTOR_NAMES[nameIdx]
    /* 일부 강사에만 일정 변경&취소 이력 있음 */
    const scheduleChangeCancelCount =
      name === '박민준' ? 1 : name === '김서연' ? 2 : i % 7 === 0 ? 1 : 0
    /* 생년월일·만 나이: 월일 다양화 */
    const birthYear = 1988 + (i % 12)
    const birthMonth = BIRTH_MONTHS[i % BIRTH_MONTHS.length]
    const birthDay = BIRTH_DAYS[i % BIRTH_DAYS.length]
    const birthDate = `${birthYear}.${birthMonth}.${birthDay}`
    const age = new Date().getFullYear() - birthYear
    /* 4순위(서이초) 배정 불가: 일부만 비활성 */
    const fourthAssignable = i % 3 !== 0
    const preferredSchools: ApplicantInstructorRow['preferredSchools'] =
      PREFERRED_SCHOOL_OPTIONS.map((s, idx) => ({
        schoolId: s.schoolId,
        schoolName: s.schoolName,
        rank: s.rank,
        assignable: idx < 3 ? true : fourthAssignable,
        grade: s.grade,
        dateRange: s.dateRange,
      }))
    const status: ApplicantInstructorApprovalStatusKey = APPROVAL_STATUSES[statusIdx]
    const assignedSchool =
      status === 'approved'
        ? {
            assignedSchoolId: PREFERRED_SCHOOL_OPTIONS[0].schoolId,
            assignedSchoolName: PREFERRED_SCHOOL_OPTIONS[0].schoolName,
          }
        : {}
    const managerComment =
      status === 'approved' ? '정보 재검토 정보 재확인 필요, 입금기입이 다르네요.' : undefined
    const rejectionReason = status === 'rejected' ? '인원 초과' : undefined
    const lectureFeeBasisDisplay =
      status === 'approved' ? '특강 강사비 | 915,000원' : undefined
    const businessIncomeEarnerStatus = status === 'approved' ? '해당 없음' : undefined
    const approvalNotificationSentAt =
      status === 'approved' ? '2026.01.15 09:15:42' : undefined
    const resumeSample = getResumeSample(i)
    const evaluationGrades = ['A', 'B', 'C']
    const teachingExperiences = ['신규', '1년 미만', '1~3년', '3년 이상']

    rows.push({
      id: `applicant-instructor-${i + 1}`,
      no: count - i,
      instructorName: name,
      nameHanja: INSTRUCTOR_NAMES_HANJA[nameIdx],
      nameEnglish: INSTRUCTOR_NAMES_ENGLISH[nameIdx],
      birthDate,
      age,
      gender: GENDERS[i % GENDERS.length],
      militaryStatus: MILITARY_STATUSES[i % MILITARY_STATUSES.length],
      lectureExperienceYears: 1 + (i % 10),
      evaluationGrade: evaluationGrades[i % evaluationGrades.length],
      teachingExperience: teachingExperiences[i % teachingExperiences.length],
      educationLevel: EDUCATION_LEVELS[eduIdx],
      educationSchoolName: EDUCATION_SCHOOLS[eduIdx % EDUCATION_SCHOOLS.length],
      contact: CONTACT_NUMBERS[i % CONTACT_NUMBERS.length],
      email: i === 3 ? 'tinto@naver.com' : `instructor${i}@example.com`,
      address: ADDRESSES[i % ADDRESSES.length],
      appliedAt: `2026.01.${(10 + (i % 20)).toString().padStart(2, '0')}`,
      affiliation: i % 2 === 0 ? '개인' : '삼성전자',
      approvalStatus: status,
      schoolName: SCHOOL_NAMES[i % SCHOOL_NAMES.length],
      ...assignedSchool,
      rejectionReason,
      scheduleChangeCancelCount:
        scheduleChangeCancelCount > 0 ? scheduleChangeCancelCount : undefined,
      oneLineIntro: ONE_LINE_INTROS[i % ONE_LINE_INTROS.length] || undefined,
      bankName: BANK_NAMES[bankKeys[i % bankKeys.length]] ?? '농협',
      accountNumber: ACCOUNT_NUMBERS[i % ACCOUNT_NUMBERS.length],
      accountHolder: name,
      preferredSchools,
      managerComment,
      lectureFeeBasisDisplay,
      businessIncomeEarnerStatus,
      approvalNotificationSentAt,
      ...resumeSample,
    })
  }
  return rows
}

export const MOCK_APPLICANT_INSTRUCTORS: ApplicantInstructorRow[] = buildMockList(72)

/**
 * 프로그램별 강의 신청 강사 목록 (강사 모집 상세 모달용).
 * Mock: programId별로 다른 수의 강사 반환 (실제 API 연동 시 programId 필터 적용).
 */
export function getApplicantInstructorsByProgramId(programId: string): ApplicantInstructorRow[] {
  const hash = programId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const count = Math.min(72, Math.max(5, (hash % 50) + 20))
  return MOCK_APPLICANT_INSTRUCTORS.slice(0, count).map((row, idx) => ({
    ...row,
    no: count - idx,
  }))
}

function formatApprovalNotificationSentAt(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}:${ss}`
}

/**
 * 결재 상태에 맞게 강사 행 정규화 (승인 시 강의비·알림일시 등, 그 외에는 해당 필드 제거)
 */
export function patchApplicantInstructorForApprovalStatus(
  row: ApplicantInstructorRow,
  approvalStatus: ApplicantInstructorApprovalStatusKey
): ApplicantInstructorRow {
  if (approvalStatus === 'approved') {
    return {
      ...row,
      approvalStatus,
      lectureFeeBasisDisplay: row.lectureFeeBasisDisplay ?? '특강 강사비 | 915,000원',
      businessIncomeEarnerStatus: row.businessIncomeEarnerStatus ?? '해당 없음',
      approvalNotificationSentAt: formatApprovalNotificationSentAt(),
    }
  }
  return {
    ...row,
    approvalStatus,
    lectureFeeBasisDisplay: undefined,
    businessIncomeEarnerStatus: undefined,
    approvalNotificationSentAt: undefined,
  }
}

/**
 * 강의 신청 강사 결재 현황 변경 (mock 동기화).
 * 모달에서 상태 변경 시 호출하면 MOCK_APPLICANT_INSTRUCTORS에 반영됨.
 */
export function updateApplicantInstructorApprovalStatus(
  instructorId: string,
  approvalStatus: ApplicantInstructorApprovalStatusKey
): void {
  const row = MOCK_APPLICANT_INSTRUCTORS.find(i => i.id === instructorId)
  if (row) {
    Object.assign(row, patchApplicantInstructorForApprovalStatus(row, approvalStatus))
  }
}
