/**
 * 로컬 ja_cms_local `[정산테스트]` 회원. 이메일·계좌·주민번호는 두지 않는다.
 * 이미 제출된 행은 스펙이 현재 상태에서 남은 전이만 진행한다.
 */
export type SettlementPayeeType = 'INSTRUCTOR' | 'PARTICIPANT' | 'VOLUNTEER'

export type SettlementMemberSlot = {
  id: string
  memberId: number
  programId: number
  scheduleId: number
  payeeType: SettlementPayeeType
  assignmentId?: number
  applicationId?: number
  volunteerApplicationId?: number
  participantId?: number
}

export const SETTLEMENT_MEMBERS = {
  m1: {
    id: 'M1',
    memberId: 190061,
    programId: 186636,
    scheduleId: 187982,
    payeeType: 'INSTRUCTOR',
    assignmentId: 1695008,
    applicationId: 1695050,
  },
  m2: {
    id: 'M2',
    memberId: 190062,
    programId: 186636,
    scheduleId: 187983,
    payeeType: 'INSTRUCTOR',
    assignmentId: 1695009,
    applicationId: 1695051,
  },
  m3: {
    id: 'M3',
    memberId: 190063,
    programId: 186636,
    scheduleId: 187984,
    payeeType: 'INSTRUCTOR',
    assignmentId: 1695010,
    applicationId: 1695052,
  },
  m4: {
    id: 'M4',
    memberId: 190064,
    programId: 186636,
    scheduleId: 187985,
    payeeType: 'INSTRUCTOR',
    assignmentId: 1695011,
    applicationId: 1695053,
  },
  m5: {
    id: 'M5',
    memberId: 190105,
    programId: 186637,
    scheduleId: 187986,
    payeeType: 'PARTICIPANT',
    applicationId: 1694755,
    participantId: 1695193,
  },
  m6: {
    id: 'M6',
    memberId: 190106,
    programId: 186637,
    scheduleId: 187986,
    payeeType: 'PARTICIPANT',
    applicationId: 1694756,
    participantId: 1695194,
  },
  m7: {
    id: 'M7',
    memberId: 190065,
    programId: 186644,
    scheduleId: 187996,
    payeeType: 'VOLUNTEER',
    volunteerApplicationId: 1691698,
    participantId: 1695197,
  },
  m8: {
    id: 'M8',
    memberId: 190066,
    programId: 186644,
    scheduleId: 187996,
    payeeType: 'VOLUNTEER',
    volunteerApplicationId: 1691699,
    participantId: 1695198,
  },
  m9: {
    id: 'M9',
    memberId: 190094,
    programId: 186640,
    scheduleId: 187989,
    payeeType: 'VOLUNTEER',
    volunteerApplicationId: 1691691,
    participantId: 1695204,
  },
  m10Teacher: {
    id: 'M10',
    memberId: 190080,
    programId: 186640,
    scheduleId: 187989,
    payeeType: 'VOLUNTEER',
    applicationId: 1691668,
  },
} as const satisfies Record<string, SettlementMemberSlot>

export const DRAFT_PROGRAM_ID = 186639
export const CANCELLED_VOLUNTEER_APPLICATION_IDS = [1691692, 1691693] as const

/** 시드에 있으면 미리보기만 한다. 제출하지 않는다. */
export const COMPANY_SCHOOL_PREVIEW = {
  memberId: 190001,
  assignmentId: 1695005,
  programId: 186572,
} as const
