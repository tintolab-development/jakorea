import type {
  SmsSendMemberType,
  SmsSendParticipationType,
  SmsSendProgram,
  SmsSendRecipient,
} from './types'

export const SMS_SEND_DEFAULT_PROGRAM_ID = ''

/** 로컬 mock JWT 전용. remote API에서는 GET /api/admin/programs items[].id 를 쓴다. */
export const SMS_SEND_PROGRAM_MOCK: SmsSendProgram[] = [
  { id: '101', name: 'JA Company Of The Year', year: 2026 },
  { id: '102', name: 'JA Job Shadow', year: 2026 },
  { id: '103', name: 'JA Banks in Action', year: 2026 },
  { id: '104', name: 'JA Company Of The Year', year: 2025 },
  { id: '105', name: 'JA Job Shadow', year: 2025 },
]

const PARTICIPATION_CYCLE: SmsSendParticipationType[] = ['instructor', 'participant', 'volunteer']

const MEMBER_CYCLE: Exclude<SmsSendMemberType, ''>[] = [
  'general',
  'school_teacher',
  'instructor',
  'teacher_instructor',
  'admin',
]

export const SMS_SEND_RECIPIENT_MOCK: SmsSendRecipient[] = Array.from(
  { length: 55 },
  (_, index) => ({
    id: `sms-recv-${String(index + 1).padStart(3, '0')}`,
    participationType: PARTICIPATION_CYCLE[index % PARTICIPATION_CYCLE.length] ?? 'participant',
    memberType: MEMBER_CYCLE[index % MEMBER_CYCLE.length] ?? 'general',
    typeLabel: undefined,
    name: '홍길동',
    phone: '010-1234-5678',
    source: 'program',
    actorType: 'MEMBER',
    actorId: index + 1,
  })
)
