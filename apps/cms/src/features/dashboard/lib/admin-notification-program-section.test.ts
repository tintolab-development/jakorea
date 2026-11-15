import { describe, expect, it } from 'vitest'

import { applyProgramDetailSection } from './admin-notification-program-section'

describe('applyProgramDetailSection', () => {
  it('일반 프로그램은 진행 현황의 해당 탭으로 바꾸고 programId는 그대로 둔다', () => {
    const url = applyProgramDetailSection('/programs/general?programId=10&lnb=info&tab=info', 'instructors')
    const params = new URLSearchParams(url.split('?')[1])
    expect(url.startsWith('/programs/general?')).toBe(true)
    expect(params.get('programId')).toBe('10')
    expect(params.get('lnb')).toBe('progress')
    expect(params.get('tab')).toBe('progress_instructors')
  })

  it('1사1교는 참여 기관 탭, 게시글처럼 해당 탭이 없으면 기본 정보 탭 그대로', () => {
    const base = '/programs/company-school?programId=10&lnb=info&tab=info'
    expect(new URLSearchParams(applyProgramDetailSection(base, 'participants').split('?')[1]).get('tab')).toBe(
      'institutions'
    )
    expect(applyProgramDetailSection(base, 'posts')).toBe(base)
  })

  it('UJAT 등 탭 구성이 다른 유형은 바꾸지 않는다', () => {
    const base = '/programs/ujat?programId=10&lnb=info&tab=info'
    expect(applyProgramDetailSection(base, 'participants')).toBe(base)
  })
})
