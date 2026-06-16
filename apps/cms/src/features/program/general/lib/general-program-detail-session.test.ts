import { describe, expect, it } from 'vitest'
import { getGeneralProgramById } from '@/data/mock/general-programs'
import {
  applyGeneralProgramDetailSession,
  setGeneralProgramDetailSession,
} from './general-program-detail-session'

describe('generalProgramDetailSession', () => {
  it('저장 스냅샷이 mock 재조회보다 조회 화면에 우선한다', () => {
    const base = getGeneralProgramById('general-prog-scheduled-1')
    expect(base).toBeDefined()

    const saved: typeof base = {
      ...base!,
      mainTitle: '수정된 대표 프로그램명',
      generalCommonInfo: {
        ...base!.generalCommonInfo,
        announcementTitle: '수정된 공고용 프로그램명',
      },
    }
    setGeneralProgramDetailSession(saved)

    const displayed = applyGeneralProgramDetailSession(base!)
    expect(displayed.mainTitle).toBe('수정된 대표 프로그램명')
    expect(displayed.generalCommonInfo?.announcementTitle).toBe('수정된 공고용 프로그램명')
  })
})
