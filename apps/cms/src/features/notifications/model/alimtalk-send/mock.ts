import type {
  AlimtalkSendMemberType,
  AlimtalkSendParticipationType,
  AlimtalkSendRecipient,
} from './types'

const PARTICIPATION_CYCLE: AlimtalkSendParticipationType[] = [
  'instructor',
  'participant',
  'volunteer',
]

const MEMBER_CYCLE: Exclude<AlimtalkSendMemberType, ''>[] = [
  'general',
  'school_teacher',
  'instructor',
  'teacher_instructor',
  'admin',
]

export const ALIMTALK_SEND_RECIPIENT_MOCK: AlimtalkSendRecipient[] = Array.from(
  { length: 55 },
  (_, index) => {
    const participationType = PARTICIPATION_CYCLE[index % PARTICIPATION_CYCLE.length] ?? 'participant'
    const memberType = MEMBER_CYCLE[index % MEMBER_CYCLE.length] ?? 'general'
    return {
      id: `at-recv-${String(index + 1).padStart(3, '0')}`,
      participationType,
      memberType,
      typeLabel: undefined,
      name: '홍길동',
      phone: '010-1234-5678',
      source: 'program' as const,
    }
  }
)
