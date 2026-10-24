import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resolveGeneralProgramInstructorRecruitmentDisplay } from '@/features/program/general/lib/instructor-recruitment-display'

describe('최종 합격자 발표 — 방법 표시', () => {

  it('수정 저장 후 합성 라벨이 있어도 날짜가 두 번 나오지 않는다', () => {
    const display = resolveGeneralProgramInstructorRecruitmentDisplay({
      finalPassAnnouncementDate: '2026-10-07T15:00:00.000Z',
      finalPassAnnouncementMethod: '○○○',
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          finalAnnouncementLabel: '2026.10.08(목) | ○○○',
        },
      },
    } as unknown as Program)
    expect(display.finalPassAnnouncementMethod).toBe('○○○')
  })
})
