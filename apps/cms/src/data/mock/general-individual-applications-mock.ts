/**
 * 일반 프로그램 상세 — 개인(참여자) 신청 목록 mock
 */

import type { ApplicantApprovalStatusKey } from '@/data/mock/applicant-institutions'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'

/** 일반 프로그램 개인 참여자 신청 상세 확장 필드 */
export interface GeneralIndividualApplicantDetail {
  gender?: string
  birthDate?: string
  age?: number
  schoolEnrollmentStatus?: string
  affiliationSchool?: string
  affiliationGrade?: string
  contact?: string
  email?: string
  homeAddressFull?: string
  id1365?: string
  selfIntroduction?: string
  teamName?: string
  teamMemberCount?: number
  teamRole?: 'leader' | 'member'
  scheduleChangeCancelCount?: number
}

export interface GeneralIndividualApplicantRow {
  id: string
  no: number
  applicantName: string
  affiliation: string
  educationGrade: string
  homeAddress: string
  approvalStatus: ApplicantApprovalStatusKey
  programId?: string
  sessions?: ParticipatingSchoolSession[]
  detail?: GeneralIndividualApplicantDetail
  participationRejectionReason?: string
  /** 승인/반려 알림 발송 일시 — 상세 승인 현황 행 표시 */
  approvalNotificationSentAt?: string
  /** 신청 건별 관리자 코멘트 (회원 상세 adminComment와 별도) */
  adminComment?: string
}

export function formatApprovalNotificationSentAt(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}:${ss}`
}

export function patchGeneralIndividualApplicantForApprovalStatus(
  row: GeneralIndividualApplicantRow,
  approvalStatus: ApplicantApprovalStatusKey
): GeneralIndividualApplicantRow {
  if (approvalStatus === 'approved' || approvalStatus === 'rejected') {
    return {
      ...row,
      approvalStatus,
      approvalNotificationSentAt: formatApprovalNotificationSentAt(),
    }
  }
  return {
    ...row,
    approvalStatus,
    approvalNotificationSentAt: undefined,
  }
}

const APPLICANT_NAMES = [
  '고종욱',
  '김규성',
  '이서연',
  '박지민',
  '최유진',
  '정하은',
  '강민수',
  '윤서준',
  '임도현',
  '한소희',
  '오지훈',
  '신예린',
  '류태양',
  '문채원',
  '배준호',
  '송다은',
  '홍길동',
  '김범수',
  '이영희',
  '박철수',
  '최민지',
  '정우진',
  '강하늘',
  '조아라',
  '윤도윤',
  '임서연',
  '한지우',
  '오세훈',
  '신동엽',
  '류승민',
]

const AFFILIATIONS = [
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
]

const HOME_ADDRESSES = [
  '서울특별시 강서구',
  '서울특별시 마포구',
  '서울특별시 관악구',
  '부산광역시 해운대구',
  '대구광역시 수성구',
  '인천광역시 남동구',
  '광주광역시 광산구',
  '대전광역시 유성구',
  '울산광역시 중구',
  '경기도 수원시',
]

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

const APPROVAL_STATUSES: ApplicantApprovalStatusKey[] = ['pending', 'rejected', 'approved']

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토']

function buildSessionsForRow(rowIndex: number): ParticipatingSchoolSession[] {
  const sessionCount = 1 + (rowIndex % 4)
  const sessions: ParticipatingSchoolSession[] = []
  for (let s = 0; s < sessionCount; s++) {
    const dayOffset = rowIndex * 3 + s * 2
    const d = new Date(2026, 5, 2 + dayOffset)
    const dayOfWeek = DAYS_OF_WEEK[d.getDay()]
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    sessions.push({
      round: s + 1,
      date: dateStr,
      dayOfWeek,
      duration: '2시간',
      format: s % 2 === 0 ? '오프라인' : '온라인',
      classNum: `${s + 1}교시`,
      timeRange: `${9 + s}:20~${11 + s}:20`,
      status: 'pending',
    })
  }
  return sessions
}

/** 스크린샷·데모용: general-individual-applicant-1 (고종욱) 상세 — 승인 대기 + 전 필드 */
const APPLICANT_INDIVIDUAL_1_DETAIL: GeneralIndividualApplicantDetail = {
  gender: '남성',
  birthDate: '2014.05.10',
  age: 11,
  schoolEnrollmentStatus: '재학 중',
  affiliationSchool: '강서초등학교',
  affiliationGrade: '5학년',
  contact: '010-2345-6789',
  email: 'jongwook.ko@example.com',
  homeAddressFull: '서울특별시 강서구 화곡동 456-78 102동 501호',
  id1365: '05101234',
  scheduleChangeCancelCount: 1,
  selfIntroduction:
    '안녕하세요. 강서초등학교 5학년 고종욱입니다. JA Korea 경제·금융 교육 봉사에 참여하고 싶어 신청했습니다. 학교에서 친구들과 함께 봉사 동아리 활동을 하며, 어린이들에게 쉽게 설명하는 것을 좋아합니다. 이번 프로그램을 통해 배운 내용을 또래 친구들과 나누고, 성실하게 봉사하겠습니다.',
  teamName: 'JA 봉사팀',
  teamMemberCount: 3,
  teamRole: 'leader',
}

/** 스크린샷 시안 기준: general-individual-applicant-18 (김범수) 상세 */
const APPLICANT_INDIVIDUAL_18_DETAIL: GeneralIndividualApplicantDetail = {
  gender: '여성',
  birthDate: '2010.09.15',
  age: 15,
  schoolEnrollmentStatus: '재학 중',
  affiliationSchool: '고등학교',
  affiliationGrade: '1학년',
  contact: '010-9876-5432',
  email: 'haksa1234@naver.com',
  homeAddressFull: '서울특별시 강서구 화곡동 123-45 101동 202호',
  id1365: '09151234',
  scheduleChangeCancelCount: 1,
  selfIntroduction:
    '안녕하세요. 저는 교육 봉사에 큰 관심을 가지고 있는 학생입니다. JA Korea 프로그램을 통해 경제·금융 교육에 참여하고 싶어 신청하게 되었습니다. 학교에서 봉사활동을 꾸준히 해왔고, 특히 어린이 대상 교육 봉사에 열정을 가지고 있습니다. 이번 프로그램을 통해 더 많은 경험을 쌓고, 지역사회에 기여하고 싶습니다. 감사합니다.',
  teamName: '우리가 최고',
  teamMemberCount: 2,
  teamRole: 'leader',
}

function buildMockList(count: number): GeneralIndividualApplicantRow[] {
  const rows: GeneralIndividualApplicantRow[] = []
  for (let i = 0; i < count; i++) {
    const idx = i % APPLICANT_NAMES.length
    rows.push({
      id: `general-individual-applicant-${i + 1}`,
      no: count - i,
      applicantName: APPLICANT_NAMES[idx],
      affiliation: AFFILIATIONS[i % AFFILIATIONS.length],
      educationGrade: GRADES[i % GRADES.length],
      homeAddress: HOME_ADDRESSES[i % HOME_ADDRESSES.length],
      approvalStatus: APPROVAL_STATUSES[i % APPROVAL_STATUSES.length],
      sessions: buildSessionsForRow(i),
    })
  }
  return rows
}

export const MOCK_GENERAL_INDIVIDUAL_APPLICATIONS: GeneralIndividualApplicantRow[] = (() => {
  const list = buildMockList(30)
  const row1 = list.find(r => r.id === 'general-individual-applicant-1')
  if (row1) {
    row1.applicantName = '고종욱'
    row1.affiliation = '강서초등학교'
    row1.educationGrade = '5학년'
    row1.homeAddress = '서울특별시 강서구'
    row1.approvalStatus = 'pending'
    row1.detail = APPLICANT_INDIVIDUAL_1_DETAIL
  }
  const row = list.find(r => r.id === 'general-individual-applicant-18')
  if (row) {
    row.applicantName = '김범수'
    row.approvalStatus = 'approved'
    row.approvalNotificationSentAt = '2026.01.15 09:15:42'
    row.detail = APPLICANT_INDIVIDUAL_18_DETAIL
  }
  const row2 = list.find(r => r.id === 'general-individual-applicant-2')
  if (row2) {
    row2.participationRejectionReason = '인원초과'
    row2.approvalNotificationSentAt = '2024.01.15 09:15:42'
    row2.detail = {
      gender: '여성',
      birthDate: '2010.09.15',
      age: 15,
      schoolEnrollmentStatus: '재학 중',
      affiliationSchool: '고등학교',
      affiliationGrade: '1학년',
      teamName: '우리가 최고',
      teamMemberCount: 2,
      teamRole: 'member',
    }
  }
  return list
})()

export function getGeneralIndividualApplicationsForProgram(
  programId: string
): GeneralIndividualApplicantRow[] {
  return MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.map(row => ({
    ...row,
    programId,
  }))
}

export function updateGeneralIndividualApplicantApprovalStatus(
  applicantId: string,
  approvalStatus: ApplicantApprovalStatusKey
): void {
  const row = MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.find(r => r.id === applicantId)
  if (row) {
    Object.assign(row, patchGeneralIndividualApplicantForApprovalStatus(row, approvalStatus))
  }
}

export function updateGeneralIndividualApplicantTeamRole(
  applicantId: string,
  teamRole: NonNullable<GeneralIndividualApplicantDetail['teamRole']>
): void {
  const row = MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.find(r => r.id === applicantId)
  if (!row) return
  row.detail = { ...row.detail, teamRole }
}

export interface GeneralIndividualApplicantDetailSavePayload {
  adminComment?: string
}

/** 개인 참여자 신청 상세 필드 갱신 (mock) — 회원 프로필과 분리 */
export function patchGeneralIndividualApplicantDetail(
  applicantId: string,
  payload: GeneralIndividualApplicantDetailSavePayload
): GeneralIndividualApplicantRow | null {
  const row = MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.find(r => r.id === applicantId)
  if (!row) return null

  const adminTrimmed = payload.adminComment?.trim()
  row.adminComment = adminTrimmed ? adminTrimmed : undefined
  return { ...row }
}
