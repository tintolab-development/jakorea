/**
 * 프로그램 진행현황 - 강사 정보 Mock 데이터
 * 참여 강사진 목록 (필터: 교육 학년, 강의 진행 회차, 정산 현황, 교사/강사명)
 */

export type SettlementStatusKey = 'pending' | 'partial' | 'completed' | 'na'

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
}

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatusKey, string> = {
  pending: '정산 대기',
  partial: '일부 정산 완료',
  completed: '정산 완료',
  na: '해당 없음',
}

const INSTRUCTOR_NAMES = [
  '김틴토',
  '이강사',
  '박틴토',
  '최강사',
  '정멘토',
  '강틴토',
  '조강사',
  '윤멘토',
  '장틴토',
  '임강사',
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

const TEACHER_NAMES = [
  '홍길동',
  '김길동',
  '박길동',
  '이길동',
  '최길동',
  '정길동',
  '강길동',
  '조길동',
]

const settlementStatuses: SettlementStatusKey[] = ['pending', 'partial', 'completed', 'na']

function buildMockList(count: number): ParticipatingInstructorRow[] {
  const rows: ParticipatingInstructorRow[] = []
  for (let i = 0; i < count; i++) {
    const statusIdx = i % settlementStatuses.length
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
    })
  }
  return rows
}

export const MOCK_PARTICIPATING_INSTRUCTORS: ParticipatingInstructorRow[] = buildMockList(72)
