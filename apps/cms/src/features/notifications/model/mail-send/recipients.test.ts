import { describe, expect, it } from 'vitest'
import {
  applyMailManualEntries,
  createManualRecipient,
  filterMailSendRecipients,
  isMailSendEmail,
  mergeMailSendRecipients,
} from './recipients'
import { listMailSendProgramPickerRows, uniqueProgramYears } from './programs'
import { type MailSendProgram, type MailSendRecipient } from './types'

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

describe('uniqueProgramYears', () => {
  it('omits missing years', () => {
    expect(
      uniqueProgramYears([
        { id: '1', name: 'A', year: 2026 },
        { id: '2', name: 'B', year: 0 },
        { id: '3', name: 'C', year: 2025 },
      ])
    ).toEqual([2026, 2025])
  })
})

describe('listMailSendProgramPickerRows', () => {
  it('returns filtered programs without an all-program row', () => {
    const rows = listMailSendProgramPickerRows(programs, { year: '', keyword: '' })
    expect(rows.map(row => row.id)).toEqual(['prog-a', 'prog-b'])
  })

  it('filters by year', () => {
    const rows = listMailSendProgramPickerRows(programs, { year: 2026, keyword: '' })
    expect(rows.map(row => row.id)).toEqual(['prog-a'])
  })

  it('filters by name search', () => {
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

  it('같은 이메일은 대소문자가 달라도 먼저 추가된 1건만 남긴다', () => {
    const first: MailSendRecipient = {
      id: 'actor-MEMBER-1',
      participationType: '',
      memberType: 'general',
      name: '회원1',
      email: 'User@Example.com',
      source: 'program',
      actorType: 'MEMBER',
      actorId: 1,
      variables: { '방문 안내': '오전' },
    }
    const merged = mergeMailSendRecipients(
      [first],
      [
        {
          id: 'actor-MEMBER-2',
          participationType: '',
          name: '회원2',
          email: 'user@example.com',
          source: 'program',
          actorType: 'MEMBER',
          actorId: 2,
          variables: { '방문 안내': '오후' },
        },
      ]
    )
    expect(merged).toEqual([first])
    expect(merged[0]?.actorId).toBe(1)
    expect(merged[0]?.variables).toEqual({ '방문 안내': '오전' })
  })

  it('직접 입력 뒤에 같은 주소 회원이 와도 수기 값과 기존 행을 유지한다', () => {
    const manual = createManualRecipient('direct@example.com', { '방문 안내': '오전' })
    const merged = mergeMailSendRecipients(
      [manual],
      [
        {
          id: 'actor-MEMBER-9',
          participationType: '',
          name: '회원9',
          email: 'DIRECT@example.com',
          source: 'program',
          actorType: 'MEMBER',
          actorId: 9,
        },
      ]
    )
    expect(merged).toEqual([manual])
    expect(merged[0]?.actorId).toBeUndefined()
    expect(merged[0]?.variables).toEqual({ '방문 안내': '오전' })
  })

  it('마스킹된 이메일은 서로 다른 수신자로 유지한다', () => {
    const merged = mergeMailSendRecipients(
      [
        {
          id: 'actor-MEMBER-1',
          participationType: '',
          name: '가',
          email: 'a***@example.com',
          source: 'program',
          actorType: 'MEMBER',
          actorId: 1,
        },
      ],
      [
        {
          id: 'actor-MEMBER-2',
          participationType: '',
          name: '나',
          email: 'a***@example.com',
          source: 'program',
          actorType: 'MEMBER',
          actorId: 2,
        },
      ]
    )
    expect(merged.map(item => item.actorId)).toEqual([1, 2])
  })
})

describe('applyMailManualEntries', () => {
  it('팝업에서 지운 행은 남기고, 남은 직접 입력의 변수값만 갱신한다', () => {
    const kept = createManualRecipient('keep@example.com', { '방문 안내': '오전' })
    const removedInModal = createManualRecipient('stay@example.com', { '방문 안내': '유지' })
    const member: MailSendRecipient = {
      id: 'actor-MEMBER-3',
      participationType: '',
      name: '회원',
      email: 'member@example.com',
      source: 'program',
      actorType: 'MEMBER',
      actorId: 3,
      variables: { '방문 안내': '회원값' },
    }
    const next = applyMailManualEntries(
      [kept, removedInModal, member],
      [
        { contact: 'keep@example.com', variables: { '방문 안내': '수정' } },
        { contact: 'member@example.com', variables: { '방문 안내': '덮어쓰면 안 됨' } },
      ]
    )
    expect(next.map(item => item.email)).toEqual([
      'keep@example.com',
      'stay@example.com',
      'member@example.com',
    ])
    expect(next[0]?.variables).toEqual({ '방문 안내': '수정' })
    expect(next[1]?.variables).toEqual({ '방문 안내': '유지' })
    expect(next[2]?.actorId).toBe(3)
    expect(next[2]?.variables).toEqual({ '방문 안내': '회원값' })
  })
})

describe('filterMailSendRecipients', () => {
  it('filters by participation type and keyword', () => {
    expect(
      filterMailSendRecipients(recipients, {
        typeMode: 'participation',
        typeValue: 'volunteer',
        keyword: '',
      }).map(item => item.id)
    ).toEqual(['b'])
    expect(
      filterMailSendRecipients(recipients, {
        typeMode: 'participation',
        typeValue: '',
        keyword: '홍',
      }).map(item => item.id)
    ).toEqual(['a'])
  })
})

describe('createManualRecipient', () => {
  it('normalizes email and leaves participation type empty', () => {
    expect(isMailSendEmail('not-an-email')).toBe(false)
    expect(createManualRecipient('  rkdtk@naver.com ')).toEqual({
      id: 'manual-rkdtk@naver.com',
      participationType: '',
      memberType: '',
      typeLabel: '',
      name: '',
      email: 'rkdtk@naver.com',
      source: 'manual',
      actorType: 'DIRECT',
    })
  })
})
