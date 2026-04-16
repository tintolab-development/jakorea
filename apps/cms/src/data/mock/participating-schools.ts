/**
 * 프로그램 진행현황 - 참여 학교 정보 Mock 데이터
 * 수강 참여 학교 목록 (필터: 지역, 교육 학년, 강의 진행 회차, 교재 현황, 교사/강사명)
 */

export type TextbookStatusKey = 'preparing' | 'shipping' | 'delivered'

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
  preparing: '교재 준비 중',
  shipping: '교재 배송 중',
  delivered: '교재 배송 완료',
}

const SCHOOL_NAMES = [
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
]

/** 지역: 시안 예시(서울특별시 강서구, 광주광역시 남구) 형식 */
const REGIONS = [
  '서울특별시 강서구',
  '서울특별시 마포구',
  '서울특별시 관악구',
  '부산광역시 해운대구',
  '대구광역시 수성구',
  '인천광역시 남동구',
  '광주광역시 남구',
  '대전광역시 유성구',
  '울산광역시 중구',
  '세종특별자치시',
  '경기도 수원시',
  '경기도 성남시',
  '경기도 고양시',
  '강원특별자치도 춘천시',
  '충청북도 청주시',
  '충청남도 천안시',
  '전북특별자치도 전주시',
  '전라남도 목포시',
  '경상북도 포항시',
  '경상남도 창원시',
  '제주특별자치도',
]

/** 교육 학년: 시안 예시(5학년, 1학년) 형식 */
const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

const LECTURE_ROUND_LABEL = '진행 전'

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

const INSTRUCTOR_SAMPLES = [
  '김서연 외 2명',
  '이준혁 외 1명',
  '최지원 외 3명',
  '박민준',
  '정수아 외 2명',
  '강현우 외 1명',
]

const textbookStatuses: TextbookStatusKey[] = ['preparing', 'shipping', 'delivered']

const APPROVAL_STATUSES: ParticipatingSchoolApprovalStatusKey[] = [
  'pending',
  'rejected',
  'approved',
  'cancelled',
]

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토']

const SESSION_STATUSES: ParticipatingSchoolSessionStatusKey[] = ['completed', 'pending', 'not_planned']

/** 3월 중 하루: 캘린더 "외 N개의 항목" 확인용 — 이 날짜에 4개 학교 일정이 겹침 */
const MARCH_MULTI_DAY = '2026.03.12'

function buildSessionsForRow(rowIndex: number): ParticipatingSchoolSession[] {
  const sessionCount = 1 + (rowIndex % 5)
  const sessions: ParticipatingSchoolSession[] = []
  for (let s = 0; s < sessionCount; s++) {
    const dayOffset = rowIndex * 7 + s * 3
    const d = new Date(2026, 0, 9 + dayOffset)
    const dayOfWeek = DAYS_OF_WEEK[d.getDay()]
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    /** +1 오프셋: rowIndex 0 등 단일 회차 학교도 pending/not_planned가 섞이도록(강사 배정일 태그 선택 가능 목데이터) */
    const status = SESSION_STATUSES[(rowIndex + s + 1) % 3]
    sessions.push({
      round: s + 1,
      date: dateStr,
      dayOfWeek,
      duration: '1시간',
      format: s % 2 === 0 ? '오프라인' : '온라인',
      classNum: `${s + 1}교시`,
      timeRange: `${9 + s}:20~${10 + s}:10`,
      status,
    })
  }
  return sessions
}

/** 3월 12일 한 날에 처음 4개 학교에 일정 1건 추가 (월간 캘린더 "외 N개의 항목" 노출용) */
function addMarchMultiDaySessions(
  sessions: ParticipatingSchoolSession[],
  rowIndex: number,
): ParticipatingSchoolSession[] {
  const marchDaySchools = [0, 1, 2, 3]
  if (!marchDaySchools.includes(rowIndex)) return sessions
  const d = new Date(2026, 2, 12)
  const dayOfWeek = DAYS_OF_WEEK[d.getDay()]
  /** 기존 회차(1…N) 다음 회차 — 99 등 비연속 round 제거 */
  const nextRound = sessions.length + 1
  /** 같은 날짜·다 학교 겹침을 보이기 위해 행별 시작 시각만 다르게 */
  const marchSlotByRow: Array<Pick<ParticipatingSchoolSession, 'format' | 'classNum' | 'timeRange'>> = [
    { format: '오프라인', classNum: '1교시', timeRange: '9:20~10:10' },
    { format: '온라인', classNum: '1교시', timeRange: '10:20~11:10' },
    { format: '오프라인', classNum: '1교시', timeRange: '11:20~12:10' },
    { format: '온라인', classNum: '1교시', timeRange: '14:00~14:50' },
  ]
  const slot = marchSlotByRow[rowIndex]
  const extra: ParticipatingSchoolSession = {
    round: nextRound,
    date: MARCH_MULTI_DAY,
    dayOfWeek,
    duration: '1시간',
    format: slot.format,
    classNum: slot.classNum,
    timeRange: slot.timeRange,
    status: 'pending',
  }
  return [...sessions, extra]
}

function buildMockList(count: number): ParticipatingSchoolRow[] {
  const rows: ParticipatingSchoolRow[] = []
  for (let i = 0; i < count; i++) {
    const idx = i % SCHOOL_NAMES.length
    const statusIdx = i % textbookStatuses.length
    const baseSessions = buildSessionsForRow(i)
    const sessions = addMarchMultiDaySessions(baseSessions, i)
    rows.push({
      id: `school-${i + 1}`,
      no: count - i,
      schoolName: SCHOOL_NAMES[idx],
      region: REGIONS[idx % REGIONS.length],
      educationGrade: GRADES[i % GRADES.length],
      classCount: 2 + (i % 4),
      studentCount: 40 + (i % 30),
      lectureRound: LECTURE_ROUND_LABEL,
      textbookStatus: textbookStatuses[statusIdx],
      approvalStatus: APPROVAL_STATUSES[i % APPROVAL_STATUSES.length],
      teacherName: TEACHER_NAMES[i % TEACHER_NAMES.length],
      instructors: INSTRUCTOR_SAMPLES[i % INSTRUCTOR_SAMPLES.length],
      sessions,
    })
  }
  return rows
}

export const MOCK_PARTICIPATING_SCHOOLS: ParticipatingSchoolRow[] = buildMockList(30)
