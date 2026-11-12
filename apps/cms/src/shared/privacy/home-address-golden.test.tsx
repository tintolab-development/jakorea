/** @vitest-environment jsdom */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { maskHomeAddressLine, PrivacyHomeAddressDisplay } from '@jakorea/ui/privacy'
import { MASKING_POLICY } from '@/shared/constants/download-policy'

/** JABACK·JAHOMEADMINBACK PrivacyMaskingGoldenVectorTest 와 같은 fixture SHA-256 */
const FIXTURE_SHA256 = 'cc22ec9917772235d59a5ba73e10658f39bc6991efc2a481d16739ae1651616c'
const fixturePath = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'masking-golden-vectors.json')
const fixtureBytes = readFileSync(fixturePath)
const fixture = JSON.parse(fixtureBytes.toString('utf8')) as {
  cases: { id: string; type: string; input: string; expected: string }[]
}

afterEach(cleanup)

describe('FE 자택 주소 마스킹 — BE Golden Vector 일치 (Step 6.1)', () => {
  it('fixture가 두 백엔드와 같은 버전이다', () => {
    expect(createHash('sha256').update(fixtureBytes).digest('hex')).toBe(FIXTURE_SHA256)
  })

  const homeAddressCases = fixture.cases.filter(c => c.type === 'HOME_ADDRESS')
  it.each(homeAddressCases.map(c => [c.id, c.input, c.expected]))('%s', (_id, input, expected) => {
    expect(maskHomeAddressLine(input)).toBe(expected)
  })
})

describe('FE 예금주 마스킹 — BE Golden Vector 일치 (기획 결정 2026-11-12)', () => {
  const holderCases = fixture.cases.filter(c => c.type === 'ACCOUNT_HOLDER')
  it('예금주 케이스가 있다', () => {
    expect(holderCases.length).toBeGreaterThanOrEqual(11)
  })
  it.each(holderCases.map(c => [c.id, c.input, c.expected]))('%s', (_id, input, expected) => {
    expect(MASKING_POLICY.accountHolderName(input)).toBe(expected)
  })
})

describe('PrivacyHomeAddressDisplay — 마스킹 모드 원문 입력 방어 (Step 6.1 P1)', () => {
  it('원문 한 줄 주소를 받아도 동·도로명까지만 보이고 나머지는 블러', () => {
    const { container } = render(
      createElement(PrivacyHomeAddressDisplay, {
        address: '서울특별시 강서구 화곡동 123-45 101호',
        revealed: false,
      })
    )
    expect(container.textContent).toBe('서울특별시 강서구 화곡동 *****')
    expect(container.textContent).not.toContain('123-45')
    expect(container.querySelector('.program-pii-address-blur')?.textContent).toBe('*****')
  })

  it('원문 상세주소를 함께 받아도 상세주소는 표시하지 않는다', () => {
    const { container } = render(
      createElement(PrivacyHomeAddressDisplay, {
        address: '서울특별시 강서구 마곡중앙로 123',
        addressDetail: '101동 1001호',
        revealed: false,
      })
    )
    expect(container.textContent).toBe('서울특별시 강서구 마곡중앙로 *****')
    expect(container.textContent).not.toContain('1001호')
  })

  it('이미 마스킹된 주소는 다시 변환하지 않는다', () => {
    const { container } = render(
      createElement(PrivacyHomeAddressDisplay, {
        address: '서울특별시 강서구 화곡동 *****',
        addressDetail: '***동 ***호',
        revealed: false,
      })
    )
    expect(container.textContent).toBe('서울특별시 강서구 화곡동 ***** ***동 ***호')
  })

  it('판단할 수 없는 주소는 원문 대신 비공개', () => {
    const { container } = render(
      createElement(PrivacyHomeAddressDisplay, { address: 'abc 101', revealed: false })
    )
    expect(container.textContent).toBe('비공개')
  })

  it('원문 열람(수정 폼) 모드는 가리지 않는다', () => {
    const { container } = render(
      createElement(PrivacyHomeAddressDisplay, {
        address: '서울특별시 강서구 화곡동 123-45',
        addressDetail: '101동 1001호',
        revealed: true,
      })
    )
    expect(container.textContent).toBe('서울특별시 강서구 화곡동 123-45 101동 1001호')
  })
})
