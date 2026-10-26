import { describe, expect, it } from 'vitest'
import { resolveProgramListDetailEntry } from './resolve-program-list-detail-entry'
import { parseGeneralDetailLnb } from './detail-url'

describe('resolveProgramListDetailEntry', () => {
  it('진행 중 일반 프로그램은 신청 목록으로 연다', () => {
    const entry = resolveProgramListDetailEntry({ lifecycleStatus: 'education_in_progress' })
    expect(entry).toEqual({ lnb: 'applicants', tab: 'institutions' })
  })

  it('일반 프로그램 목록 상세는 진행 상태와 무관하게 공통정보로 연다', () => {
    for (const lifecycleStatus of ['education_in_progress', 'completed', 'scheduled'] as const) {
      const entry = resolveProgramListDetailEntry(
        { lifecycleStatus },
        { detailSurface: 'general', statusFilter: 'in_progress' }
      )
      expect(entry).toEqual({ lnb: 'info', tab: 'info' })
      expect(parseGeneralDetailLnb(new URLSearchParams(`lnb=${entry.lnb}`))).toBe('info')
    }
  })

  it('완료 일반 프로그램은 참여자 목록으로 연다', () => {
    expect(resolveProgramListDetailEntry({ lifecycleStatus: 'completed' })).toEqual({
      lnb: 'progress',
      tab: 'institutions',
    })
  })

  it('1사1교 진행 중·완료는 기관 신청 목록으로 연다', () => {
    expect(
      resolveProgramListDetailEntry(
        { lifecycleStatus: 'completed' },
        { programType: 'company_school' }
      )
    ).toEqual({ lnb: 'applicants', tab: 'institutions' })
  })

  it('목록 위젯의 선택 상태를 canonical 상태보다 우선한다', () => {
    expect(
      resolveProgramListDetailEntry(
        { lifecycleStatus: 'scheduled' },
        { statusFilter: 'completed' }
      )
    ).toEqual({ lnb: 'progress', tab: 'institutions' })
  })
})
