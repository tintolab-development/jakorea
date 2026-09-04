export const ALIMTALK_SEND_ALL_PROGRAM_ID = 'all'
/** 수신자 설정 팝업 — 기획: 한 페이지 최대 50명 */
export const ALIMTALK_SEND_PICKER_PAGE_SIZE = 50

export type AlimtalkSendTiming = 'immediate' | 'scheduled'
export type AlimtalkSendRecipientSource = 'program' | 'manual'

/**
 * 대상 프로그램 선택 시 필터/컬럼 — 참여 유형
 * 전체 / 참여자 / 강사 / 봉사자
 */
export type AlimtalkSendParticipationType = 'participant' | 'volunteer' | 'instructor' | ''

/**
 * 대상 프로그램 미선택·전체 시 필터/컬럼 — 회원 유형
 * 전체 / 일반 / 교사 / 강사 / 교사 겸 강사 / 관리자
 */
export type AlimtalkSendMemberType =
  | 'general'
  | 'school_teacher'
  | 'instructor'
  | 'teacher_instructor'
  | 'admin'
  | ''

/** 수신자 설정 팝업 유형 필터 모드 (발송 화면 3-1 SSOT) */
export type AlimtalkSendRecipientTypeMode = 'member' | 'participation'

export type AlimtalkSendRecipient = {
  id: string
  /** 프로그램 참여 유형 (프로그램 선택 시) */
  participationType: AlimtalkSendParticipationType
  /** 회원 유형 코드 (프로그램 미선택/전체 시) */
  memberType?: AlimtalkSendMemberType
  /** BE typeLabel 우선 표시 */
  typeLabel?: string
  name: string
  phone: string
  source: AlimtalkSendRecipientSource
  /** BE RecipientRequest.actorType — MEMBER / DIRECT 등 */
  actorType?: string
  actorId?: number
}

export type AlimtalkSendRecipientSearchParams = {
  typeValue: string
  keyword: string
  page: number
}
