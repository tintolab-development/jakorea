import type { MailSendParticipationType, MailSendProgram, MailSendRecipient } from './types'

export const MAIL_SEND_DEFAULT_SENDER = {
  name: '',
  email: '',
} as const

export const MAIL_SEND_DEFAULT_PROGRAM_ID = ''

/** 로컬 mock JWT 전용. remote API에서는 GET /api/admin/programs items[].id 를 쓴다. */
export const MAIL_SEND_PROGRAM_MOCK: MailSendProgram[] = [
  { id: '101', name: 'JA Company Of The Year', year: 2026 },
  { id: '102', name: 'JA Job Shadow', year: 2026 },
  { id: '103', name: 'JA Banks in Action', year: 2026 },
  { id: '104', name: 'JA Company Of The Year', year: 2025 },
  { id: '105', name: 'JA Job Shadow', year: 2025 },
]

const PARTICIPATION_CYCLE: MailSendParticipationType[] = [
  'instructor',
  'participant',
  'volunteer',
]

export const MAIL_SEND_RECIPIENT_MOCK: MailSendRecipient[] = Array.from(
  { length: 55 },
  (_, index) => ({
    id: `recv-${String(index + 1).padStart(3, '0')}`,
    participationType: PARTICIPATION_CYCLE[index % PARTICIPATION_CYCLE.length] ?? 'participant',
    typeLabel:
      PARTICIPATION_CYCLE[index % PARTICIPATION_CYCLE.length] === 'instructor'
        ? '강사'
        : PARTICIPATION_CYCLE[index % PARTICIPATION_CYCLE.length] === 'volunteer'
          ? '봉사자'
          : '참여자',
    name: '홍길동',
    email: 'rkdtk@naver.com',
    source: 'program',
  })
)
