/**
 * 프로그램 진행현황 - 참여 학교 정보 Mock 데이터
 * 수강 참여 학교 목록 (필터: 지역, 교육 학년, 강의 진행 회차, 교재 현황, 교사/강사명)
 */

export type TextbookStatusKey = 'preparing' | 'shipping' | 'delivered' | 'not_applicable'

/** 참여 기관 승인/반려 상태 (선택 승인·선택 반려·승인 취소 연동) */
export type ParticipatingSchoolApprovalStatusKey = 'pending' | 'rejected' | 'approved' | 'cancelled'

/** 강의 회차별 진행 상태 (교육기관 상세 신청 정보 탭용) */
export type ParticipatingSchoolSessionStatusKey = 'completed' | 'pending' | 'not_planned'

/** 강의 회차별 교육 진행 일정 한 건 (참여 기관 테이블용) */
export interface ParticipatingSchoolSession {
  round: number
  date: string
  dayOfWeek: string
  duration: string
  format: string
  classNum: string
  timeRange: string
  /** 진행 완료 | 진행 대기 | 미진행 희망 (상세 뷰용, 선택) */
  status?: ParticipatingSchoolSessionStatusKey
}

export interface ParticipatingSchoolRow {
  id: string
  no: number
  schoolName: string
  region: string
  educationGrade: string
  classCount: number
  studentCount: number
  lectureRound: string
  textbookStatus: TextbookStatusKey
  /** 참여 승인/반려 상태 (선택 승인·선택 반려 연동) */
  approvalStatus: ParticipatingSchoolApprovalStatusKey
  teacherName: string
  instructors: string
  /** 강의 회차 별 교육 진행 날짜 및 시간 (참여 기관 페이지 컬럼용) */
  sessions?: ParticipatingSchoolSession[]
}

export const TEXTBOOK_STATUS_LABELS: Record<TextbookStatusKey, string> = {
  preparing: '교재 배송 전',
  shipping: '교재 배송 중',
  delivered: '교재 배송 완료',
  not_applicable: '해당 없음',
}

/** StatusDropdownCell·필터 셀렉트 등 옵션 순서 */
export const TEXTBOOK_STATUS_OPTION_KEYS: TextbookStatusKey[] = [
  'preparing',
  'shipping',
  'delivered',
  'not_applicable',
]

const LECTURE_ROUND_LABEL = '진행 전'

const APPROVAL_STATUSES: ParticipatingSchoolApprovalStatusKey[] = [
  'pending',
  'rejected',
  'approved',
  'cancelled',
]

/** 데모용 교육 진행 일정 한 건 (스크린샷: YYYY. MM. DD(요일) HH:mm ~ HH:mm | N차시) */
function demoParticipatingSchoolSession(
  round: number,
  date: string,
  dayOfWeek: string,
  timeRange: string
): ParticipatingSchoolSession {
  return {
    round,
    date,
    dayOfWeek,
    duration: '2시간',
    format: '오프라인',
    classNum: `${round}교시`,
    timeRange,
    status: 'pending',
  }
}

/** 교재 배송 상태별 2건 + 합반 신청 데모(동일 학교·다른 학년 1쌍) — 총 7건 */
function buildParticipatingSchoolsByTextbookStatus(): ParticipatingSchoolRow[] {
  const seeds: Array<{
    schoolName: string
    region: string
    educationGrade: string
    textbookStatus: TextbookStatusKey
    teacherName: string
    classCount: number
    studentCount: number
    instructors: string
    sessions: ParticipatingSchoolSession[]
  }> = [
    {
      schoolName: '강서초등학교',
      region: '서울특별시 강서구',
      educationGrade: '5학년',
      textbookStatus: 'preparing',
      teacherName: '홍채원',
      classCount: 3,
      studentCount: 72,
      instructors: '김서연 외 2명',
      sessions: [
        demoParticipatingSchoolSession(2, '2026.01.09', '금', '9:20~11:20'),
      ],
    },
    {
      /** 합반 신청 UI 데모 — 강서초등학교 5학년(school-1)과 동일 기관·다른 학년 */
      schoolName: '강서초등학교',
      region: '서울특별시 강서구',
      educationGrade: '3학년',
      textbookStatus: 'preparing',
      teacherName: '박서연',
      classCount: 2,
      studentCount: 52,
      instructors: '김서연 외 1명',
      sessions: [
        demoParticipatingSchoolSession(1, '2026.01.23', '금', '9:20~10:10'),
        demoParticipatingSchoolSession(2, '2026.02.13', '금', '10:20~11:10'),
      ],
    },
    {
      schoolName: '마포초등학교',
      region: '서울특별시 마포구',
      educationGrade: '3학년',
      textbookStatus: 'preparing',
      teacherName: '김민지',
      classCount: 2,
      studentCount: 48,
      instructors: '이준혁 외 1명',
      sessions: [
        demoParticipatingSchoolSession(1, '2026.01.16', '금', '9:30~10:20'),
        demoParticipatingSchoolSession(2, '2026.02.06', '금', '10:30~11:20'),
      ],
    },
    {
      schoolName: '진월초등학교',
      region: '광주광역시 남구 광복마을4길 40',
      educationGrade: '5학년',
      textbookStatus: 'preparing',
      teacherName: '이길동',
      classCount: 4,
      studentCount: 124,
      instructors: '최지원 외 3명',
      sessions: [
        {
          ...demoParticipatingSchoolSession(1, '2026.04.20', '월', '9:30~12:20'),
          status: 'completed',
        },
        {
          ...demoParticipatingSchoolSession(2, '2026.04.27', '일', '13:00~15:50'),
          status: 'pending',
        },
      ],
    },
    {
      schoolName: '학사초등학교',
      region: '서울특별시 관악구',
      educationGrade: '2학년',
      textbookStatus: 'shipping',
      teacherName: '이수진',
      classCount: 2,
      studentCount: 44,
      instructors: '박민준',
      sessions: [
        demoParticipatingSchoolSession(1, '2026.01.30', '금', '9:20~10:10'),
        demoParticipatingSchoolSession(2, '2026.02.20', '금', '10:20~11:10'),
        demoParticipatingSchoolSession(3, '2026.03.13', '금', '13:00~13:50'),
        demoParticipatingSchoolSession(4, '2026.03.27', '금', '14:00~14:50'),
      ],
    },
    {
      schoolName: '대구수성초등학교',
      region: '대구광역시 수성구',
      educationGrade: '6학년',
      textbookStatus: 'delivered',
      teacherName: '최현아',
      classCount: 3,
      studentCount: 66,
      instructors: '정수아 외 2명',
      sessions: [
        demoParticipatingSchoolSession(1, '2026.02.06', '금', '9:20~10:10'),
        demoParticipatingSchoolSession(2, '2026.02.27', '금', '10:20~11:20'),
      ],
    },
    {
      schoolName: '부산해운대초등학교',
      region: '부산광역시 해운대구',
      educationGrade: '1학년',
      textbookStatus: 'delivered',
      teacherName: '정다은',
      classCount: 2,
      studentCount: 40,
      instructors: '강현우 외 1명',
      sessions: [
        demoParticipatingSchoolSession(1, '2026.02.13', '금', '9:20~10:10'),
        demoParticipatingSchoolSession(2, '2026.03.06', '금', '10:20~11:10'),
        demoParticipatingSchoolSession(3, '2026.03.20', '금', '11:20~12:10'),
        demoParticipatingSchoolSession(4, '2026.04.03', '금', '13:30~14:20'),
        demoParticipatingSchoolSession(5, '2026.04.17', '금', '14:30~15:20'),
      ],
    },
  ]

  const total = seeds.length
  return seeds.map((seed, i) => ({
    id: `school-${i + 1}`,
    no: total - i,
    schoolName: seed.schoolName,
    region: seed.region,
    educationGrade: seed.educationGrade,
    classCount: seed.classCount,
    studentCount: seed.studentCount,
    lectureRound: LECTURE_ROUND_LABEL,
    textbookStatus: seed.textbookStatus,
    approvalStatus: APPROVAL_STATUSES[i % APPROVAL_STATUSES.length],
    teacherName: seed.teacherName,
    instructors: seed.instructors,
    sessions: seed.sessions,
  }))
}

export const MOCK_PARTICIPATING_SCHOOLS: ParticipatingSchoolRow[] =
  buildParticipatingSchoolsByTextbookStatus()
