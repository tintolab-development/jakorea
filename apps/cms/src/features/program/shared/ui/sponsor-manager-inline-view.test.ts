import { describe, expect, it } from 'vitest'
import {
  maskSponsorManagerEmail,
  maskSponsorManagerPhone,
  splitSponsorManagerPipeLine,
} from './sponsor-manager-inline-view'

describe('splitSponsorManagerPipeLine', () => {
  it('이름 | 연락처 — 연락처만 분리', () => {
    expect(splitSponsorManagerPipeLine('이순신 책임 | 010-1234-5678')).toEqual({
      head: ['이순신 책임'],
      phone: '010-1234-5678',
    })
  })

  it('소속 | 이름 | 연락처 — 소속·이름은 head', () => {
    expect(splitSponsorManagerPipeLine('스타벅스 | 이가원 책임 | 010-1111-2222')).toEqual({
      head: ['스타벅스', '이가원 책임'],
      phone: '010-1111-2222',
    })
  })

  it('연락처 없으면 전부 head', () => {
    expect(splitSponsorManagerPipeLine('스타벅스 | 이가원 책임')).toEqual({
      head: ['스타벅스', '이가원 책임'],
    })
  })
})

describe('maskSponsorManagerPhone', () => {
  it('프로그램 공통 정보의 후원사 담당자 연락처는 가운데 4자리를 가린다', () => {
    expect(maskSponsorManagerPhone('010-1234-5678')).toBe('010-****-5678')
    expect(maskSponsorManagerPhone('01012345678')).toBe('010-****-5678')
  })

  it('이미 마스킹된 서버 값·빈 값은 그대로', () => {
    expect(maskSponsorManagerPhone('010-****-5678')).toBe('010-****-5678')
    expect(maskSponsorManagerPhone('')).toBe('')
    expect(maskSponsorManagerPhone(null)).toBe('')
  })

  it('마스킹 연락처도 연락처 칸으로 분리한다', () => {
    expect(splitSponsorManagerPipeLine('이순신 책임 | 010-****-5678')).toEqual({
      head: ['이순신 책임'],
      phone: '010-****-5678',
    })
  })
})

describe('maskSponsorManagerEmail', () => {
  it('@ 앞 3자리를 가리고, 이미 마스킹된 값·빈 값은 그대로', () => {
    expect(maskSponsorManagerEmail('mobile@example.test')).toBe('mob***@example.test')
    expect(maskSponsorManagerEmail('mob***@example.test')).toBe('mob***@example.test')
    expect(maskSponsorManagerEmail(undefined)).toBe('')
  })
})
