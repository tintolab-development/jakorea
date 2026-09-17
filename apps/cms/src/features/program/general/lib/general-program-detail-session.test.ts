import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  applyGeneralProgramDetailSession,
  setGeneralProgramDetailSession,
} from './general-program-detail-session'

const baseProgram = {
  id: 'general-local-fixture',
  sponsorId: '',
  title: '원본 제목',
  type: 'offline',
  format: 'workshop',
  category: 'school',
  rounds: [],
  startDate: '',
  endDate: '',
  status: 'active',
  createdAt: '',
  updatedAt: '',
  mainTitle: '원본 대표명',
  generalCommonInfo: {
    announcementTitle: '원본 공고용 프로그램명',
  },
} as Program

describe('generalProgramDetailSession', () => {
  it('저장 스냅샷이 재조회보다 조회 화면에 우선한다', () => {
    const saved: Program = {
      ...baseProgram,
      mainTitle: '수정된 대표 프로그램명',
      generalCommonInfo: {
        ...baseProgram.generalCommonInfo,
        announcementTitle: '수정된 공고용 프로그램명',
      },
    }
    setGeneralProgramDetailSession(saved)

    const displayed = applyGeneralProgramDetailSession(baseProgram)
    expect(displayed.mainTitle).toBe('수정된 대표 프로그램명')
    expect(displayed.generalCommonInfo?.announcementTitle).toBe('수정된 공고용 프로그램명')
  })
})
