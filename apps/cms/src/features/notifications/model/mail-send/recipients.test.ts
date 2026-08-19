import { describe, expect, it } from 'vitest'
import {
  createManualRecipient,
  filterMailSendRecipients,
  isMailSendEmail,
  mergeMailSendRecipients,
} from './recipients'
import { listMailSendProgramPickerRows } from './programs'
import { MAIL_SEND_ALL_PROGRAM_ID, type MailSendProgram, type MailSendRecipient } from './types'

const programs: MailSendProgram[] = [
  { id: 'prog-a', name: 'JA Company Of The Year', year: 2026 },
  { id: 'prog-b', name: 'JA Job Shadow', year: 2025 },
]

const recipients: MailSendRecipient[] = [
  {
    id: 'a',
    participationType: 'instructor',
    name: '홍길동',
    email: 'a@jakorea.org',
    source: 'program',
  },
  {
    id: 'b',
    participationType: 'volunteer',
    name: '김철수',
    email: 'b@jakorea.org',
    source: 'program',
  },
]

describe('listMailSendProgramPickerRows', () => {
  it('prepends the all-program row', () => {
    const rows = listMailSendProgramPickerRows(programs, { year: '', keyword: '' })
    expect(rows[0]?.id).toBe(MAIL_SEND_ALL_PROGRAM_ID)
    expect(rows).toHaveLength(3)
  })

  it('keeps the all-program row when filtering by year', () => {
    const rows = listMailSendProgramPickerRows(programs, { year: 2026, keyword: '' })
    expect(rows.map(row => row.id)).toEqual([MAIL_SEND_ALL_PROGRAM_ID, 'prog-a'])
  })

  it('hides the all-program row when the name search does not match', () => {
    const rows = listMailSendProgramPickerRows(programs, { year: '', keyword: 'Job' })
    expect(rows.map(row => row.id)).toEqual(['prog-b'])
  })
})

describe('mergeMailSendRecipients', () => {
  it('appends unseen ids only', () => {
    const merged = mergeMailSendRecipients(recipients, [
      recipients[0]!,
      {
        id: 'c',
        participationType: '',
        name: '',
        email: 'c@jakorea.org',
        source: 'manual',
      },
    ])
    expect(merged.map(item => item.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('filterMailSendRecipients', () => {
  it('filters by participation type and keyword', () => {
    expect(
      filterMailSendRecipients(recipients, { participationType: 'volunteer', keyword: '' }).map(
        item => item.id
      )
    ).toEqual(['b'])
    expect(
      filterMailSendRecipients(recipients, { participationType: '', keyword: '홍' }).map(
        item => item.id
      )
    ).toEqual(['a'])
  })
})

describe('createManualRecipient', () => {
  it('normalizes email and leaves participation type empty', () => {
    expect(isMailSendEmail('not-an-email')).toBe(false)
    expect(createManualRecipient('  rkdtk@naver.com ')).toEqual({
      id: 'manual-rkdtk@naver.com',
      participationType: '',
      name: '',
      email: 'rkdtk@naver.com',
      source: 'manual',
    })
  })
})
