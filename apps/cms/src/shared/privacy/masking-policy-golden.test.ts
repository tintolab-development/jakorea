import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MASKING_POLICY } from '@/shared/constants/download-policy'

/** home-address-golden.test.tsx · JABACK·JAHOMEADMINBACK PrivacyMaskingGoldenVectorTest 와 같은 fixture */
const FIXTURE_SHA256 = '427edd79fcf4f16bcc9c41ebe8e29a121fd205c536836b52ab3658c62e9ec7b5'
const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'masking-golden-vectors.json')
const fixtureBytes = readFileSync(fixturePath)
const fixture = JSON.parse(fixtureBytes.toString('utf8')) as {
  cases: { id: string; type: string; input: string; expected: string }[]
}

function casesOf(type: string): [string, string, string][] {
  return fixture.cases.filter(c => c.type === type).map(c => [c.id, c.input, c.expected])
}

describe('MASKING_POLICY — BE Golden Vector 일치', () => {
  it('fixture가 두 백엔드와 같은 버전이다', () => {
    expect(createHash('sha256').update(fixtureBytes).digest('hex')).toBe(FIXTURE_SHA256)
  })

  it.each(casesOf('PHONE'))('%s 전화번호', (_id, input, expected) => {
    expect(MASKING_POLICY.phone(input)).toBe(expected)
  })

  it.each(casesOf('HOME_ADDRESS'))('%s 자택 주소', (_id, input, expected) => {
    expect(MASKING_POLICY.address(input)).toBe(expected)
  })

  it.each(casesOf('ACCOUNT_NO'))('%s 계좌번호', (_id, input, expected) => {
    expect(MASKING_POLICY.accountNumber(input)).toBe(expected)
  })

  it.each(casesOf('RRN'))('%s 주민등록번호', (_id, input, expected) => {
    expect(MASKING_POLICY.residentNumber(input)).toBe(expected)
  })

  it.each(casesOf('EMAIL').filter(([id]) => id !== 'EMAIL-005'))(
    '%s 이메일',
    (_id, input, expected) => {
      expect(MASKING_POLICY.email(input)).toBe(expected)
    }
  )

  /**
   * HOLDER-006(5글자 이상 고정 `**`, 결정 대기 D4)은 기획 2026-11-12 Q4로 글자 수 기준이 됐다.
   * fixture는 JABACK·JAHOMEADMINBACK과 SHA-256으로 맞물려 있어 서버와 같이 바꿔야 하므로 그대로 두고
   * 여기서만 제외한다. 새 기준은 아래 예시 케이스로 확인한다.
   */
  it.each(casesOf('ACCOUNT_HOLDER').filter(([id]) => id !== 'HOLDER-006'))(
    '%s 예금주',
    (_id, input, expected) => {
      expect(MASKING_POLICY.accountHolderName(input)).toBe(expected)
    }
  )

  // 서버 반영 대기: 현재 fixture HOLDER-006은 「김수한무거→김**거」(고정 **). 새 규칙은 「김***거」.
  // JAHOMEADMINBACK 정본 fixture가 바뀌고 새 SHA가 확정되면 FE 사본과 FIXTURE_SHA256을 같이 갱신하고 이 skip을 푼다.
  it.skip('HOLDER-006 예금주 — 서버 fixture 갱신 대기', () => {
    const [, input, expected] = casesOf('ACCOUNT_HOLDER').find(([id]) => id === 'HOLDER-006')!
    expect(MASKING_POLICY.accountHolderName(input)).toBe(expected)
  })

  it.each([
    ['김민이', '김*이'],
    ['김민', '김*'],
    ['남궁민수', '남궁*수'],
    ['남궁민철수', '남궁**수'],
    ['김민철수', '김**수'],
    ['김수한무거', '김***거'],
    ['남궁민', '남*민'],
    ['황보철수', '황보*수'],
    ['선우', '선*'],
  ])('예금주 %s → %s (기획 2026-11-12 Q4, 가운데 글자 수만큼)', (input, expected) => {
    expect(MASKING_POLICY.accountHolderName(input)).toBe(expected)
  })

  it('판단할 수 없는 전화번호는 원문을 돌려주지 않는다', () => {
    for (const input of ['1588-1234', '010-12-34', 'abc010', '+82 10 1234 5678']) {
      expect(MASKING_POLICY.phone(input)).toBe('****')
    }
  })

  it('빈 값과 대시 표시는 그대로 둔다', () => {
    expect(MASKING_POLICY.phone('')).toBe('')
    expect(MASKING_POLICY.phone('-')).toBe('-')
    expect(MASKING_POLICY.address('')).toBe('')
  })
})
