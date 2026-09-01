import type { MailSendParticipationType, MailSendProgram, MailSendRecipient } from './types'

export const MAIL_SEND_DEFAULT_SENDER = {
  name: '홍길동',
  email: 'gildong@jakorea.org',
} as const

export const MAIL_SEND_DEFAULT_PROGRAM_ID = 'prog-coy-2026'

export const MAIL_SEND_PROGRAM_MOCK: MailSendProgram[] = [
  { id: 'prog-coy-2026', name: 'JA Company Of The Year', year: 2026 },
  { id: 'prog-job-2026', name: 'JA Job Shadow', year: 2026 },
  { id: 'prog-bank-2026', name: 'JA Banks in Action', year: 2026 },
  { id: 'prog-coy-2025', name: 'JA Company Of The Year', year: 2025 },
  { id: 'prog-job-2025', name: 'JA Job Shadow', year: 2025 },
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
    name: '홍길동',
    email: 'rkdtk@naver.com',
    source: 'program',
  })
)
