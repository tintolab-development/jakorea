/**
 * 일반 프로그램 상세 — 개인(참여자) 신청 목록 mock
 */

import type {
  ApplicantApprovalStatusKey,
  ApplicantSchoolApprovalNotifyOptions,
  ApplicantSchoolApprovalNotifyTiming,
} from '@/data/mock/applicant-institutions'
import { resolveApplicantSchoolApprovalNotificationSentAt } from '@/data/mock/applicant-institutions'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type { TextbookStatusKey } from '@/data/mock/participating-schools'
import { countInterviewAvailabilitySlots } from '@/features/program/general/lib/interview-availability-utils'
import type {
  GeneralDocumentScreeningStatus,
  GeneralInterviewAssignmentStatus,
  GeneralManagerEvaluation,
  GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'

export type GeneralIndividualApplicantInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export type IndividualApplicantConsentValue = 'agree' | 'disagree'

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
  personalInfoConsent?: IndividualApplicantConsentValue
  thirdPartyConsent?: IndividualApplicantConsentValue
  teamName?: string
  /** 팀 인원 수 (직접 입력 포함 최종 인원) */
  teamMemberCount?: number
  /** 셀렉트 값 — 1~5 또는 custom */
  teamMemberCountSelect?: '1' | '2' | '3' | '4' | '5' | 'custom'
  teamRole?: 'leader' | 'member'
  interviewAvailability?: GeneralIndividualApplicantInterviewAvailabilityDay[]
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
  /** 승인 알림 발송 예약 방식 */
  approvalNotifyTiming?: ApplicantSchoolApprovalNotifyTiming
  /** 반려 알림 발송 예약 방식 */
  rejectionNotifyTiming?: ApplicantSchoolApprovalNotifyTiming
  /** 승인/반려 알림 발송 일시 — 상세 승인 현황 행 표시 */
  approvalNotificationSentAt?: string
  /** 신청 건별 관리자 코멘트 (회원 상세 adminComment와 별도) */
  adminComment?: string
  /** 교재 배정 — 미선택 시 상세 '미정' */
  textbookId?: string
  textbookName?: string
  textbookKits?: number
  textbookQuantity?: number
  textbookStatus?: TextbookStatusKey
  /** 1차 서류 심사 — 담당자 평가·현황 (면접 있는 개인 프로그램) */
  managerAEvaluation?: GeneralManagerEvaluation
  managerBEvaluation?: GeneralManagerEvaluation
  documentScreeningStatus?: GeneralDocumentScreeningStatus
  interviewSlotCount?: number
  interviewAssignmentStatus?: GeneralInterviewAssignmentStatus
  assignedInterviewDateLabel?: string
  assignedInterviewTime?: string
  secondInterviewScreeningStatus?: GeneralSecondInterviewScreeningStatus
  totalScore?: number | null
  managerAScore?: number | null
  managerBScore?: number | null
  interviewEvaluationRemark?: string
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
  approvalStatus: ApplicantApprovalStatusKey,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): GeneralIndividualApplicantRow {
  if (approvalStatus === 'approved') {
    return {
      ...row,
      approvalStatus,
      participationRejectionReason: undefined,
      approvalNotifyTiming: notifyOptions?.notifyTiming,
      rejectionNotifyTiming: undefined,
      approvalNotificationSentAt:
        resolveApplicantSchoolApprovalNotificationSentAt(notifyOptions),
    }
  }
  if (approvalStatus === 'rejected') {
    return {
      ...row,
      approvalStatus,
      participationRejectionReason:
        notifyOptions?.rejectionReason ?? row.participationRejectionReason,
      approvalNotifyTiming: undefined,
      rejectionNotifyTiming: notifyOptions?.notifyTiming,
      approvalNotificationSentAt:
        resolveApplicantSchoolApprovalNotificationSentAt(notifyOptions),
    }
  }
  return {
    ...row,
    approvalStatus,
    participationRejectionReason: undefined,
    approvalNotifyTiming: undefined,
    rejectionNotifyTiming: undefined,
    approvalNotificationSentAt: undefined,
  }
}

/** 승인 취소 — 반려 처리 */
export function patchGeneralIndividualApplicantForCancelApproval(
  row: GeneralIndividualApplicantRow,
  notifyOptions: ApplicantSchoolApprovalNotifyOptions
): GeneralIndividualApplicantRow {
  return patchGeneralIndividualApplicantForApprovalStatus(row, 'rejected', notifyOptions)
}

/** 반려 취소 — 승인 대기 복원 */
export function patchGeneralIndividualApplicantForCancelRejection(
  row: GeneralIndividualApplicantRow,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): GeneralIndividualApplicantRow {
  const pending = patchGeneralIndividualApplicantForApprovalStatus(row, 'pending')
  if (!notifyOptions) {
    return pending
  }
  return {
    ...pending,
    approvalNotificationSentAt:
      resolveApplicantSchoolApprovalNotificationSentAt(notifyOptions),
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

const INTERVIEW_DATE_LABELS = [
  '26. 03. 09(월)',
  '26. 03. 10(화)',
  '26. 03. 11(수)',
  '26. 03. 12(목)',
] as const

const INTERVIEW_TIME_SLOTS = ['09:00 ~ 09:30', '10:00 ~ 10:30', '14:00 ~ 14:30'] as const

function resolveParticipantDocumentStatus(index: number): GeneralDocumentScreeningStatus {
  if (index % 11 === 0) return 'fail'
  if (index % 5 === 0 || index % 7 === 0) return 'pass'
  return 'pending'
}

function resolveParticipantInterviewAssignmentStatus(
  index: number,
  documentScreeningStatus: GeneralDocumentScreeningStatus
): GeneralInterviewAssignmentStatus {
  if (documentScreeningStatus !== 'pass') return 'waiting'
  if (index % 13 === 0) return 'withdrawn'
  if (index % 3 === 0) return 'assigned'
  return 'waiting'
}

function buildParticipantInterviewAvailability(index: number) {
  const day = INTERVIEW_DATE_LABELS[index % INTERVIEW_DATE_LABELS.length]
  const slots = INTERVIEW_TIME_SLOTS.slice(0, 1 + (index % 3)).map(String)
  return [{ dateLabel: day, slots }]
}

function buildParticipantScreeningFields(
  index: number
): Pick<
  GeneralIndividualApplicantRow,
  | 'managerAEvaluation'
  | 'managerBEvaluation'
  | 'documentScreeningStatus'
  | 'interviewSlotCount'
  | 'interviewAssignmentStatus'
  | 'assignedInterviewDateLabel'
  | 'assignedInterviewTime'
  | 'secondInterviewScreeningStatus'
  | 'managerAScore'
  | 'managerBScore'
  | 'totalScore'
> {
  const evaluationOptions: GeneralManagerEvaluation[] = ['pass', 'neutral', 'fail', 'unreviewed']
  const documentScreeningStatus = resolveParticipantDocumentStatus(index)
  const interviewAssignmentStatus = resolveParticipantInterviewAssignmentStatus(
    index,
    documentScreeningStatus
  )
  const interviewAvailability = buildParticipantInterviewAvailability(index)
  const assigned =
    interviewAssignmentStatus === 'assigned' || interviewAssignmentStatus === 'withdrawn'
  const day = interviewAvailability[0]!
  const slot = day.slots[0] ?? INTERVIEW_TIME_SLOTS[0]

  return {
    managerAEvaluation: index <= 4 ? 'unreviewed' : evaluationOptions[index % evaluationOptions.length],
    managerBEvaluation:
      index <= 4 ? 'unreviewed' : evaluationOptions[(index + 2) % evaluationOptions.length],
    documentScreeningStatus,
    interviewSlotCount: countInterviewAvailabilitySlots(interviewAvailability),
    interviewAssignmentStatus,
    ...(assigned
      ? {
          assignedInterviewDateLabel: day.dateLabel,
          assignedInterviewTime: slot,
          secondInterviewScreeningStatus:
            interviewAssignmentStatus === 'withdrawn'
              ? undefined
              : index % 4 === 0
                ? ('pass' as const)
                : undefined,
          managerAScore: index % 4 === 0 ? 4 + (index % 3) : null,
          managerBScore: index % 4 === 0 ? 3 + (index % 4) : null,
          totalScore: index % 4 === 0 ? 7 + (index % 3) : null,
        }
      : {}),
  }
}

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
  personalInfoConsent: 'agree',
  thirdPartyConsent: 'agree',
  selfIntroduction:
    '안녕하세요. 강서초등학교 5학년 고종욱입니다. JA Korea 경제·금융 교육 봉사에 참여하고 싶어 신청했습니다. 학교에서 친구들과 함께 봉사 동아리 활동을 하며, 어린이들에게 쉽게 설명하는 것을 좋아합니다. 이번 프로그램을 통해 배운 내용을 또래 친구들과 나누고, 성실하게 봉사하겠습니다.',
  teamName: 'JA 봉사팀',
  teamMemberCount: 3,
  teamMemberCountSelect: '3',
  teamRole: 'leader',
  interviewAvailability: [
    { dateLabel: '2026. 03. 10(화)', slots: ['10:00 ~ 10:30', '14:00 ~ 14:30'] },
    { dateLabel: '2026. 03. 12(목)', slots: ['11:00 ~ 11:30'] },
  ],
}

/** 스크린샷 시안: 1차 서류 심사 대상자 상세 — general-individual-applicant-3 (박틴토) */
const APPLICANT_INDIVIDUAL_DOC1_SCREENSHOT_DETAIL: GeneralIndividualApplicantDetail = {
  gender: '여성',
  birthDate: '2010.09.15',
  age: 15,
  schoolEnrollmentStatus: '재학 중',
  affiliationSchool: '고등학교',
  affiliationGrade: '1학년',
  contact: '010-1234-0000',
  email: 'haksa1234@naver.com',
  homeAddressFull: '서울특별시 강서구 화곡동 123-45 101동 202호',
  id1365: '09151234',
  scheduleChangeCancelCount: 1,
  personalInfoConsent: 'agree',
  thirdPartyConsent: 'agree',
  selfIntroduction:
    '안녕하세요. 교육봉사에 큰 관심을 가지고 있는 학생 박틴토입니다. JA Korea 프로그램을 통해 경제·금융 교육에 참여하고 싶어 신청하게 되었습니다. 학교에서 봉사활동을 꾸준히 해왔고, 특히 어린이 대상 교육 봉사에 열정을 가지고 있습니다. 저는 팀장으로서 팀원들과 협력하여 성공적인 봉사 활동을 이끌어가고 싶습니다. 이번 프로그램을 통해 더 많은 경험을 쌓고, 지역사회에 기여하고 싶습니다. 감사합니다.',
  teamName: '우리가 최고',
  teamMemberCount: 2,
  teamMemberCountSelect: '2',
  teamRole: 'leader',
  interviewAvailability: [
    { dateLabel: '26. 03. 09(월)', slots: ['15:00 ~ 15:30', '09:00 ~ 09:30'] },
    { dateLabel: '26. 03. 23(월)', slots: ['09:00 ~ 09:30', '14:00 ~ 14:30', '15:00 ~ 15:30'] },
  ],
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
  personalInfoConsent: 'agree',
  thirdPartyConsent: 'agree',
  selfIntroduction:
    '안녕하세요. 저는 교육 봉사에 큰 관심을 가지고 있는 학생입니다. JA Korea 프로그램을 통해 경제·금융 교육에 참여하고 싶어 신청하게 되었습니다. 학교에서 봉사활동을 꾸준히 해왔고, 특히 어린이 대상 교육 봉사에 열정을 가지고 있습니다. 이번 프로그램을 통해 더 많은 경험을 쌓고, 지역사회에 기여하고 싶습니다. 감사합니다.',
  teamName: '우리가 최고',
  teamMemberCount: 2,
  teamMemberCountSelect: '2',
  teamRole: 'leader',
  interviewAvailability: [
    { dateLabel: '2026. 03. 11(수)', slots: ['09:30 ~ 10:00', '15:00 ~ 15:30'] },
  ],
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
      detail: {
        interviewAvailability: buildParticipantInterviewAvailability(i),
      },
      ...buildParticipantScreeningFields(i),
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
  const row3 = list.find(r => r.id === 'general-individual-applicant-3')
  if (row3) {
    row3.applicantName = '박틴토'
    row3.affiliation = '고등학교'
    row3.educationGrade = '1학년'
    row3.homeAddress = '서울특별시 강서구 화곡동'
    row3.approvalStatus = 'pending'
    row3.documentScreeningStatus = 'pending'
    row3.managerAEvaluation = 'unreviewed'
    row3.managerBEvaluation = 'pass'
    row3.interviewSlotCount = countInterviewAvailabilitySlots(
      APPLICANT_INDIVIDUAL_DOC1_SCREENSHOT_DETAIL.interviewAvailability ?? []
    )
    row3.detail = APPLICANT_INDIVIDUAL_DOC1_SCREENSHOT_DETAIL
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

/** 1차 서류 심사 대상자 */
export function getGeneralParticipantDoc1Applicants(
  programId: string
): GeneralIndividualApplicantRow[] {
  return getGeneralIndividualApplicationsForProgram(programId).filter(
    row => row.documentScreeningStatus === 'pending'
  )
}

function sortGeneralParticipantDocPassedApplicants(
  rows: GeneralIndividualApplicantRow[]
): GeneralIndividualApplicantRow[] {
  return [...rows].sort((a, b) => {
    const aWithdrawn = a.interviewAssignmentStatus === 'withdrawn' ? 1 : 0
    const bWithdrawn = b.interviewAssignmentStatus === 'withdrawn' ? 1 : 0
    if (aWithdrawn !== bWithdrawn) return aWithdrawn - bWithdrawn
    const aSlots = a.interviewSlotCount ?? 0
    const bSlots = b.interviewSlotCount ?? 0
    if (aSlots !== bSlots) return aSlots - bSlots
    return a.no - b.no
  })
}

/** 1차 서류 합격자 */
export function getGeneralParticipantDocPassedApplicants(
  programId: string
): GeneralIndividualApplicantRow[] {
  return sortGeneralParticipantDocPassedApplicants(
    getGeneralIndividualApplicationsForProgram(programId).filter(
      row => row.documentScreeningStatus === 'pass'
    )
  )
}

/** 2차 면접 대상자 */
export function getGeneralParticipantInterview2Applicants(
  programId: string
): GeneralIndividualApplicantRow[] {
  return getGeneralIndividualApplicationsForProgram(programId).filter(
    row =>
      row.documentScreeningStatus === 'pass' &&
      (row.interviewAssignmentStatus === 'assigned' ||
        row.interviewAssignmentStatus === 'withdrawn') &&
      row.assignedInterviewDateLabel &&
      row.assignedInterviewTime
  )
}

export function updateGeneralIndividualApplicantApprovalStatus(
  applicantId: string,
  approvalStatus: ApplicantApprovalStatusKey,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): void {
  const row = MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.find(r => r.id === applicantId)
  if (row) {
    Object.assign(
      row,
      patchGeneralIndividualApplicantForApprovalStatus(row, approvalStatus, notifyOptions)
    )
  }
}

export function updateGeneralIndividualApplicantCancelApproval(
  applicantId: string,
  notifyOptions: ApplicantSchoolApprovalNotifyOptions
): void {
  const row = MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.find(r => r.id === applicantId)
  if (row) {
    Object.assign(row, patchGeneralIndividualApplicantForCancelApproval(row, notifyOptions))
  }
}

export function updateGeneralIndividualApplicantCancelRejection(
  applicantId: string,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): void {
  const row = MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.find(r => r.id === applicantId)
  if (row) {
    Object.assign(row, patchGeneralIndividualApplicantForCancelRejection(row, notifyOptions))
  }
}

/** 알림 재발송 — 발송 일시 갱신 */
export function patchGeneralIndividualApplicantForNotificationResend(
  row: GeneralIndividualApplicantRow,
  sentAt = new Date()
): GeneralIndividualApplicantRow {
  return {
    ...row,
    approvalNotificationSentAt: formatApprovalNotificationSentAt(sentAt),
  }
}

export function updateGeneralIndividualApplicantNotificationResend(
  applicantId: string,
  sentAt = new Date()
): void {
  const row = MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.find(r => r.id === applicantId)
  if (row) {
    Object.assign(row, patchGeneralIndividualApplicantForNotificationResend(row, sentAt))
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
  textbookId?: string
  textbookName?: string
  textbookKits?: number
  textbookQuantity?: number
  textbookStatus?: TextbookStatusKey
  teamName?: string
  teamMemberCount?: number
  teamMemberCountSelect?: GeneralIndividualApplicantDetail['teamMemberCountSelect']
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

  if (payload.textbookId !== undefined) row.textbookId = payload.textbookId || undefined
  if (payload.textbookName !== undefined) row.textbookName = payload.textbookName || undefined
  if (payload.textbookKits !== undefined) row.textbookKits = payload.textbookKits
  if (payload.textbookQuantity !== undefined) row.textbookQuantity = payload.textbookQuantity
  if (payload.textbookStatus !== undefined) row.textbookStatus = payload.textbookStatus

  if (
    payload.teamName !== undefined ||
    payload.teamMemberCount !== undefined ||
    payload.teamMemberCountSelect !== undefined
  ) {
    row.detail = {
      ...row.detail,
      ...(payload.teamName !== undefined ? { teamName: payload.teamName } : {}),
      ...(payload.teamMemberCount !== undefined ? { teamMemberCount: payload.teamMemberCount } : {}),
      ...(payload.teamMemberCountSelect !== undefined
        ? { teamMemberCountSelect: payload.teamMemberCountSelect }
        : {}),
    }
  }

  return { ...row }
}

export function patchGeneralIndividualApplicantManagerEvaluation(
  applicantId: string,
  manager: 'A' | 'B',
  evaluation: GeneralManagerEvaluation
): GeneralIndividualApplicantRow | null {
  const row = MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.find(r => r.id === applicantId)
  if (!row) return null
  if (manager === 'A') {
    row.managerAEvaluation = evaluation
  } else {
    row.managerBEvaluation = evaluation
  }
  return { ...row }
}
