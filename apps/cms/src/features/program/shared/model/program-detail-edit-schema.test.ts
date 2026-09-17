import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  detailEditValuesToProgramPatch,
  programToDetailEditValues,
} from './program-detail-edit-schema'

const program = {
  id: 'program-1',
  title: '기존 제목',
  category: 'school',
  type: 'offline',
  format: 'workshop',
  status: 'active',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  sponsorId: 'sponsor-1',
  managerName: '담당자',
  description: '설명',
  learningSupportContent: '지원',
  applicationStartDate: '2026-01-01',
  applicationEndDate: '2026-01-31',
  resultAnnouncementDate: '2026-02-01',
  resultAnnouncementMethod: '개별 안내',
  rounds: [],
  generalCommonInfo: {
    announcementTitle: '기존 공고명',
    detailedProgramName: '기존 세부명',
  },
} as Program

describe('program detail title edit fields', () => {
  it('공고용 프로그램명과 세부 프로그램명을 독립적으로 패치한다', () => {
    const values = {
      ...programToDetailEditValues(program),
      announcementTitle: '수정 공고명',
      detailedProgramName: '수정 세부명',
    }

    const patch = detailEditValuesToProgramPatch(values, program)

    expect(patch.title).toBe('기존 제목')
    expect(patch.generalCommonInfo?.announcementTitle).toBe('수정 공고명')
    expect(patch.generalCommonInfo?.detailedProgramName).toBe('수정 세부명')
  })
})
