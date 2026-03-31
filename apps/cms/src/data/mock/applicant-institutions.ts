/**
 * 프로그램 상세 - 신청자 목록 탭 (신청 학교) Mock 데이터
 * 수강 신청 학교 목록 (필터: 학교명, 지역, 대상 학년, 담당 교사명, 결재 현황)
 */

import type {
  ParticipatingSchoolSession,
  ParticipatingSchoolSessionStatusKey,
} from './participating-schools'

export type ApplicantApprovalStatusKey = 'pending' | 'rejected' | 'approved'

/** 신청 기관 상세 — 기본 정보·안내 사항 확장 필드 (mock/UI 공통) */
export interface ApplicantInstitutionDetailExtend {
  addressDetail?: string
  educationLocation?: string
  educationType?: string
  textbookName?: string
  totalHoursAndSessions?: string
  previousYearParticipation?: string
  affiliatedFinancialCompany?: string
  /** 담당 교사 정보 (교사명 | Tel | M | E-mail) */
  teacherInfo?: string
  applicationReason?: string
  otherRequests?: string
  computerInSpace?: string
  waitingRoom?: string
  parkingInfo?: string
  mealInfo?: string
  sexOffenseCheckRequest?: string
  /** 성범죄 경력 조회서 첨부 파일명 (표시용) */
  sexOffenseRecordAttachmentFileName?: string
}

export interface ApplicantSchoolRow {
  id: string
  no: number
  schoolName: string
  region: string
  /** 희망 교육 진행 기간 (예: 26.01.09(금)~26.01.30(금)) - 하위 호환용, sessions 우선 */
  desiredEducationPeriod?: string
  educationGrade: string
  classCount: number
  studentCount: number
  teacherName: string
  contact?: string
  appliedAt?: string
  approvalStatus: ApplicantApprovalStatusKey
  /** 일정 변경&취소 이력 횟수 (참여 학교명 옆 배지용) */
  scheduleChangeCancelCount?: number
  /** 프로그램 ID (수강 신청 학교 목록 모달에서 프로그램별 필터용) */
  programId?: string
  /** 강의 회차 별 희망 교육 날짜 및 시간 (참여 기관과 동일 형식) */
  sessions?: ParticipatingSchoolSession[]
  /** 담당 강사(들) — 신청 단계에서는 미배정일 수 있음 */
  assignedInstructorNames?: string
  /** 기본 정보·안내 사항 상세 (mock 시안용) */
  detail?: ApplicantInstitutionDetailExtend
  /** 참여 반려 시 사유 (프로그램 승인 현황 영역 표시용) */
  participationRejectionReason?: string
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

const REGIONS = [
  '서울특별시 강서구 화곡동 3394-23 302호',
  '서울특별시 마포구 상수동 511-2',
  '서울특별시 관악구 남현동 123-45',
  '부산광역시 북구',
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

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

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

const APPROVAL_STATUSES: ApplicantApprovalStatusKey[] = ['pending', 'rejected', 'approved']

const DESIRED_PERIODS = [
  '26.01.09(금)~26.01.30(금)',
  '26.02.01(월)~26.02.28(금)',
  '26.03.01(일)~26.03.31(월)',
]

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토']

const SESSION_STATUSES: ParticipatingSchoolSessionStatusKey[] = [
  'completed',
  'pending',
  'not_planned',
]

function buildSessionsForRow(rowIndex: number): ParticipatingSchoolSession[] {
  const sessionCount = 1 + (rowIndex % 5)
  const sessions: ParticipatingSchoolSession[] = []
  for (let s = 0; s < sessionCount; s++) {
    const dayOffset = rowIndex * 7 + s * 3
    const d = new Date(2026, 0, 9 + dayOffset)
    const dayOfWeek = DAYS_OF_WEEK[d.getDay()]
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    const status = SESSION_STATUSES[(rowIndex + s) % 3]
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

function buildMockList(count: number, programIds?: string[]): ApplicantSchoolRow[] {
  const rows: ApplicantSchoolRow[] = []
  for (let i = 0; i < count; i++) {
    const idx = i % SCHOOL_NAMES.length
    const statusIdx = i % APPROVAL_STATUSES.length
    const scheduleChangeCancelCount = i % 5 === 0 ? 0 : i % 5 === 1 ? 1 : 2
    rows.push({
      id: `applicant-school-${i + 1}`,
      no: count - i,
      schoolName: SCHOOL_NAMES[idx],
      region: REGIONS[idx % REGIONS.length],
      desiredEducationPeriod: DESIRED_PERIODS[i % DESIRED_PERIODS.length],
      educationGrade: GRADES[i % GRADES.length],
      classCount: 5 + (i % 4),
      studentCount: 130 + (i % 50),
      teacherName: TEACHER_NAMES[i % TEACHER_NAMES.length],
      contact: `010-1234-${(1000 + i).toString()}`,
      appliedAt: `2026.01.${(10 + (i % 20)).toString().padStart(2, '0')}`,
      approvalStatus: APPROVAL_STATUSES[statusIdx],
      scheduleChangeCancelCount:
        scheduleChangeCancelCount > 0 ? scheduleChangeCancelCount : undefined,
      programId: programIds?.[i % programIds.length],
      sessions: buildSessionsForRow(i),
      assignedInstructorNames: statusIdx === 2 ? `김강사${(i % 3) + 1}` : undefined,
    })
  }
  return rows
}

/** 스크린샷 시안 기준: applicant-school-1 상세 */
const APPLICANT_SCHOOL_1_DETAIL: ApplicantInstitutionDetailExtend = {
  addressDetail: '-',
  educationLocation: '기관 안 | 교육 진행 대상 학급의 교실',
  educationType: '온/오프라인',
  textbookName: '성공하는 경제생활',
  totalHoursAndSessions: '2시간 (총 2회차)',
  previousYearParticipation: '참여 X',
  affiliatedFinancialCompany: '미결연',
  /** 원문 — UI에서 대기/반려 시 마스킹, 개인정보 상세보기 시 원문 표시 */
  teacherInfo:
    '교사명: 이길동 | Tel : 062-1234-0000 | M : 010-9876-5432 | E-mail : tinto@naver.com',
  applicationReason: '아이들의 경제감각 성장에 큰 도움이 될 것 같아 신청합니다!',
  otherRequests: '혹시 다른 학년도 동일하게 추가 신청이 가능할까요?',
  computerInSpace: '1대 사용 가능 | USB 사용 불가',
  waitingRoom: '있음 | 교내 1층 귀빈실',
  parkingInfo: '있음 | 학교 정문 앞 주차장 사용 가능',
  mealInfo: '제공 | 인당 4,500원씩 내시면 급식실에서 식사 가능하세요 ~',
  sexOffenseCheckRequest: '온라인 제출 | ID : tinto | 검증번호 : 940412',
  sexOffenseRecordAttachmentFileName: '2026_초등 경제교육 봉사단 모집_cover.JPG',
}

const APPLICANT_SCHOOL_1_SESSIONS: ParticipatingSchoolSession[] = [
  {
    round: 1,
    date: '2026.01.09',
    dayOfWeek: '금',
    duration: '1시간',
    format: '오프라인',
    classNum: '1교시',
    timeRange: '9:20~10:10',
    status: 'pending',
  },
  {
    round: 2,
    date: '2026.01.30',
    dayOfWeek: '금',
    duration: '1시간',
    format: '온라인',
    classNum: '2교시',
    timeRange: '10:20~11:10',
    status: 'pending',
  },
  {
    round: 3,
    date: '',
    dayOfWeek: '',
    duration: '',
    format: '',
    classNum: '',
    timeRange: '',
    status: 'not_planned',
  },
  {
    round: 4,
    date: '',
    dayOfWeek: '',
    duration: '',
    format: '',
    classNum: '',
    timeRange: '',
    status: 'not_planned',
  },
]

export const MOCK_APPLICANT_INSTITUTIONS: ApplicantSchoolRow[] = (() => {
  const list = buildMockList(30)
  const row = list.find(s => s.id === 'applicant-school-1')
  if (row) {
    row.teacherName = '이길동'
    row.contact = '062-1234-0000'
    row.desiredEducationPeriod = '26.01.09(금)~26.01.30(금)'
    row.detail = APPLICANT_SCHOOL_1_DETAIL
    row.sessions = APPLICANT_SCHOOL_1_SESSIONS
  }
  const row2 = list.find(s => s.id === 'applicant-school-2')
  if (row2) {
    row2.participationRejectionReason = '인원 초과'
  }
  return list
})()

/**
 * 프로그램별 수강 신청 학교 목록 (모달용).
 * programId가 있으면 해당 프로그램에 연결된 행만 반환, 없으면 전체 목록 반환.
 */
export function getApplicantSchoolsByProgramId(programId: string): ApplicantSchoolRow[] {
  const withProgramId = MOCK_APPLICANT_INSTITUTIONS.some(s => s.programId != null)
  if (withProgramId) {
    return MOCK_APPLICANT_INSTITUTIONS.filter(s => s.programId === programId)
  }
  return [...MOCK_APPLICANT_INSTITUTIONS]
}

/**
 * 수강 신청 학교 결재 현황 변경 (mock 동기화).
 * 모달/탭에서 상태 변경 시 호출하면 MOCK_APPLICANT_INSTITUTIONS에 반영됨.
 */
export function updateApplicantSchoolApprovalStatus(
  schoolId: string,
  approvalStatus: ApplicantApprovalStatusKey
): void {
  const row = MOCK_APPLICANT_INSTITUTIONS.find(s => s.id === schoolId)
  if (row) {
    row.approvalStatus = approvalStatus
  }
}
