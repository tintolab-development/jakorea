import type { AlimtalkSendParticipationType, AlimtalkSendRecipient } from './types'

const PARTICIPATION_CYCLE: AlimtalkSendParticipationType[] = [
  'instructor',
  'participant',
  'volunteer',
]

export const ALIMTALK_SEND_RECIPIENT_MOCK: AlimtalkSendRecipient[] = Array.from(
  { length: 55 },
  (_, index) => ({
    id: `at-recv-${String(index + 1).padStart(3, '0')}`,
    participationType: PARTICIPATION_CYCLE[index % PARTICIPATION_CYCLE.length] ?? 'participant',
    name: '홍길동',
    phone: '010-1234-5678',
    source: 'program',
  })
)
