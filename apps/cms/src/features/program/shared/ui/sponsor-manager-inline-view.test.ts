import { describe, expect, it } from 'vitest'
import { splitSponsorManagerPipeLine } from './sponsor-manager-inline-view'

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
